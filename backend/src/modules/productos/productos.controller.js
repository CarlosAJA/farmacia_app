const service = require('./productos.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarProductos(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const data = await service.obtenerProductoPorId(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const data = await service.crearProducto(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const data = await service.actualizarProducto(Number(req.params.id), req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await service.eliminarProducto(Number(req.params.id));
    res.json({ ok: true, mensaje: 'Producto desactivado correctamente.' });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const alertas = async (req, res) => {
  try {
    const data = await service.obtenerAlertas();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, alertas };