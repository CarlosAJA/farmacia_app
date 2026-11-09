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

const listarProductos = async () => {
  const [rows] = await pool.query(`
    SELECT 
      p.*,
      c.nombre AS categoria_nombre,
      l.nombre AS laboratorio_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
    LEFT JOIN laboratorios l ON p.id_laboratorio = l.id_laboratorio
    ORDER BY p.nombre ASC
  `);
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
  const pool = require('../../config/db.js');
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. BUSCAR O CREAR CATEGORÍA
    let id_categoria = null;
    if (data.categoria_nombre) {
      const nombreCat = data.categoria_nombre.trim().toUpperCase();
      const [cat] = await connection.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [nombreCat]);
      if (cat.length > 0) {
        id_categoria = cat[0].id_categoria;
      } else {
        const [newCat] = await connection.query('INSERT INTO categorias (nombre) VALUES (?)', [nombreCat]);
        id_categoria = newCat.insertId;
      }
    }

    // 2. BUSCAR O CREAR LABORATORIO
    let id_laboratorio = null;
    if (data.laboratorio_nombre) {
      const nombreLab = data.laboratorio_nombre.trim().toUpperCase();
      const [lab] = await connection.query('SELECT id_laboratorio FROM laboratorios WHERE nombre = ?', [nombreLab]);
      if (lab.length > 0) {
        id_laboratorio = lab[0].id_laboratorio;
      } else {
        const [newLab] = await connection.query('INSERT INTO laboratorios (nombre) VALUES (?)', [nombreLab]);
        id_laboratorio = newLab.insertId;
      }
    }

    // 3. INSERTAR PRODUCTO
    const [result] = await connection.query(
      `INSERT INTO productos 
        (codigo, nombre, presentacion, descripcion, id_categoria, id_laboratorio, precio_compra, precio_venta, stock_minimo, requiere_receta, fecha_vencimiento, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        data.codigo.trim().toUpperCase(),
        data.nombre.trim().toUpperCase(),
        data.presentacion ? data.presentacion.trim().toUpperCase() : null,
        data.descripcion ? data.descripcion.trim().toUpperCase() : null,
        id_categoria,
        id_laboratorio,
        data.precio_compra || 0,
        data.precio_venta || 0,
        data.stock_minimo || 0,
        data.requiere_receta ? 1 : 0,
        data.fecha_vencimiento || null,
      ]
    );

    await connection.commit();
    return result.insertId;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const actualizarProducto = async (id, data) => {
  const pool = require('../../config/db.js'); // Asegúrate de importar el pool
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. BUSCAR O CREAR CATEGORÍA
    let id_categoria = null;
    if (data.categoria_nombre) {
      const nombreCat = data.categoria_nombre.trim().toUpperCase();
      const [cat] = await connection.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [nombreCat]);
      if (cat.length > 0) {
        id_categoria = cat[0].id_categoria;
      } else {
        const [newCat] = await connection.query('INSERT INTO categorias (nombre) VALUES (?)', [nombreCat]);
        id_categoria = newCat.insertId;
      }
    }

    // 2. BUSCAR O CREAR LABORATORIO
    let id_laboratorio = null;
    if (data.laboratorio_nombre) {
      const nombreLab = data.laboratorio_nombre.trim().toUpperCase();
      const [lab] = await connection.query('SELECT id_laboratorio FROM laboratorios WHERE nombre = ?', [nombreLab]);
      if (lab.length > 0) {
        id_laboratorio = lab[0].id_laboratorio;
      } else {
        const [newLab] = await connection.query('INSERT INTO laboratorios (nombre) VALUES (?)', [nombreLab]);
        id_laboratorio = newLab.insertId;
      }
    }

    // 3. ACTUALIZAR PRODUCTO
    await connection.query(
      `UPDATE productos 
       SET codigo = ?, nombre = ?, presentacion = ?, descripcion = ?, 
           id_categoria = ?, id_laboratorio = ?, precio_compra = ?, 
           precio_venta = ?, stock_minimo = ?, requiere_receta = ?, 
           fecha_vencimiento = ?
       WHERE id_producto = ?`,
      [
        data.codigo.trim().toUpperCase(),
        data.nombre.trim().toUpperCase(),
        data.presentacion ? data.presentacion.trim().toUpperCase() : null,
        data.descripcion ? data.descripcion.trim().toUpperCase() : null,
        id_categoria,
        id_laboratorio,
        data.precio_compra || 0,
        data.precio_venta || 0,
        data.stock_minimo || 0,
        data.requiere_receta ? 1 : 0,
        data.fecha_vencimiento || null,
        id
      ]
    );

    await connection.commit();
    return { id_producto: id };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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