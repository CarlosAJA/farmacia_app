const pool = require('../../../src/config/db.js');

const SELECT_BASE = `
  SELECT
    p.id_producto AS id,
    p.codigo,
    p.nombre,
    p.presentacion,
    p.descripcion,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.id_laboratorio,
    l.nombre AS laboratorio_nombre,
    p.id_proveedor,
    pr.nombre_empresa AS proveedor_nombre,
    p.precio_compra,
    p.precio_venta,
    p.stock_minimo,
    p.requiere_receta,
    p.fecha_fabricacion,
    p.fecha_vencimiento,
    p.estado,
    p.fecha_registro
  FROM productos p
  LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
  LEFT JOIN laboratorios l ON p.id_laboratorio = l.id_laboratorio
  LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
`;

const listarProductos = async (filtros = {}) => {
  let sql = SELECT_BASE;
  const params = [];
  const where = [];

  if (filtros.estado) {
    where.push('p.estado = ?');
    params.push(filtros.estado);
  }

  if (filtros.categoria) {
    where.push('p.id_categoria = ?');
    params.push(filtros.categoria);
  }

  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ');
  }

  sql += ' ORDER BY p.nombre ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerProductoPorId = async (id) => {
  const [rows] = await pool.query(`${SELECT_BASE} WHERE p.id_producto = ?`, [id]);
  if (rows.length === 0) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const crearProducto = async (data) => {
  const [existe] = await pool.query(
    'SELECT id_producto FROM productos WHERE codigo = ?',
    [data.codigo]
  );
  if (existe.length > 0) {
    const err = new Error('Ya existe un producto con ese código');
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO productos
      (codigo, nombre, presentacion, descripcion, id_categoria, id_laboratorio, id_proveedor,
       precio_compra, precio_venta, stock_minimo, requiere_receta, fecha_fabricacion, fecha_vencimiento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.codigo,
      data.nombre,
      data.presentacion || null,
      data.descripcion || null,
      data.id_categoria || null,
      data.id_laboratorio || null,
      data.id_proveedor || null,
      data.precio_compra || 0,
      data.precio_venta || 0,
      data.stock_minimo || 0,
      data.requiere_receta ? 1 : 0,
      data.fecha_fabricacion || null,
      data.fecha_vencimiento || null,
    ]
  );

  return obtenerProductoPorId(result.insertId);
};

const actualizarProducto = async (id, data) => {
  await obtenerProductoPorId(id);

  const campos = [
    'codigo', 'nombre', 'presentacion', 'descripcion',
    'id_categoria', 'id_laboratorio', 'id_proveedor',
    'precio_compra', 'precio_venta', 'stock_minimo',
    'requiere_receta', 'fecha_fabricacion', 'fecha_vencimiento', 'estado',
  ];

  const sets = [];
  const values = [];

  for (const campo of campos) {
    if (data[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      values.push(campo === 'requiere_receta' ? (data[campo] ? 1 : 0) : data[campo]);
    }
  }

  if (sets.length === 0) {
    const err = new Error('No se enviaron campos para actualizar');
    err.status = 400;
    throw err;
  }

  values.push(id);
  await pool.query(`UPDATE productos SET ${sets.join(', ')} WHERE id_producto = ?`, values);
  return obtenerProductoPorId(id);
};

const eliminarProducto = async (id) => {
  await obtenerProductoPorId(id);
  await pool.query("UPDATE productos SET estado = 'inactivo' WHERE id_producto = ?", [id]);
};

// Productos con alertas (stock bajo y próximos a vencer)
const obtenerAlertas = async () => {
  const [stockBajo] = await pool.query(`
    ${SELECT_BASE}
    WHERE p.estado = 'activo'
    AND p.stock_minimo > 0
    AND p.id_producto IN (
      SELECT id_producto FROM inventario WHERE cantidad <= p.stock_minimo
    )
  `);

  const [porVencer] = await pool.query(`
    ${SELECT_BASE}
    WHERE p.estado = 'activo'
    AND p.fecha_vencimiento IS NOT NULL
    AND p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
    AND p.fecha_vencimiento >= CURDATE()
    ORDER BY p.fecha_vencimiento ASC
  `);

  const [vencidos] = await pool.query(`
    ${SELECT_BASE}
    WHERE p.estado = 'activo'
    AND p.fecha_vencimiento IS NOT NULL
    AND p.fecha_vencimiento < CURDATE()
    ORDER BY p.fecha_vencimiento DESC
  `);

  return { stockBajo, porVencer, vencidos };
};

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerAlertas,
};