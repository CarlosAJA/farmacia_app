const service = require('./ventas.service.js');

const listar = async (req, res) => {
  try {
    const data = await service.listarVentas(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listar ventas:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const data = await service.obtenerVentaPorId(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const id_usuario = req.usuario?.id || null;
    const data = await service.crearVenta(req.body, id_usuario);
    res.status(201).json({
      ok: true,
      data,
      mensaje: `Venta ${data.numero_factura} registrada correctamente.`,
    });
  } catch (err) {
    console.error('Error crear venta:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const anular = async (req, res) => {
  try {
    const data = await service.anularVenta(Number(req.params.id));
    res.json({ ok: true, data, mensaje: data.mensaje });
  } catch (err) {
    console.error('Error anular venta:', err.message);
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

module.exports = { listar, obtener, crear, anular };