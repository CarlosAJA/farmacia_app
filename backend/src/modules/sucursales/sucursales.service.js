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
  const [existe] = await pool.query('SELECT id FROM sucursales WHERE codigo = ?', [data.codigo]);
  if (existe.length > 0) {
    const err = new Error('Ya existe una sucursal con ese código');
    err.status = 409;
    throw err;
  }
  const [result] = await pool.query(
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
  return obtenerSucursalPorId(result.insertId);
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