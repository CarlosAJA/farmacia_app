const service = require('./clientes.service.js');

const buscarPorNit = async (req, res) => {
  try {
    const { nit } = req.params;
    const data = await service.buscarClientePorNit(nit);
    if (!data) {
      return res.json({ ok: true, data: null, mensaje: 'Cliente no encontrado' });
    }
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error buscarPorNit:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const listar = async (req, res) => {
  try {
    const data = await service.listarClientes(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listar clientes:', err.message); // 👈 Ahora sí veremos el error en Docker
    res.status(500).json({ ok: false, error: err.message });
  }
};

const historial = async (req, res) => {
  try {
    const data = await service.obtenerHistorialCliente(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error historial:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { buscarPorNit, listar, historial };