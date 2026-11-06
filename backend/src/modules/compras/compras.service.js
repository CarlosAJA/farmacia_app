const pool = require('../../config/db.js');

const generarNumeroOrden = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM compras');
  const numero = (rows[0].total + 1).toString().padStart(5, '0');
  return `C-${numero}`;
};

const listarCompras = async (filtros = {}) => {
  const { estado, id_proveedor, id_almacen, busqueda } = filtros;

  let sql = `
    SELECT
      c.id_compra,
      c.numero_orden,
      c.fecha_compra,
      c.fecha_entrega,
      c.subtotal,
      c.iva,
      c.descuento,
      c.total,
      c.estado,
      c.tipo_pago,
      c.dias_credito,
      c.observaciones,
      p.id_proveedor,
      p.nombre_empresa AS proveedor_nombre,
      a.id_almacen,
      a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.id_usuario,
      u.nombre AS usuario_nombre,
      (SELECT COUNT(*) FROM detalle_compra dc WHERE dc.id_compra = c.id_compra) AS total_items
    FROM compras c
    INNER JOIN proveedores p ON c.id_proveedor = p.id_proveedor
    INNER JOIN almacenes a ON c.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    WHERE 1 = 1
  `;
  const params = [];

  if (estado) {
    sql += ' AND c.estado = ?';
    params.push(estado);
  }
  if (id_proveedor) {
    sql += ' AND c.id_proveedor = ?';
    params.push(id_proveedor);
  }
  if (id_almacen) {
    sql += ' AND c.id_almacen = ?';
    params.push(id_almacen);
  }
  if (busqueda) {
    sql += ' AND (c.numero_orden LIKE ? OR p.nombre_empresa LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`);
  }

  sql += ' ORDER BY c.fecha_compra DESC, c.id_compra DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerCompraPorId = async (id) => {
  const [compras] = await pool.query(`
    SELECT
      c.*,
      p.nombre_empresa AS proveedor_nombre,
      p.ruc AS proveedor_ruc,
      p.contacto AS proveedor_contacto,
      a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.nombre AS usuario_nombre
    FROM compras c
    INNER JOIN proveedores p ON c.id_proveedor = p.id_proveedor
    INNER JOIN almacenes a ON c.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_compra = ?
  `, [id]);

  if (compras.length === 0) {
    const err = new Error('Compra no encontrada');
    err.status = 404;
    throw err;
  }

  const [detalles] = await pool.query(`
    SELECT
      dc.id_detalle,
      dc.id_producto,
      dc.cantidad,
      dc.precio_unitario,
      dc.subtotal,
      dc.lote,
      dc.fecha_vencimiento_lote,
      pr.codigo AS producto_codigo,
      pr.nombre AS producto_nombre,
      pr.presentacion AS producto_presentacion
    FROM detalle_compra dc
    INNER JOIN productos pr ON dc.id_producto = pr.id_producto
    WHERE dc.id_compra = ?
  `, [id]);

  return { ...compras[0], detalles };
};

const crearCompra = async (data, id_usuario) => {
  const {
    id_proveedor,
    id_almacen,
    fecha_entrega,
    tipo_pago = 'contado',
    dias_credito = 0,
    descuento = 0,
    observaciones,
    detalles = [],
  } = data;

  if (!id_proveedor || !id_almacen) {
    const err = new Error('Proveedor y almacén son obligatorios');
    err.status = 400;
    throw err;
  }
  if (detalles.length === 0) {
    const err = new Error('Debes agregar al menos un producto');
    err.status = 400;
    throw err;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let subtotal = 0;
    for (const d of detalles) {
      subtotal += Number(d.cantidad) * Number(d.precio_unitario);
    }
    const iva = subtotal * 0.13;
    const total = subtotal + iva - Number(descuento);

    const numero_orden = await generarNumeroOrden();
    const observacionesFormateadas = observaciones ? observaciones.trim().toUpperCase() : null;
    const [result] = await connection.query(
      `INSERT INTO compras
        (numero_orden, id_usuario, id_proveedor, id_almacen, fecha_entrega,
         subtotal, iva, descuento, total, estado, tipo_pago, dias_credito, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)`,
      [
        numero_orden, id_usuario, id_proveedor, id_almacen,
        fecha_entrega || null, subtotal, iva, descuento, total,
        tipo_pago, dias_credito, observacionesFormateadas || null,
      ]
    );

    const id_compra = result.insertId;

    for (const d of detalles) {
      const subtotalLinea = Number(d.cantidad) * Number(d.precio_unitario);
      const loteFormateado = d.lote ? d.lote.trim().toUpperCase() : null;
      await connection.query(
        `INSERT INTO detalle_compra
          (id_compra, id_producto, cantidad, precio_unitario, subtotal, lote, fecha_vencimiento_lote)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_compra, d.id_producto, d.cantidad, d.precio_unitario, subtotalLinea,
          loteFormateado || null, d.fecha_vencimiento_lote || null,
        ]
      );
    }

    await connection.commit();
    return { id_compra, numero_orden };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const recibirCompra = async (id, id_usuario) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verificar la compra
    const [rows] = await connection.query('SELECT * FROM compras WHERE id_compra = ?', [id]);
    if (rows.length === 0) throw new Error('Compra no encontrada');
    if (rows[0].estado !== 'pendiente') throw new Error('La compra ya fue procesada o cancelada');

    // 2. Obtener los detalles de la compra
    const [detalles] = await connection.query('SELECT * FROM detalle_compra WHERE id_compra = ?', [id]);

    // 3. Actualizar el inventario y registrar movimientos (Lógica del Trigger)
    for (const detalle of detalles) {
      await connection.query(
        `INSERT INTO inventario (id_producto, id_almacen, cantidad) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
        [detalle.id_producto, rows[0].id_almacen, detalle.cantidad]
      );

      await connection.query(
        `INSERT INTO movimientos_inventario (id_producto, id_almacen, tipo_movimiento, cantidad, motivo, id_usuario)
         VALUES (?, ?, 'entrada', ?, ?, ?)`,
        [detalle.id_producto, rows[0].id_almacen, detalle.cantidad, `Compra recibida #${id}`, id_usuario]
      );
    }

    // 4. Cambiar el estado de la compra
    await connection.query("UPDATE compras SET estado = 'recibida' WHERE id_compra = ?", [id]);

    await connection.commit();
    return { id_compra: id, mensaje: 'Compra recibida. Inventario actualizado.' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const cancelarCompra = async (id) => {
  const [rows] = await pool.query('SELECT estado FROM compras WHERE id_compra = ?', [id]);
  if (rows.length === 0) {
    const err = new Error('Compra no encontrada');
    err.status = 404;
    throw err;
  }
  if (rows[0].estado !== 'pendiente') {
    const err = new Error(`No se puede cancelar una compra en estado "${rows[0].estado}"`);
    err.status = 400;
    throw err;
  }

  await pool.query("UPDATE compras SET estado = 'cancelada' WHERE id_compra = ?", [id]);
  return { id_compra: id, mensaje: 'Compra cancelada.' };
};

module.exports = {
  listarCompras,
  obtenerCompraPorId,
  crearCompra,
  recibirCompra,
  cancelarCompra,
};