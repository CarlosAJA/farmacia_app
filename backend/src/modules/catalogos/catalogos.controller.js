const service = require('./catalogos.service.js');

const proveedores = async (req, res) => {
  try {
    const data = await service.listarProveedores();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

const productos = async (req, res) => {
  try {
    const data = await service.listarProductos();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

const almacenes = async (req, res) => {
  try {
    const data = await service.listarAlmacenes();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { proveedores, productos, almacenes };