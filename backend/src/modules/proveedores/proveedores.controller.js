const service = require('./proveedores.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarProveedores(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const data = await service.obtenerProveedorPorId(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const data = await service.crearProveedor(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const data = await service.actualizarProveedor(Number(req.params.id), req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await service.eliminarProveedor(Number(req.params.id));
    res.json({ ok: true, mensaje: 'Proveedor desactivado correctamente.' });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };