const service = require('./reportes.service.js');

const dashboard = async (req, res) => {
  try {
    const data = await service.obtenerResumenDashboard();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error dashboard:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { dashboard };