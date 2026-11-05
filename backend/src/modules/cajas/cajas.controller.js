const service = require('./cajas.service.js');

const verificar = async (req, res) => {
  try {
    const caja = await service.obtenerCajaActiva(req.usuario.id);
    res.json({ ok: true, data: caja });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

const abrir = async (req, res) => {
  try {
    const { id_almacen, monto_apertura } = req.body;
    const data = await service.abrirCaja(req.usuario.id, id_almacen, monto_apertura);
    res.json({ ok: true, data, mensaje: 'Caja abierta correctamente.' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

const resumen = async (req, res) => {
  try {
    const data = await service.obtenerResumenCaja(req.params.id);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

const cerrar = async (req, res) => {
  try {
    const { monto_real } = req.body;
    const data = await service.cerrarCaja(req.params.id, monto_real);
    res.json({ ok: true, data, mensaje: 'Caja cerrada correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { verificar, abrir, resumen, cerrar };