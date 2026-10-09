const service = require('./sucursales.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarSucursales(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listar:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const data = await service.obtenerSucursalPorId(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const data = await service.crearSucursal(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    console.error('Error crear:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const data = await service.actualizarSucursal(Number(req.params.id), req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await service.eliminarSucursal(Number(req.params.id));
    res.json({ ok: true, mensaje: 'Sucursal desactivada correctamente.' });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };