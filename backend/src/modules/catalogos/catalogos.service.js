const pool = require('../../config/db.js');

const listarProveedores = async () => {
  const [rows] = await pool.query(
    "SELECT id_proveedor, nombre_empresa, ruc, contacto FROM proveedores WHERE estado = 'activo' ORDER BY nombre_empresa"
  );
  return rows;
};

const listarProductos = async () => {
  const [rows] = await pool.query(`
    SELECT
      p.id_producto,
      p.codigo,
      p.nombre,
      p.presentacion,
      p.precio_compra,
      p.precio_venta,
      p.stock_minimo,
      p.requiere_receta,
      c.nombre AS categoria_nombre,
      lab.nombre AS laboratorio_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
    LEFT JOIN laboratorios lab ON p.id_laboratorio = lab.id_laboratorio
    WHERE p.estado = 'activo'
    ORDER BY p.nombre
  `);
  return rows;
};

const listarAlmacenes = async () => {
  const [rows] = await pool.query(`
    SELECT
      a.id_almacen,
      a.nombre,
      a.id_sucursal,
      s.codigo AS sucursal_codigo,
      s.nombre AS sucursal_nombre
    FROM almacenes a
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    WHERE a.estado = 'activo'
    ORDER BY a.nombre
  `);
  return rows;
};

module.exports = { listarProveedores, listarProductos, listarAlmacenes };