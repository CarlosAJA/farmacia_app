const pool = require('../../config/db.js');

const generarNumeroFactura = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM ventas');
  const numero = (rows[0].total + 1).toString().padStart(5, '0');
  return `F-${numero}`;
};

const listarVentas = async (filtros = {}) => {
  const { estado, id_almacen, busqueda, fecha_desde, fecha_hasta, forzarHoy } = filtros;

  let sql = `
    SELECT
      v.id_venta, v.numero_factura, v.fecha_venta, v.subtotal, v.iva, v.descuento, v.total,
      v.metodo_pago, v.estado, v.observaciones,
      a.id_almacen, a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.id_usuario, u.nombre AS usuario_nombre,
      c.razon_social AS cliente_nombre, 
      c.nit_ci AS cliente_nit,
      c.celular AS cliente_celular,
      (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) AS total_items
    FROM ventas v
    INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    WHERE 1 = 1
  `;
  const params = [];

  if (estado) { sql += ' AND v.estado = ?'; params.push(estado); }
  if (id_almacen) { sql += ' AND v.id_almacen = ?'; params.push(id_almacen); }
  if (busqueda) { sql += ' AND (v.numero_factura LIKE ? OR u.nombre LIKE ? OR c.razon_social LIKE ?)'; params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`); }
  
  // 👇 LÓGICA DE FECHAS
  if (forzarHoy) {
    sql += ' AND DATE(v.fecha_venta) = CURDATE()'; // Solo hoy para el cajero
  } else {
    if (fecha_desde) { sql += ' AND DATE(v.fecha_venta) >= ?'; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ' AND DATE(v.fecha_venta) <= ?'; params.push(fecha_hasta); }
  }

  sql += ' ORDER BY v.fecha_venta DESC, v.id_venta DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerVentaPorId = async (id) => {
  const [ventas] = await pool.query(`
    SELECT
      v.*,
      a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.nombre AS usuario_nombre,
      c.razon_social AS cliente_nombre,
      c.nit_ci AS cliente_nit,
      c.celular AS cliente_celular
    FROM ventas v
    INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    WHERE v.id_venta = ?
  `, [id]);

  if (ventas.length === 0) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }

  const [detalles] = await pool.query(`
    SELECT
      dv.id_detalle, dv.id_producto, dv.cantidad, dv.precio_unitario, dv.subtotal,
      p.codigo AS producto_codigo, p.nombre AS producto_nombre, p.presentacion AS producto_presentacion
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id_producto
    WHERE dv.id_venta = ?
  `, [id]);

  return { ...ventas[0], detalles };
};

const crearVenta = async (data, id_usuario) => {
   const {
    id_almacen, metodo_pago = 'efectivo', descuento = 0, detalles = [],
    monto_recibido = 0, monto_cambio = 0, monto_efectivo = 0, monto_tarjeta = 0, monto_qr = 0,
    cliente_nit, cliente_razon_social, cliente_celular, cliente_email,
    id_sesion_caja // 👈 NUEVO
  } = data;

  if (!id_almacen) throw new Error('El almacén es obligatorio');
  if (detalles.length === 0) throw new Error('Debes agregar al menos un producto');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lógica del Cliente
    let id_cliente = null;
    if (cliente_nit && cliente_razon_social) {
      const nitFormateado = cliente_nit.trim().toUpperCase();
      const razonFormateada = cliente_razon_social.trim().toUpperCase();
      const emailFormateado = cliente_email ? cliente_email.trim().toLowerCase() : null;
      const [resultCli] = await connection.query(
        `INSERT INTO clientes (nit_ci, razon_social, celular, email) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         razon_social = VALUES(razon_social), 
         celular = VALUES(celular), 
         email = VALUES(email)`,
        [nitFormateado, razonFormateada, cliente_celular || null, emailFormateado || null]
      );

      if (resultCli.insertId) {
        // Si insertId > 0, es un cliente nuevo
        id_cliente = resultCli.insertId;
      } else {
        // Si insertId es 0, el cliente ya existía y solo se actualizó. Lo buscamos por NIT.
        const [cli] = await connection.query('SELECT id_cliente FROM clientes WHERE nit_ci = ?', [cliente_nit]);
        id_cliente = cli[0].id_cliente;
      }
    }

    // 2. Validar Stock
    for (const d of detalles) {
      const [stockRows] = await connection.query(
        'SELECT cantidad FROM inventario WHERE id_producto = ? AND id_almacen = ?',
        [d.id_producto, id_almacen]
      );
      const stockDisponible = stockRows.length > 0 ? stockRows[0].cantidad : 0;
      if (stockDisponible < Number(d.cantidad)) {
        const [prod] = await connection.query('SELECT nombre FROM productos WHERE id_producto = ?', [d.id_producto]);
        throw new Error(`Stock insuficiente de "${prod[0]?.nombre || 'Producto'}". Disponible: ${stockDisponible}`);
      }
    }

    // 3. Calcular Totales
    let subtotal = 0;
    for (const d of detalles) subtotal += Number(d.cantidad) * Number(d.precio_unitario);
    const iva = 0;
    const total = subtotal - Number(descuento);

    const numero_factura = await generarNumeroFactura();

    // 4. INSERT Ventas
    const [result] = await connection.query(
      `INSERT INTO ventas
        (numero_factura, id_usuario, id_almacen, subtotal, iva, descuento, total, metodo_pago, estado, id_cliente, monto_recibido, monto_cambio, monto_efectivo, monto_tarjeta, monto_qr, id_sesion_caja)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?)`, // 👈 Un ? más
      [
        numero_factura, id_usuario, id_almacen, subtotal, iva, descuento, total, metodo_pago,
        id_cliente, monto_recibido, monto_cambio, monto_efectivo, monto_tarjeta, monto_qr,
        id_sesion_caja // 👈 NUEVO VALOR
      ]
    );

    const id_venta = result.insertId;

    // 5. INSERT Detalles
    for (const d of detalles) {
      const subtotalLinea = Number(d.cantidad) * Number(d.precio_unitario);
      await connection.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [id_venta, d.id_producto, d.cantidad, d.precio_unitario, subtotalLinea]
      );
    }

    // 6. UPDATE Estado
    await connection.query("UPDATE ventas SET estado = 'completada' WHERE id_venta = ?", [id_venta]);

    await connection.commit();
    return { id_venta, numero_factura, total };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const anularVenta = async (id) => {
  const [rows] = await pool.query('SELECT estado FROM ventas WHERE id_venta = ?', [id]);
  if (rows.length === 0) throw new Error('Venta no encontrada');
  if (rows[0].estado !== 'completada') throw new Error(`No se puede anular una venta en estado "${rows[0].estado}"`);

  await pool.query("UPDATE ventas SET estado = 'anulada' WHERE id_venta = ?", [id]);
  return { id_venta: id, mensaje: 'Venta anulada. Stock devuelto.' };
};

module.exports = { listarVentas, obtenerVentaPorId, crearVenta, anularVenta };