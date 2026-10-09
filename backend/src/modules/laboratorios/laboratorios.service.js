const pool = require('../../../src/config/db.js');

const listarLaboratorios = async (filtros = {}) => {
  let sql = 'SELECT id_laboratorio AS id, nombre, pais, telefono, email, estado FROM laboratorios';
  const params = [];

  if (filtros.estado) {
    sql += ' WHERE estado = ?';
    params.push(filtros.estado);
  }

  sql += ' ORDER BY nombre ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerLaboratorioPorId = async (id) => {
  const [rows] = await pool.query(
    'SELECT id_laboratorio AS id, nombre, pais, telefono, email, estado FROM laboratorios WHERE id_laboratorio = ?',
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Laboratorio no encontrado');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const crearLaboratorio = async (data) => {
  const [existe] = await pool.query(
    'SELECT id_laboratorio FROM laboratorios WHERE nombre = ?',
    [data.nombre]
  );
  if (existe.length > 0) {
    const err = new Error('Ya existe un laboratorio con ese nombre');
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO laboratorios (nombre, pais, telefono, email) VALUES (?, ?, ?, ?)',
    [data.nombre, data.pais || null, data.telefono || null, data.email || null]
  );
  return obtenerLaboratorioPorId(result.insertId);
};

const actualizarLaboratorio = async (id, data) => {
  await obtenerLaboratorioPorId(id);

  const campos = ['nombre', 'pais', 'telefono', 'email', 'estado'];
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
  await pool.query(`UPDATE laboratorios SET ${sets.join(', ')} WHERE id_laboratorio = ?`, values);
  return obtenerLaboratorioPorId(id);
};

const eliminarLaboratorio = async (id) => {
  await obtenerLaboratorioPorId(id);
  await pool.query("UPDATE laboratorios SET estado = 'inactivo' WHERE id_laboratorio = ?", [id]);
};

module.exports = {
  listarLaboratorios,
  obtenerLaboratorioPorId,
  crearLaboratorio,
  actualizarLaboratorio,
  eliminarLaboratorio,
};