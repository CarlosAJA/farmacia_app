const pool = require('../../config/db.js');
const obtenerResumenDashboard = async (id_sucursal = null) => {
  // Si no hay sucursal, usamos NULL en SQL para traer todos los datos (Admin)
  const filtroSucursal = id_sucursal ? id_sucursal : null;
  const querySucursal = id_sucursal ? ' AND a.id_sucursal = ?' : '';
  const params = id_sucursal ? [id_sucursal, id_sucursal, id_sucursal, id_sucursal, id_sucursal] : [];

  const [kpis] = await pool.query(`
    SELECT
      (SELECT IFNULL(SUM(v.total), 0) FROM ventas v INNER JOIN almacenes a ON v.id_almacen = a.id_almacen WHERE DATE(v.fecha_venta) = CURDATE() AND v.estado = 'completada' ${querySucursal}) AS ventas_hoy,
      (SELECT IFNULL(SUM(v.total), 0) FROM ventas v INNER JOIN almacenes a ON v.id_almacen = a.id_almacen WHERE MONTH(v.fecha_venta) = MONTH(CURDATE()) AND YEAR(v.fecha_venta) = YEAR(CURDATE()) AND v.estado = 'completada' ${querySucursal}) AS ventas_mes,
      (SELECT COUNT(*) FROM ventas v INNER JOIN almacenes a ON v.id_almacen = a.id_almacen WHERE DATE(v.fecha_venta) = CURDATE() AND v.estado = 'completada' ${querySucursal}) AS transacciones_hoy,
      (SELECT COUNT(*) FROM inventario i INNER JOIN productos p ON i.id_producto = p.id_producto INNER JOIN almacenes a ON i.id_almacen = a.id_almacen WHERE i.cantidad <= p.stock_minimo AND p.estado = 'activo' ${querySucursal}) AS stock_bajo,
      (SELECT COUNT(*) FROM productos p INNER JOIN inventario i ON p.id_producto = i.id_producto INNER JOIN almacenes a ON i.id_almacen = a.id_almacen WHERE p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND p.fecha_vencimiento >= CURDATE() AND p.estado = 'activo' ${querySucursal}) AS por_vencer_30d
  `, params);

  const [ventasSemana] = await pool.query(`
    SELECT DATE(v.fecha_venta) AS fecha, SUM(v.total) AS total
    FROM ventas v INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND v.estado = 'completada' ${querySucursal}
    GROUP BY DATE(v.fecha_venta) ORDER BY fecha ASC
  `, params.length ? [params[0]] : []);

  const [topProductos] = await pool.query(`
    SELECT p.nombre, SUM(dv.cantidad) AS cantidad_vendida, SUM(dv.subtotal) AS ingresos
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id_producto
    INNER JOIN ventas v ON dv.id_venta = v.id_venta
    INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    WHERE v.estado = 'completada' ${querySucursal}
    GROUP BY p.id_producto ORDER BY cantidad_vendida DESC LIMIT 5
  `, params.length ? [params[0]] : []);

  const [alertasStock] = await pool.query(`
    SELECT p.codigo, p.nombre, i.cantidad AS stock_actual, p.stock_minimo, a.nombre AS almacen
    FROM inventario i
    INNER JOIN productos p ON i.id_producto = p.id_producto
    INNER JOIN almacenes a ON i.id_almacen = a.id_almacen
    WHERE i.cantidad <= p.stock_minimo AND p.estado = 'activo' ${querySucursal}
    ORDER BY i.cantidad ASC LIMIT 10
  `, params.length ? [params[0]] : []);

  return { kpis: kpis[0], ventasSemana, topProductos, alertasStock };
};


module.exports = {
  obtenerResumenDashboard,
};