const pool = require('../../../src/config/db.js');

const listarProveedores = async (filtros = {}) => {
  let sql = 'SELECT id_proveedor AS id, nombre_empresa AS nombre, contacto, telefono, email, direccion, ruc, estado FROM proveedores';
  const params = [];

  if (filtros.estado) {
    sql += ' WHERE estado = ?';
    params.push(filtros.estado);
  }

  sql += ' ORDER BY nombre_empresa ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const obtenerProveedorPorId = async (id) => {
  const [rows] = await pool.query(
    'SELECT id_proveedor AS id, nombre_empresa AS nombre, contacto, telefono, email, direccion, ruc, estado FROM proveedores WHERE id_proveedor = ?',
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Proveedor no encontrado');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const crearProveedor = async (data) => {
  const [existe] = await pool.query(
    'SELECT id_proveedor FROM proveedores WHERE nombre_empresa = ?',
    [data.nombre]
  );
  if (existe.length > 0) {
    const err = new Error('Ya existe un proveedor con ese nombre');
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO proveedores (nombre_empresa, contacto, telefono, email, direccion, ruc) VALUES (?, ?, ?, ?, ?, ?)',
    [data.nombre, data.contacto || null, data.telefono || null, data.email || null, data.direccion || null, data.ruc || null]
  );
  return obtenerProveedorPorId(result.insertId);
};

const actualizarProveedor = async (id, data) => {
  await obtenerProveedorPorId(id);

  const mapeo = {
    nombre: 'nombre_empresa',
    contacto: 'contacto',
    telefono: 'telefono',
    email: 'email',
    direccion: 'direccion',
    ruc: 'ruc',
    estado: 'estado',
  };

  const sets = [];
  const values = [];

  for (const [key, col] of Object.entries(mapeo)) {
    if (data[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(data[key]);
    }
  }

  if (sets.length === 0) {
    const err = new Error('No se enviaron campos para actualizar');
    err.status = 400;
    throw err;
  }

  values.push(id);
  await pool.query(`UPDATE proveedores SET ${sets.join(', ')} WHERE id_proveedor = ?`, values);
  return obtenerProveedorPorId(id);
};

const eliminarProveedor = async (id) => {
  await obtenerProveedorPorId(id);
  await pool.query("UPDATE proveedores SET estado = 'inactivo' WHERE id_proveedor = ?", [id]);
};

module.exports = {
  listarProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
};