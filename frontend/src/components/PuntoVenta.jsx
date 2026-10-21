import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogosApi } from '../api/compras';
import { ventasApi } from '../api/ventas';
import FacturaModal from './FacturaModal';
import './PuntoVenta.css';

export default function PuntoVenta() {
  const navigate = useNavigate();
  const inputBusqueda = useRef(null);

  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [idAlmacen, setIdAlmacen] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [ventaFactura, setVentaFactura] = useState(null);
  const [mostrarFactura, setMostrarFactura] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [al, pr] = await Promise.all([
          catalogosApi.almacenes(),
          catalogosApi.productos(),
        ]);
        setAlmacenes(al);
        setProductos(pr);
        if (al.length > 0) setIdAlmacen(String(al[0].id_almacen));
      } catch (err) {
        setError('Error al cargar catálogos');
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    if (!busqueda.trim()) {
      setProductosFiltrados([]);
      return;
    }
    const q = busqueda.toLowerCase();
    const filtrados = productos
      .filter(
        (p) =>
          p.codigo.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q)
      )
      .slice(0, 8);
    setProductosFiltrados(filtrados);
  }, [busqueda, productos]);

  const subtotal = carrito.reduce(
    (sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario),
    0
  );
  const iva = subtotal * 0.13;
  const total = subtotal + iva - Number(descuento);

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find((c) => c.id_producto === producto.id_producto);
    if (existente) {
      setCarrito(
        carrito.map((c) =>
          c.id_producto === producto.id_producto
            ? { ...c, cantidad: c.cantidad + 1 }
            : c
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          id_producto: producto.id_producto,
          codigo: producto.codigo,
          nombre: producto.nombre,
          presentacion: producto.presentacion,
          cantidad: 1,
          precio_unitario: Number(producto.precio_venta),
        },
      ]);
    }
    setBusqueda('');
    setProductosFiltrados([]);
    setTimeout(() => inputBusqueda.current?.focus(), 100);
  };

  const cambiarCantidad = (id_producto, nuevaCantidad) => {
    const cant = Number(nuevaCantidad);
    if (cant <= 0) {
      eliminarDelCarrito(id_producto);
      return;
    }
    setCarrito(
      carrito.map((c) =>
        c.id_producto === id_producto ? { ...c, cantidad: cant } : c
      )
    );
  };

  const cambiarPrecio = (id_producto, nuevoPrecio) => {
    setCarrito(
      carrito.map((c) =>
        c.id_producto === id_producto
          ? { ...c, precio_unitario: Number(nuevoPrecio) }
          : c
      )
    );
  };

  const eliminarDelCarrito = (id_producto) => {
    setCarrito(carrito.filter((c) => c.id_producto !== id_producto));
  };

  const limpiarCarrito = () => {
    if (carrito.length === 0) return;
    if (!window.confirm('¿Vaciar el carrito?')) return;
    setCarrito([]);
    setDescuento(0);
    setObservaciones('');
    setError(null);
    setExito(null);
    setVentaFactura(null);
  };

  const handleCobrar = async () => {
    setError(null);
    setExito(null);
    setVentaFactura(null);

    if (!idAlmacen) return setError('Selecciona un almacén');
    if (carrito.length === 0) return setError('El carrito está vacío');

    setCargando(true);
    try {
      const payload = {
        id_almacen: Number(idAlmacen),
        metodo_pago: metodoPago,
        descuento: Number(descuento),
        observaciones,
        detalles: carrito.map((c) => ({
          id_producto: Number(c.id_producto),
          cantidad: Number(c.cantidad),
          precio_unitario: Number(c.precio_unitario),
        })),
      };

      const res = await ventasApi.crear(payload);
      
      setCarrito([]);
      setDescuento(0);
      setObservaciones('');
      setExito(`✅ Venta ${res.data.numero_factura} cobrada exitosamente.`);

      try {
        const ventaCompleta = await ventasApi.obtener(res.data.id_venta);
        setVentaFactura(ventaCompleta);
      } catch (facturaError) {
        console.error("Error al cargar la factura", facturaError);
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="punto-venta">
      <h1>Punto de Venta</h1>
      <p className="subtitulo">Busca productos, agrégalos al carrito y cobra.</p>

      {error && <div className="alerta error">{error}</div>}
      {exito && <div className="alerta exito">{exito}</div>}

      <div className="pos-layout">
        <div className="pos-izquierda">
          <div className="card">
            <label>Almacén de venta</label>
            <select value={idAlmacen} onChange={(e) => setIdAlmacen(e.target.value)}>
              {almacenes.map((a) => (
                <option key={a.id_almacen} value={a.id_almacen}>
                  {a.nombre} {a.sucursal_nombre ? `— ${a.sucursal_nombre}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="card busqueda-card">
            <label>Buscar producto (código o nombre)</label>
            <input
              ref={inputBusqueda}
              type="text"
              placeholder="Escribe para buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
            />

            {productosFiltrados.length > 0 && (
              <div className="resultados-busqueda">
                {productosFiltrados.map((p) => (
                  <div key={p.id_producto} className="resultado-item" onClick={() => agregarAlCarrito(p)}>
                    <div className="resultado-info">
                      <strong>{p.codigo}</strong> — {p.nombre}
                      <div className="resultado-presentacion">{p.presentacion}</div>
                    </div>
                    <div className="resultado-precio">Bs. {Number(p.precio_venta).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Carrito</h2>
            {carrito.length === 0 ? (
              <p className="sin-datos">Aún no hay productos en el carrito.</p>
            ) : (
              <table className="tabla-carrito">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((c) => (
                    <tr key={c.id_producto}>
                      <td>
                        <strong>{c.codigo}</strong> — {c.nombre}
                        <div className="carrito-presentacion">{c.presentacion}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={c.cantidad}
                          onChange={(e) => cambiarCantidad(c.id_producto, e.target.value)}
                          className="input-cantidad"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={c.precio_unitario}
                          onChange={(e) => cambiarPrecio(c.id_producto, e.target.value)}
                          className="input-precio"
                        />
                      </td>
                      <td>Bs. {(Number(c.cantidad) * Number(c.precio_unitario)).toFixed(2)}</td>
                      <td>
                        <button onClick={() => eliminarDelCarrito(c.id_producto)} className="btn-eliminar-carrito">✖</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {carrito.length > 0 && (
              <button onClick={limpiarCarrito} className="btn-vaciar">Vaciar carrito</button>
            )}
          </div>
        </div>

        <div className="pos-derecha">
          <div className="card card-pago">
            <h2>Resumen de pago</h2>

            <div className="linea-total">
              <span>Total parcial:</span>
              <span>Bs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="linea-total">
              <span>IVA (13%):</span>
              <span>Bs. {iva.toFixed(2)}</span>
            </div>
            <div className="linea-total">
              <span>Descuento:</span>
              <input
                type="number" min="0" step="0.01"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="input-descuento"
              />
            </div>
            <div className="linea-total total-final">
              <span>TOTAL:</span>
              <span>Bs. {total.toFixed(2)}</span>
            </div>

            <label className="label-pago">Método de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="efectivo">💵 Efectivo</option>
              <option value="tarjeta">💳 Tarjeta</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="seguro">🏥 Seguro</option>
            </select>

            <label className="label-pago">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional..."
              rows={2}
            />

            <button
              onClick={handleCobrar}
              disabled={cargando || carrito.length === 0}
              className="btn-cobrar"
            >
              {cargando ? 'Procesando...' : `💵 COBRAR Bs. ${total.toFixed(2)}`}
            </button>

            {ventaFactura && (
              <button 
                onClick={() => setMostrarFactura(true)} 
                className="btn-imprimir-factura-panel"
              >
                🖨️ Ver / Imprimir Factura
              </button>
            )}

            <button onClick={() => navigate('/ventas')} className="btn-ver-historial">
              Ver historial de ventas
            </button>
          </div>
        </div>
      </div>

      {mostrarFactura && ventaFactura && (
        <FacturaModal 
          venta={ventaFactura} 
          onClose={() => setMostrarFactura(false)} 
        />
      )}
    </div>
  );
}