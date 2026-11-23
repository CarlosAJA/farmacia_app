const pool = require('../../../src/config/db.js');

// 1. Base de la consulta (Ahora usa id_producto en lugar de 'id' para no confundir al frontend)
const SELECT_BASE = `
  SELECT
    p.id_producto,
    p.codigo,
    p.nombre,
    p.presentacion,
    p.descripcion,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.id_laboratorio,
    l.nombre AS laboratorio_nombre,
    p.precio_compra,
    p.precio_venta,
    p.stock_minimo,
    p.requiere_receta,
    p.estado,
    p.fecha_registro
  FROM productos p
  LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
  LEFT JOIN laboratorios l ON p.id_laboratorio = l.id_laboratorio
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. BUSCAR O CREAR CATEGORÍA
    let id_categoria = null;
    if (data.categoria_nombre) {
      const nombreCat = data.categoria_nombre.trim().toUpperCase();
      const [cat] = await connection.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [nombreCat]);
      if (cat.length > 0) id_categoria = cat[0].id_categoria;
      else {
        const [newCat] = await connection.query('INSERT INTO categorias (nombre) VALUES (?)', [nombreCat]);
        id_categoria = newCat.insertId;
      }
    }

    // 2. BUSCAR O CREAR LABORATORIO
    let id_laboratorio = null;
    if (data.laboratorio_nombre) {
      const nombreLab = data.laboratorio_nombre.trim().toUpperCase();
      const [lab] = await connection.query('SELECT id_laboratorio FROM laboratorios WHERE nombre = ?', [nombreLab]);
      if (lab.length > 0) id_laboratorio = lab[0].id_laboratorio;
      else {
        const [newLab] = await connection.query('INSERT INTO laboratorios (nombre) VALUES (?)', [nombreLab]);
        id_laboratorio = newLab.insertId;
      }
    }

    // 3. INSERTAR PRODUCTO
    const [result] = await connection.query(
      `INSERT INTO productos 
        (codigo, nombre, presentacion, descripcion, id_categoria, id_laboratorio, requiere_receta, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        data.codigo ? data.codigo.trim().toUpperCase() : 'SIN-CODIGO',
        data.nombre ? data.nombre.trim().toUpperCase() : 'SIN-NOMBRE',
        data.presentacion ? data.presentacion.trim().toUpperCase() : null,
        data.descripcion ? data.descripcion.trim().toUpperCase() : null,
        id_categoria,
        id_laboratorio,
        data.requiere_receta ? 1 : 0,
      ]
    );

    await connection.commit();
    return { id_producto: result.insertId }; // ✅ Ahora sí cierra y retorna bien
    
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const actualizarProducto = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let id_categoria = null;
    if (data.categoria_nombre) {
      const nombreCat = data.categoria_nombre.trim().toUpperCase();
      const [cat] = await connection.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [nombreCat]);
      if (cat.length > 0) id_categoria = cat[0].id_categoria;
      else {
        const [newCat] = await connection.query('INSERT INTO categorias (nombre) VALUES (?)', [nombreCat]);
        id_categoria = newCat.insertId;
      }
    }
    
    let id_laboratorio = null;
    if (data.laboratorio_nombre) {
      const nombreLab = data.laboratorio_nombre.trim().toUpperCase();
      const [lab] = await connection.query('SELECT id_laboratorio FROM laboratorios WHERE nombre = ?', [nombreLab]);
      if (lab.length > 0) id_laboratorio = lab[0].id_laboratorio;
      else {
        const [newLab] = await connection.query('INSERT INTO laboratorios (nombre) VALUES (?)', [nombreLab]);
        id_laboratorio = newLab.insertId;
      }
    }

    await connection.query(
      `UPDATE productos 
       SET codigo = ?, nombre = ?, presentacion = ?, descripcion = ?, 
           id_categoria = ?, id_laboratorio = ?, requiere_receta = ?
       WHERE id_producto = ?`,
      [
        data.codigo.trim().toUpperCase(),
        data.nombre.trim().toUpperCase(),
        data.presentacion ? data.presentacion.trim().toUpperCase() : null,
        data.descripcion ? data.descripcion.trim().toUpperCase() : null,
        id_categoria,
        id_laboratorio,
        data.requiere_receta ? 1 : 0,
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

// 4. ALERTAS ACTUALIZADAS PARA LEER DESDE LOTES_INVENTARIO
const obtenerAlertas = async () => {
  // Stock Bajo (desde la tabla inventario)
  const [stockBajo] = await pool.query(`
    SELECT p.id_producto, p.codigo, p.nombre, SUM(i.cantidad) as stock_total, p.stock_minimo
    FROM productos p
    INNER JOIN inventario i ON p.id_producto = i.id_producto
    WHERE p.estado = 'activo' AND p.stock_minimo > 0
    GROUP BY p.id_producto
    HAVING stock_total <= p.stock_minimo
  `);

  // Productos por Vencer (desde los lotes)
  const [porVencer] = await pool.query(`
    SELECT DISTINCT p.id_producto, p.codigo, p.nombre, l.fecha_vencimiento, a.nombre AS almacen
    FROM lotes_inventario l
    INNER JOIN productos p ON l.id_producto = p.id_producto
    INNER JOIN almacenes a ON l.id_almacen = a.id_almacen
    WHERE p.estado = 'activo' 
      AND l.cantidad > 0
      AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
      AND l.fecha_vencimiento >= CURDATE()
    ORDER BY l.fecha_vencimiento ASC
  `);

  // Productos Vencidos (desde los lotes)
  const [vencidos] = await pool.query(`
    SELECT DISTINCT p.id_producto, p.codigo, p.nombre, l.fecha_vencimiento, a.nombre AS almacen
    FROM lotes_inventario l
    INNER JOIN productos p ON l.id_producto = p.id_producto
    INNER JOIN almacenes a ON l.id_almacen = a.id_almacen
    WHERE p.estado = 'activo' 
      AND l.cantidad > 0
      AND l.fecha_vencimiento < CURDATE()
    ORDER BY l.fecha_vencimiento DESC
  `);

  return { stockBajo, porVencer, vencidos };
};

const configurarVenta = async (id, precio_venta, stock_minimo) => {
  await pool.query(
    `UPDATE productos SET precio_venta = ?, stock_minimo = ? WHERE id_producto = ?`,
    [precio_venta, stock_minimo, id]
  );
  return { id_producto: id, mensaje: 'Configuración de venta actualizada' };
};

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerAlertas,
  configurarVenta,
};