const pool = require('../../config/db.js');

const obtenerResumenDashboard = async () => {
  // 1. KPIs principales
  const [kpis] = await pool.query(`
    SELECT
      (SELECT IFNULL(SUM(total), 0) FROM ventas WHERE DATE(fecha_venta) = CURDATE() AND estado = 'completada') AS ventas_hoy,
      (SELECT IFNULL(SUM(total), 0) FROM ventas WHERE MONTH(fecha_venta) = MONTH(CURDATE()) AND YEAR(fecha_venta) = YEAR(CURDATE()) AND estado = 'completada') AS ventas_mes,
      (SELECT COUNT(*) FROM ventas WHERE DATE(fecha_venta) = CURDATE() AND estado = 'completada') AS transacciones_hoy,
      (SELECT COUNT(*) FROM inventario i JOIN productos p ON i.id_producto = p.id_producto WHERE i.cantidad <= p.stock_minimo AND p.estado = 'activo') AS stock_bajo,
      (SELECT COUNT(*) FROM productos WHERE fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND fecha_vencimiento >= CURDATE() AND estado = 'activo') AS por_vencer_30d
  `);

  // 2. Ventas de los últimos 7 días (para el gráfico)
  const [ventasSemana] = await pool.query(`
    SELECT
      DATE(fecha_venta) AS fecha,
      SUM(total) AS total
    FROM ventas
    WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND estado = 'completada'
    GROUP BY DATE(fecha_venta)
    ORDER BY fecha ASC
  `);

  // 3. Top 5 productos más vendidos
  const [topProductos] = await pool.query(`
    SELECT
      p.nombre,
      SUM(dv.cantidad) AS cantidad_vendida,
      SUM(dv.subtotal) AS ingresos
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id_producto
    INNER JOIN ventas v ON dv.id_venta = v.id_venta
    WHERE v.estado = 'completada'
    GROUP BY p.id_producto
    ORDER BY cantidad_vendida DESC
    LIMIT 5
  `);

  // 4. Alertas de stock bajo (top 5)
  const [alertasStock] = await pool.query(`
    SELECT
      p.codigo,
      p.nombre,
      i.cantidad AS stock_actual,
      p.stock_minimo,
      a.nombre AS almacen
    FROM inventario i
    INNER JOIN productos p ON i.id_producto = p.id_producto
    INNER JOIN almacenes a ON i.id_almacen = a.id_almacen
    WHERE i.cantidad <= p.stock_minimo AND p.estado = 'activo'
    ORDER BY i.cantidad ASC
    LIMIT 5
  `);

  return {
    kpis: kpis[0],
    ventasSemana,
    topProductos,
    alertasStock,
  };
};

module.exports = {
  obtenerResumenDashboard,
};