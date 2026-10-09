const service = require('./categorias.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarCategorias(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const data = await service.obtenerCategoriaPorId(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const data = await service.crearCategoria(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const data = await service.actualizarCategoria(Number(req.params.id), req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await service.eliminarCategoria(Number(req.params.id));
    res.json({ ok: true, mensaje: 'Categoría desactivada correctamente.' });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };