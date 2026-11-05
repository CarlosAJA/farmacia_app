const pool = require('../../config/db.js');

const obtenerCajaActiva = async (id_usuario) => {
  const [rows] = await pool.query(
    `SELECT c.*, a.nombre AS almacen_nombre 
     FROM sesiones_caja c 
     INNER JOIN almacenes a ON c.id_almacen = a.id_almacen 
     WHERE c.id_usuario = ? AND c.estado = 'abierta'`,
    [id_usuario]
  );
  return rows.length > 0 ? rows[0] : null;
};

const abrirCaja = async (id_usuario, id_almacen, monto_apertura) => {
  const cajaActiva = await obtenerCajaActiva(id_usuario);
  if (cajaActiva) throw new Error('Ya tienes una caja abierta. Debes cerrarla primero.');

  const [result] = await pool.query(
    'INSERT INTO sesiones_caja (id_usuario, id_almacen, monto_apertura) VALUES (?, ?, ?)',
    [id_usuario, id_almacen, monto_apertura]
  );
  return { id_sesion: result.insertId };
};

const obtenerResumenCaja = async (id_sesion) => {
  const [caja] = await pool.query('SELECT * FROM sesiones_caja WHERE id_sesion = ?', [id_sesion]);
  if (caja.length === 0) throw new Error('Sesión de caja no encontrada');
  
  const sesion = caja[0];

  // Sumar ventas por método de pago desde que se abrió la caja
  const [ventas] = await pool.query(`
    SELECT 
      IFNULL(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
      IFNULL(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS tarjeta,
      IFNULL(SUM(CASE WHEN metodo_pago = 'qr' THEN total ELSE 0 END), 0) AS qr,
      IFNULL(SUM(CASE WHEN metodo_pago = 'mixto' THEN monto_efectivo ELSE 0 END), 0) AS mixto_efectivo,
      IFNULL(SUM(total), 0) AS total_ventas
    FROM ventas 
    WHERE id_sesion_caja = ? AND estado = 'completada'
  `, [id_sesion]);

  const totalEfectivoSistema = Number(sesion.monto_apertura) + Number(ventas[0].efectivo) + Number(ventas[0].mixto_efectivo);

  return {
    id_sesion,
    monto_apertura: sesion.monto_apertura,
    ventas_efectivo: ventas[0].efectivo,
    ventas_tarjeta: ventas[0].tarjeta,
    ventas_qr: ventas[0].qr,
    ventas_mixto_efectivo: ventas[0].mixto_efectivo,
    total_ventas: ventas[0].total_ventas,
    total_efectivo_sistema: totalEfectivoSistema
  };
};

const cerrarCaja = async (id_sesion, monto_real) => {
  const resumen = await obtenerResumenCaja(id_sesion);
  const monto_sistema = resumen.total_efectivo_sistema;
  const diferencia = monto_real - monto_sistema;

  await pool.query(
    `UPDATE sesiones_caja 
     SET fecha_cierre = NOW(), monto_sistema = ?, monto_real = ?, diferencia = ?, estado = 'cerrada' 
     WHERE id_sesion = ?`,
    [monto_sistema, monto_real, diferencia, id_sesion]
  );

  return { monto_sistema, monto_real, diferencia };
};

module.exports = { obtenerCajaActiva, abrirCaja, obtenerResumenCaja, cerrarCaja };