const pool = require('../../config/db.js');

/**
 * Genera el siguiente número de factura.
 * Formato: F-00001, F-00002, ...
 */
const generarNumeroFactura = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM ventas');
  const numero = (rows[0].total + 1).toString().padStart(5, '0');
  return `F-${numero}`;
};

/**
 * Listar ventas con filtros:
 * - estado (opcional)
 * - id_almacen (opcional)
 * - busqueda (opcional): busca por numero_factura o nombre de usuario
 * - fecha_desde / fecha_hasta (opcional)
 */
const listarVentas = async (filtros = {}) => {
  const { estado, id_almacen, busqueda, fecha_desde, fecha_hasta } = filtros;

  let sql = `
    SELECT
      v.id_venta,
      v.numero_factura,
      v.fecha_venta,
      v.subtotal,
      v.iva,
      v.descuento,
      v.total,
      v.metodo_pago,
      v.estado,
      v.observaciones,
      a.id_almacen,
      a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.id_usuario,
      u.nombre AS usuario_nombre,
      (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) AS total_items
    FROM ventas v
    INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
    WHERE 1 = 1
  `;
  const params = [];

  if (estado) {
    sql += ' AND v.estado = ?';
    params.push(estado);
  }
  if (id_almacen) {
    sql += ' AND v.id_almacen = ?';
    params.push(id_almacen);
  }
  if (busqueda) {
    sql += ' AND (v.numero_factura LIKE ? OR u.nombre LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`);
  }
  if (fecha_desde) {
    sql += ' AND DATE(v.fecha_venta) >= ?';
    params.push(fecha_desde);
  }
  if (fecha_hasta) {
    sql += ' AND DATE(v.fecha_venta) <= ?';
    params.push(fecha_hasta);
  }

  sql += ' ORDER BY v.fecha_venta DESC, v.id_venta DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Obtener venta por ID con detalles.
 */
const obtenerVentaPorId = async (id) => {
  const [ventas] = await pool.query(`
    SELECT
      v.*,
      a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.nombre AS usuario_nombre
    FROM ventas v
    INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
    WHERE v.id_venta = ?
  `, [id]);

  if (ventas.length === 0) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }

  const [detalles] = await pool.query(`
    SELECT
      dv.id_detalle,
      dv.id_producto,
      dv.cantidad,
      dv.precio_unitario,
      dv.subtotal,
      p.codigo AS producto_codigo,
      p.nombre AS producto_nombre,
      p.presentacion AS producto_presentacion
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id_producto
    WHERE dv.id_venta = ?
  `, [id]);

  return { ...ventas[0], detalles };
};

/**
 * Crear venta con detalles.
 * Flujo:
 *  1. Validar stock suficiente en el almacén
 *  2. INSERT ventas con estado 'pendiente'
 *  3. INSERT detalle_venta
 *  4. UPDATE ventas SET estado='completada' → trigger descuenta stock
 */
const crearVenta = async (data, id_usuario) => {
  const {
    id_almacen,
    metodo_pago = 'efectivo',
    descuento = 0,
    observaciones,
    detalles = [],
  } = data;

  if (!id_almacen) {
    const err = new Error('El almacén es obligatorio');
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

    // 1. VALIDAR STOCK
    for (const d of detalles) {
      const [stockRows] = await connection.query(
        `SELECT cantidad FROM inventario
         WHERE id_producto = ? AND id_almacen = ?`,
        [d.id_producto, id_almacen]
      );

      const stockDisponible = stockRows.length > 0 ? stockRows[0].cantidad : 0;

      if (stockDisponible < Number(d.cantidad)) {
        const [prod] = await connection.query(
          'SELECT nombre FROM productos WHERE id_producto = ?',
          [d.id_producto]
        );
        const nombreProd = prod[0]?.nombre || `ID ${d.id_producto}`;
        const err = new Error(
          `Stock insuficiente de "${nombreProd}". Disponible: ${stockDisponible}, solicitado: ${d.cantidad}`
        );
        err.status = 400;
        throw err;
      }
    }

    // 2. Calcular totales
    let subtotal = 0;
    for (const d of detalles) {
      subtotal += Number(d.cantidad) * Number(d.precio_unitario);
    }
    const iva = subtotal * 0.13;
    const total = subtotal + iva - Number(descuento);

    const numero_factura = await generarNumeroFactura();

    // 3. INSERT ventas (estado 'pendiente')
    const [result] = await connection.query(
      `INSERT INTO ventas
        (numero_factura, id_usuario, id_almacen, subtotal, iva, descuento, total,
         metodo_pago, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [
        numero_factura,
        id_usuario,
        id_almacen,
        subtotal,
        iva,
        descuento,
        total,
        metodo_pago,
        observaciones || null,
      ]
    );

    const id_venta = result.insertId;

    // 4. INSERT detalles
    for (const d of detalles) {
      const subtotalLinea = Number(d.cantidad) * Number(d.precio_unitario);
      await connection.query(
        `INSERT INTO detalle_venta
          (id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [id_venta, d.id_producto, d.cantidad, d.precio_unitario, subtotalLinea]
      );
    }

    // 5. UPDATE estado a 'completada' → dispara trigger → descuenta stock
    await connection.query(
      "UPDATE ventas SET estado = 'completada' WHERE id_venta = ?",
      [id_venta]
    );

    await connection.commit();
    return { id_venta, numero_factura, total };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Anular venta. Solo si está 'completada'.
 * El trigger devuelve el stock.
 */
const anularVenta = async (id) => {
  const [rows] = await pool.query(
    'SELECT estado FROM ventas WHERE id_venta = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }

  if (rows[0].estado !== 'completada') {
    const err = new Error(`No se puede anular una venta en estado "${rows[0].estado}"`);
    err.status = 400;
    throw err;
  }

  await pool.query(
    "UPDATE ventas SET estado = 'anulada' WHERE id_venta = ?",
    [id]
  );

  return { id_venta: id, mensaje: 'Venta anulada. Stock devuelto al inventario.' };
};

module.exports = {
  listarVentas,
  obtenerVentaPorId,
  crearVenta,
  anularVenta,
};