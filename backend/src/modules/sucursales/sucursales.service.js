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
  // 👇 1. FORMATEAMOS LOS DATOS AQUÍ AL INICIO
  const dataFormateada = {
    ...data,
    codigo: data.codigo.trim().toUpperCase(),
    nombre: data.nombre.trim().toUpperCase(),
    direccion: data.direccion.trim().toUpperCase(),
    departamento: data.departamento.trim().toUpperCase(),
    ciudad: data.ciudad.trim().toUpperCase(),
    email: data.email ? data.email.trim().toLowerCase() : null, // El email va en minúsculas
  };

  // Validar que el código no exista (usando el formateado)
  const [existe] = await pool.query('SELECT id FROM sucursales WHERE codigo = ?', [dataFormateada.codigo]);
  if (existe.length > 0) {
    const error = new Error('Ya existe una sucursal con ese código');
    error.status = 409;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Crear la Sucursal (usando dataFormateada)
    const [result] = await connection.query(
      `INSERT INTO sucursales (codigo, nombre, direccion, departamento, ciudad, telefono, email, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dataFormateada.codigo,
        dataFormateada.nombre,
        dataFormateada.direccion,
        dataFormateada.departamento,
        dataFormateada.ciudad,
        dataFormateada.telefono || null,
        dataFormateada.email || null,
        dataFormateada.estado || 'ACTIVA',
      ]
    );
    const id_sucursal = result.insertId;

    // 2. Crear automáticamente el Almacén asociado
    await connection.query(
      `INSERT INTO almacenes (nombre, id_sucursal, estado)
       VALUES (?, ?, 'activo')`,
      [`Almacén ${dataFormateada.nombre}`, id_sucursal] // Usa el nombre formateado
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
  
  // 👇 1. FORMATEAMOS LOS DATOS QUE LLEGAN
  const dataFormateada = { ...data };
  
  // Convertimos a mayúsculas solo si el campo viene en el objeto
  const camposTexto = ['codigo', 'nombre', 'direccion', 'departamento', 'ciudad'];
  camposTexto.forEach((campo) => {
    if (dataFormateada[campo]) {
      dataFormateada[campo] = dataFormateada[campo].trim().toUpperCase();
    }
  });
  
  // El email siempre en minúsculas
  if (dataFormateada.email) {
    dataFormateada.email = dataFormateada.email.trim().toLowerCase();
  }

  const campos = ['codigo', 'nombre', 'direccion', 'departamento', 'ciudad', 'telefono', 'email', 'estado'];
  const sets = [];
  const values = [];
  
  for (const campo of campos) {
    // 👇 2. ITERAMOS SOBRE dataFormateada
    if (dataFormateada[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      values.push(dataFormateada[campo]);
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