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

const configurarVenta = async (req, res) => {
  try {
    const data = await service.configurarVenta(Number(req.params.id), req.body.precio_venta, req.body.stock_minimo);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
};

const configurar = async (req, res) => {
  try {
    const { precio_venta, stock_minimo } = req.body;
    const data = await service.configurarVenta(req.params.id, precio_venta, stock_minimo);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { 
  listar, 
  obtener, 
  crear, 
  actualizar, 
  eliminar, 
  alertas, 
  configurarVenta,
  configurar,
};