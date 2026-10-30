const service = require('./reportes.service.js');

const dashboard = async (req, res) => {
  try {
    // Si es admin, ve todo (null). Si es vendedor/farmaceutico, ve su sucursal.
    const id_sucursal = req.usuario?.rol === 'admin' ? null : (req.usuario?.sucursal_id || null);
    
    const data = await service.obtenerResumenDashboard(id_sucursal);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error dashboard:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { dashboard };