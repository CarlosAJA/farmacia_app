const pool = require('../../config/db.js');

/**
 * Listar inventario con filtros:
 * - id_almacen (opcional)
 * - id_sucursal (opcional): filtra por almacenes de la sucursal
 * - busqueda (opcional): busca por código o nombre de producto
 * - soloStockBajo (opcional): true → solo cantidad <= stock_minimo
 * - soloSinStock (opcional): true → solo cantidad = 0
 */
const listarInventario = async (filtros = {}) => {
  const { id_almacen, id_sucursal, busqueda, soloStockBajo, soloSinStock } = filtros;

  let sql = `
    SELECT
      i.id_inventario,
      i.cantidad,
      i.ubicacion_estante,
      i.fecha_ultima_actualizacion,
      p.id_producto,
      p.codigo,
      p.nombre AS producto_nombre,
      p.presentacion,
      p.stock_minimo,
      p.precio_compra,
      p.precio_venta,
      c.nombre AS categoria_nombre,
      lab.nombre AS laboratorio_nombre,
      a.id_almacen,
      a.nombre AS almacen_nombre,
      s.id AS sucursal_id,
      s.codigo AS sucursal_codigo,
      s.nombre AS sucursal_nombre
    FROM inventario i
    INNER JOIN productos p ON i.id_producto = p.id_producto
    INNER JOIN almacenes a ON i.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
    LEFT JOIN laboratorios lab ON p.id_laboratorio = lab.id_laboratorio
    WHERE 1 = 1
  `;
  const params = [];

  if (id_almacen) {
    sql += ' AND i.id_almacen = ?';
    params.push(id_almacen);
  }

  if (id_sucursal) {
    sql += ' AND a.id_sucursal = ?';
    params.push(id_sucursal);
  }

  if (busqueda) {
    sql += ' AND (p.codigo LIKE ? OR p.nombre LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`);
  }

  if (soloStockBajo === 'true' || soloStockBajo === true) {
    sql += ' AND i.cantidad <= p.stock_minimo AND i.cantidad > 0';
  }

  if (soloSinStock === 'true' || soloSinStock === true) {
    sql += ' AND i.cantidad = 0';
  }

  sql += ' ORDER BY p.nombre ASC';

  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Listar movimientos con filtros:
 * - id_producto (opcional)
 * - id_almacen (opcional)
 * - tipo_movimiento (opcional)
 * - limit (default 100)
 */
const listarMovimientos = async (filtros = {}) => {
  const { id_producto, id_almacen, tipo_movimiento, limit = 100 } = filtros;

  let sql = `
    SELECT
      m.id_movimiento,
      m.tipo_movimiento,
      m.cantidad,
      m.motivo,
      m.fecha_movimiento,
      p.id_producto,
      p.codigo,
      p.nombre AS producto_nombre,
      a.id_almacen,
      a.nombre AS almacen_nombre,
      s.nombre AS sucursal_nombre,
      u.id_usuario,
      u.nombre AS usuario_nombre
    FROM movimientos_inventario m
    INNER JOIN productos p ON m.id_producto = p.id_producto
    INNER JOIN almacenes a ON m.id_almacen = a.id_almacen
    LEFT JOIN sucursales s ON a.id_sucursal = s.id
    LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
    WHERE 1 = 1
  `;
  const params = [];

  if (id_producto) {
    sql += ' AND m.id_producto = ?';
    params.push(id_producto);
  }

  if (id_almacen) {
    sql += ' AND m.id_almacen = ?';
    params.push(id_almacen);
  }

  if (tipo_movimiento) {
    sql += ' AND m.tipo_movimiento = ?';
    params.push(tipo_movimiento);
  }

  sql += ' ORDER BY m.fecha_movimiento DESC LIMIT ?';
  params.push(Number(limit));

  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Ajustar cantidad de un registro de inventario.
 * Registra un movimiento de tipo 'ajuste'.
 */
const ajustarCantidad = async (id_inventario, nuevaCantidad, motivo, id_usuario) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener el inventario actual
    const [rows] = await connection.query(
      'SELECT * FROM inventario WHERE id_inventario = ?',
      [id_inventario]
    );

    if (rows.length === 0) {
      const err = new Error('Registro de inventario no encontrado');
      err.status = 404;
      throw err;
    }

    const inventarioActual = rows[0];
    const cantidadAnterior = inventarioActual.cantidad;
    const diferencia = nuevaCantidad - cantidadAnterior;

    if (diferencia === 0) {
      const err = new Error('La cantidad es la misma, no hay cambios que aplicar');
      err.status = 400;
      throw err;
    }

    // 2. Actualizar la cantidad
    await connection.query(
      'UPDATE inventario SET cantidad = ? WHERE id_inventario = ?',
      [nuevaCantidad, id_inventario]
    );

    // 3. Registrar el movimiento (entrada si aumenta, salida si disminuye)
    const tipoMovimiento = diferencia > 0 ? 'entrada' : 'salida';
    await connection.query(
      `INSERT INTO movimientos_inventario
        (id_producto, id_almacen, tipo_movimiento, cantidad, motivo, id_usuario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        inventarioActual.id_producto,
        inventarioActual.id_almacen,
        tipoMovimiento,
        Math.abs(diferencia),
        motivo || 'Ajuste manual desde el sistema',
        id_usuario || null,
      ]
    );

    await connection.commit();

    return {
      id_inventario,
      cantidad_anterior: cantidadAnterior,
      cantidad_nueva: nuevaCantidad,
      diferencia,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
/**
 * Transferir stock de un almacén a otro.
 * Registra una salida en origen y una entrada en destino.
 */
const transferirStock = async (id_producto, id_almacen_origen, id_almacen_destino, cantidad, motivo, id_usuario) => {
  if (id_almacen_origen === id_almacen_destino) {
    const err = new Error('El almacén de origen y destino no pueden ser el mismo');
    err.status = 400;
    throw err;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validar stock en origen
    const [origenRows] = await connection.query(
      'SELECT cantidad FROM inventario WHERE id_producto = ? AND id_almacen = ?',
      [id_producto, id_almacen_origen]
    );

    const stockActual = origenRows.length > 0 ? origenRows[0].cantidad : 0;

    if (stockActual < cantidad) {
      const [prod] = await connection.query('SELECT nombre FROM productos WHERE id_producto = ?', [id_producto]);
      const err = new Error(`Stock insuficiente en el almacén de origen para "${prod[0].nombre}". Disponible: ${stockActual}`);
      err.status = 400;
      throw err;
    }

    // 2. Restar del origen
    await connection.query(
      'UPDATE inventario SET cantidad = cantidad - ? WHERE id_producto = ? AND id_almacen = ?',
      [cantidad, id_producto, id_almacen_origen]
    );

    // 3. Sumar al destino (o crearlo si no existe)
    await connection.query(
      `INSERT INTO inventario (id_producto, id_almacen, cantidad) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
      [id_producto, id_almacen_destino, cantidad]
    );

    // 4. Registrar Salida (Origen)
    await connection.query(
      `INSERT INTO movimientos_inventario 
        (id_producto, id_almacen, tipo_movimiento, cantidad, motivo, id_usuario)
       VALUES (?, ?, 'salida', ?, ?, ?)`,
      [id_producto, id_almacen_origen, cantidad, `Traspaso a Almacén #${id_almacen_destino}. Motivo: ${motivo || 'N/A'}`, id_usuario]
    );

    // 5. Registrar Entrada (Destino)
    await connection.query(
      `INSERT INTO movimientos_inventario 
        (id_producto, id_almacen, tipo_movimiento, cantidad, motivo, id_usuario)
       VALUES (?, ?, 'entrada', ?, ?, ?)`,
      [id_producto, id_almacen_destino, cantidad, `Traspaso desde Almacén #${id_almacen_origen}. Motivo: ${motivo || 'N/A'}`, id_usuario]
    );

    await connection.commit();
    return { mensaje: 'Traspaso realizado con éxito' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
module.exports = {
  listarInventario,
  listarMovimientos,
  ajustarCantidad,
  transferirStock,
};