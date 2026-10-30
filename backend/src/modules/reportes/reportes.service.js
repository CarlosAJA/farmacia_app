const pool = require('../../config/db.js');
const obtenerResumenDashboard = async (id_sucursal) => {
  // Si id_sucursal existe, preparamos el filtro para las consultas
  const filtroVentas = id_sucursal ? `AND a.id_sucursal = ${id_sucursal}` : '';
  const filtroInv = id_sucursal ? `AND a.id_sucursal = ${id_sucursal}` : '';

  // 1. KPIs principales
  const [kpis] = await pool.query(`
    SELECT
      (SELECT IFNULL(SUM(v.total), 0) FROM ventas v JOIN almacenes a ON v.id_almacen = a.id_almacen WHERE DATE(v.fecha_venta) = CURDATE() AND v.estado = 'completada' ${filtroVentas}) AS ventas_hoy,
      (SELECT IFNULL(SUM(v.total), 0) FROM ventas v JOIN almacenes a ON v.id_almacen = a.id_almacen WHERE MONTH(v.fecha_venta) = MONTH(CURDATE()) AND YEAR(v.fecha_venta) = YEAR(CURDATE()) AND v.estado = 'completada' ${filtroVentas}) AS ventas_mes,
      (SELECT COUNT(*) FROM ventas v JOIN almacenes a ON v.id_almacen = a.id_almacen WHERE DATE(v.fecha_venta) = CURDATE() AND v.estado = 'completada' ${filtroVentas}) AS transacciones_hoy,
      (SELECT COUNT(*) FROM inventario i JOIN productos p ON i.id_producto = p.id_producto JOIN almacenes a ON i.id_almacen = a.id_almacen WHERE i.cantidad <= p.stock_minimo AND p.estado = 'activo' ${filtroInv}) AS stock_bajo,
      (SELECT COUNT(*) FROM productos WHERE fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND fecha_vencimiento >= CURDATE() AND estado = 'activo') AS por_vencer_30d
  `);

  // 2. Ventas de los últimos 7 días
  const [ventasSemana] = await pool.query(`
    SELECT DATE(v.fecha_venta) AS fecha, SUM(v.total) AS total
    FROM ventas v JOIN almacenes a ON v.id_almacen = a.id_almacen
    WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND v.estado = 'completada' ${filtroVentas}
    GROUP BY DATE(v.fecha_venta) ORDER BY fecha ASC
  `);

  // 3. Top 5 productos
  const [topProductos] = await pool.query(`
    SELECT p.nombre, SUM(dv.cantidad) AS cantidad_vendida, SUM(dv.subtotal) AS ingresos
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id_producto
    INNER JOIN ventas v ON dv.id_venta = v.id_venta
    INNER JOIN almacenes a ON v.id_almacen = a.id_almacen
    WHERE v.estado = 'completada' ${filtroVentas}
    GROUP BY p.id_producto ORDER BY cantidad_vendida DESC LIMIT 5
  `);

  // 4. Alertas de stock
  const [alertasStock] = await pool.query(`
    SELECT p.codigo, p.nombre, i.cantidad AS stock_actual, p.stock_minimo, a.nombre AS almacen
    FROM inventario i
    INNER JOIN productos p ON i.id_producto = p.id_producto
    INNER JOIN almacenes a ON i.id_almacen = a.id_almacen
    WHERE i.cantidad <= p.stock_minimo AND p.estado = 'activo' ${filtroInv}
    ORDER BY i.cantidad ASC LIMIT 5
  `);

  return { kpis: kpis[0], ventasSemana, topProductos, alertasStock };
};


module.exports = {
  obtenerResumenDashboard,
};