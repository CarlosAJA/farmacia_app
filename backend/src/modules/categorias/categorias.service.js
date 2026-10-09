const pool = require('../../../src/config/db.js');

const listarCategorias = async (filtros = {}) => {
  let sql = 'SELECT id_categoria AS id, nombre, descripcion, requiere_receta, estado FROM categorias';
  const params = [];

  if (filtros.estado) {
    sql += ' WHERE estado = ?';
    params.push(filtros.estado);
  }

  sql += ' ORDER BY nombre ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerCategoriaPorId = async (id) => {
  const [rows] = await pool.query(
    'SELECT id_categoria AS id, nombre, descripcion, requiere_receta, estado FROM categorias WHERE id_categoria = ?',
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Categoría no encontrada');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const crearCategoria = async (data) => {
  const [existe] = await pool.query(
    'SELECT id_categoria FROM categorias WHERE nombre = ?',
    [data.nombre]
  );
  if (existe.length > 0) {
    const err = new Error('Ya existe una categoría con ese nombre');
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO categorias (nombre, descripcion, requiere_receta) VALUES (?, ?, ?)',
    [data.nombre, data.descripcion || null, data.requiere_receta ? 1 : 0]
  );
  return obtenerCategoriaPorId(result.insertId);
};

const actualizarCategoria = async (id, data) => {
  await obtenerCategoriaPorId(id);

  const campos = ['nombre', 'descripcion', 'requiere_receta', 'estado'];
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
  await pool.query(`UPDATE categorias SET ${sets.join(', ')} WHERE id_categoria = ?`, values);
  return obtenerCategoriaPorId(id);
};

const eliminarCategoria = async (id) => {
  await obtenerCategoriaPorId(id);
  await pool.query("UPDATE categorias SET estado = 'inactivo' WHERE id_categoria = ?", [id]);
};

module.exports = {
  listarCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};