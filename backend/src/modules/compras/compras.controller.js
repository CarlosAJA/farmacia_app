const service = require('./compras.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarCompras(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listar compras:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const data = await service.obtenerCompraPorId(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const id_usuario = req.usuario?.id || null;
    const data = await service.crearCompra(req.body, id_usuario);
    res.status(201).json({ ok: true, data, mensaje: 'Compra registrada correctamente.' });
  } catch (err) {
    console.error('Error crear compra:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const recibir = async (req, res) => {
  try {
    const data = await service.recibirCompra(Number(req.params.id));
    res.json({ ok: true, data, mensaje: data.mensaje });
  } catch (err) {
    console.error('Error recibir compra:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const cancelar = async (req, res) => {
  try {
    const data = await service.cancelarCompra(Number(req.params.id));
    res.json({ ok: true, data, mensaje: data.mensaje });
  } catch (err) {
    console.error('Error cancelar compra:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, obtener, crear, recibir, cancelar };