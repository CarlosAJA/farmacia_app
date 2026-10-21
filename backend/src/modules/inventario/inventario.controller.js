const service = require('./inventario.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarInventario(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listar inventario:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const listarMovimientos = async (req, res) => {
  try {
    const data = await service.listarMovimientos(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listar movimientos:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const ajustar = async (req, res) => {
  try {
    const id_inventario = Number(req.params.id);
    const { cantidad, motivo } = req.body;
    const id_usuario = req.usuario?.id || null;

    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({ ok: false, error: 'Debes enviar la cantidad nueva.' });
    }

    const data = await service.ajustarCantidad(
      id_inventario,
      Number(cantidad),
      motivo,
      id_usuario
    );
    res.json({ ok: true, data, mensaje: 'Cantidad ajustada correctamente.' });
  } catch (err) {
    console.error('Error ajustar inventario:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, listarMovimientos, ajustar };