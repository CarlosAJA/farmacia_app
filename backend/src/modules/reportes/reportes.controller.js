const service = require('./reportes.service.js');

const dashboard = async (req, res) => {
  try {
    const data = await service.obtenerResumenDashboard(req.query.id_sucursal);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { dashboard };