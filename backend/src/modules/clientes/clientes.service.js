const pool = require('../../config/db.js');

const buscarClientePorNit = async (nit_ci) => {
  const [rows] = await pool.query(
    'SELECT id_cliente, nit_ci, razon_social, celular, email FROM clientes WHERE nit_ci = ?',
    [nit_ci]
  );
  return rows.length > 0 ? rows[0] : null;
};

const listarClientes = async (filtros = {}) => {
  const { busqueda } = filtros;
  let sql = 'SELECT * FROM clientes WHERE 1=1';
  const params = [];

  if (busqueda) {
    sql += ' AND (nit_ci LIKE ? OR razon_social LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`);
  }

  sql += ' ORDER BY razon_social ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerHistorialCliente = async (id_cliente) => {
  const [ventas] = await pool.query(`
    SELECT id_venta, numero_factura, fecha_venta, total, metodo_pago
    FROM ventas
    WHERE id_cliente = ? AND estado = 'completada'
    ORDER BY fecha_venta DESC
  `, [id_cliente]);

  for (let venta of ventas) {
    const [detalles] = await pool.query(`
      SELECT dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS producto_nombre
      FROM detalle_venta dv
      INNER JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = ?
    `, [venta.id_venta]);
    venta.detalles = detalles;
  }

  return ventas;
};

// 👇 ESTA ES LA LÍNEA MÁGICA QUE FALTABA
module.exports = { 
  buscarClientePorNit, 
  listarClientes, 
  obtenerHistorialCliente 
};