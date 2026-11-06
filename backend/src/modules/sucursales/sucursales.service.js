const pool = require('../../config/db.js');

const listarSucursales = async (filtros = {}) => {
  let sql = 'SELECT id, codigo, nombre, direccion, departamento, ciudad, telefono, email, estado, fecha_creacion FROM sucursales';
  const params = [];
  if (filtros.estado) {
    sql += ' WHERE estado = ?';
    params.push(filtros.estado);
  }
  sql += ' ORDER BY nombre ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerSucursalPorId = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, codigo, nombre, direccion, departamento, ciudad, telefono, email, estado, fecha_creacion FROM sucursales WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Sucursal no encontrada');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const crearSucursal = async (data) => {
  // Validar que el código no exista
  const [existe] = await pool.query('SELECT id FROM sucursales WHERE codigo = ?', [data.codigo]);
  if (existe.length > 0) {
    const error = new Error('Ya existe una sucursal con ese código');
    error.status = 409;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Crear la Sucursal
    const [result] = await connection.query(
      `INSERT INTO sucursales (codigo, nombre, direccion, departamento, ciudad, telefono, email, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.codigo,
        data.nombre,
        data.direccion,
        data.departamento,
        data.ciudad,
        data.telefono || null,
        data.email || null,
        data.estado || 'ACTIVA',
      ]
    );
    const id_sucursal = result.insertId;

    // 2. Crear automáticamente el Almacén asociado
    await connection.query(
      `INSERT INTO almacenes (nombre, id_sucursal, estado)
       VALUES (?, ?, 'activo')`,
      [`Almacén ${data.nombre}`, id_sucursal]
    );

    await connection.commit();
    
    // Retornamos los datos de la sucursal recién creada
    const [nuevaSucursal] = await connection.query('SELECT * FROM sucursales WHERE id = ?', [id_sucursal]);
    return nuevaSucursal[0];

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const actualizarSucursal = async (id, data) => {
  await obtenerSucursalPorId(id);
  const campos = ['codigo', 'nombre', 'direccion', 'departamento', 'ciudad', 'telefono', 'email', 'estado'];
  const sets = [];
  const values = [];
  for (const campo of campos) {
    if (data[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      values.push(data[campo]);
    }
  }
  if (sets.length === 0) {
    const err = new Error('No se enviaron campos para actualizar');
    err.status = 400;
    throw err;
  }
  values.push(id);
  await pool.query(`UPDATE sucursales SET ${sets.join(', ')} WHERE id = ?`, values);
  return obtenerSucursalPorId(id);
};

const eliminarSucursal = async (id) => {
  await obtenerSucursalPorId(id);
  await pool.query("UPDATE sucursales SET estado = 'INACTIVA' WHERE id = ?", [id]);
};

module.exports = {
  listarSucursales,
  obtenerSucursalPorId,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
};