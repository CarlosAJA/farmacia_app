import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogosApi } from '../api/compras';
import { ventasApi } from '../api/ventas';
import FacturaModal from './FacturaModal';
import { inventarioApi } from '../api/inventario';
import { AuthContext } from '../AuthContext';
import { cajasApi } from '../api/cajas';
import { useContext } from 'react'; // Asegúrate de tenerlo
import './PuntoVenta.css';

export default function PuntoVenta() {
  const navigate = useNavigate();
  const [sesionCaja, setSesionCaja] = useState(null);
  const inputBusqueda = useRef(null);

  // Dentro del componente:
  const { user } = useContext(AuthContext);
  const isAdmin = user?.rol === 'admin';

  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [idAlmacen, setIdAlmacen] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [ventaFactura, setVentaFactura] = useState(null);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [stockPorProducto, setStockPorProducto] = useState({});
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTarjeta, setMontoTarjeta] = useState(0);
  const [montoQr, setMontoQr] = useState(0);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  
  // Estados del Cliente
  const [nitCi, setNitCi] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verificar = async () => {
      const caja = await cajasApi.verificarCajaActiva();
      setSesionCaja(caja);
    };
    verificar();
  }, []);  

  useEffect(() => {
    const cargar = async () => {
      try {
        const [al, pr] = await Promise.all([
          catalogosApi.almacenes(),
          catalogosApi.productos(),
        ]);
        
        // Si NO es admin y tiene sucursal, filtramos sus almacenes
        let almacenesPermitidos = al;
        if (!isAdmin && user?.sucursal_id) {
          almacenesPermitidos = al.filter(a => a.id_sucursal === user.sucursal_id);
        }

        setAlmacenes(almacenesPermitidos);
        setProductos(pr);
        
        if (almacenesPermitidos.length > 0) {
          setIdAlmacen(String(almacenesPermitidos[0].id_almacen));
        }
      } catch (err) {
        setError('Error al cargar catálogos');
      }
    };
    cargar();
  }, [user, isAdmin]);

  // Cargar el stock del almacén seleccionado
  useEffect(() => {
    const cargarStock = async () => {
      if (!idAlmacen) return;
      try {
        const data = await inventarioApi.listar({ id_almacen: idAlmacen });
        const mapaStock = {};
        data.forEach((item) => {
          mapaStock[item.id_producto] = item.cantidad;
        });
        setStockPorProducto(mapaStock);
      } catch (error) {
        console.error('Error al cargar el stock:', error);
      }
    };
    cargarStock();
  }, [idAlmacen]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setProductosFiltrados([]);
      return;
    }
    const q = busqueda.toLowerCase();
    const filtrados = productos
      .filter((p) => {
        const coincideCodigo = p.codigo.toLowerCase().includes(q);
        const coincideNombre = p.nombre.toLowerCase().includes(q);
        const coincideLab = p.laboratorio_nombre 
          ? p.laboratorio_nombre.toLowerCase().includes(q) 
          : false;
        return coincideCodigo || coincideNombre || coincideLab;
      })
      .slice(0, 10);
      
    setProductosFiltrados(filtrados);
  }, [busqueda, productos]);

  const subtotal = carrito.reduce(
    (sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario),
    0
  );
  const iva = 0;
  const porcentajeDescuento = Number(descuento) || 0;
  const montoDescuento = subtotal * (porcentajeDescuento / 100);
  const total = subtotal - montoDescuento;

  let montoCambio = 0;
  if (metodoPago === 'efectivo') {
    montoCambio = Number(montoRecibido) > total ? Number(montoRecibido) - total : 0;
  } else if (metodoPago === 'mixto') {
    const sumaMixto = Number(montoEfectivo) + Number(montoTarjeta) + Number(montoQr);
    montoCambio = sumaMixto > total ? sumaMixto - total : 0;
  }

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
    setIndiceSeleccionado(0);
    setTimeout(() => inputBusqueda.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (productosFiltrados.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSeleccionado((prev) => 
        prev < productosFiltrados.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSeleccionado((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const producto = productosFiltrados[indiceSeleccionado];
      if (producto) {
        const stock = stockPorProducto[producto.id_producto] || 0;
        if (stock === 0) {
          alert('No hay stock de este producto en este almacén.');
        } else {
          agregarAlCarrito(producto);
        }
      }
    } else if (e.key === 'Escape') {
      setBusqueda('');
      setProductosFiltrados([]);
    }
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
    // setObservaciones(''); // ELIMINADO
    setError(null);
    setExito(null);
    setVentaFactura(null);
  };
  const buscarCliente = async () => {
    if (!nitCi.trim()) return;
    
    try {
      const res = await fetch(`/clientes/${nitCi}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      
      if (data.ok && data.data) {
        // Si existe, llenamos los campos
        setRazonSocial(data.data.razon_social);
        setCelular(data.data.celular || '');
        setEmail(data.data.email || '');
      } else {
        // Si no existe, limpiamos los campos para que ingrese uno nuevo
        setRazonSocial('');
        setCelular('');
        setEmail('');
      }
    } catch (error) {
      console.error('Error al buscar cliente', error);
    }
  };


  const handleCobrar = async () => {
    setError(null);
    setExito(null);
    setVentaFactura(null);

    if (!idAlmacen) return setError('Selecciona un almacén');
    if (carrito.length === 0) return setError('El carrito está vacío');
    if (!nitCi || !razonSocial) {
      return setError('El NIT/CI y la Razón Social son obligatorios para facturar.');
    }

    setCargando(true);
    try {
      const payload = {
        id_almacen: Number(idAlmacen),
        metodo_pago: metodoPago,
        descuento: montoDescuento,
        detalles: carrito.map((c) => ({
          id_producto: Number(c.id_producto),
          cantidad: Number(c.cantidad),
          precio_unitario: Number(c.precio_unitario),
        })),
        id_sesion_caja: sesionCaja.id_sesion, // 👈 AGREGAR ESTO
        monto_recibido: Number(montoRecibido),
        monto_cambio: montoCambio,
        monto_efectivo: metodoPago === 'mixto' ? Number(montoEfectivo) : (metodoPago === 'efectivo' ? total : 0),
        monto_tarjeta: metodoPago === 'mixto' ? Number(montoTarjeta) : (metodoPago === 'tarjeta' ? total : 0),
        monto_qr: metodoPago === 'mixto' ? Number(montoQr) : (metodoPago === 'qr' ? total : 0),
        cliente_nit: nitCi,
        cliente_razon_social: razonSocial,
        cliente_celular: celular,
        cliente_email: email
        

      };

      const res = await ventasApi.crear(payload);
      
      setCarrito([]);
      setDescuento(0);
      setMontoRecibido(0);
      setMontoEfectivo(0);
      setMontoTarjeta(0);
      setMontoQr(0);
      setNitCi('');
      setRazonSocial('');
      setCelular('');
      setEmail('');

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
              {/* SI ES ADMIN: Mostrar el selector */}
              {isAdmin ? (
                <select value={idAlmacen} onChange={(e) => setIdAlmacen(e.target.value)}>
                  {almacenes.map((a) => (
                    <option key={a.id_almacen} value={a.id_almacen}>
                      {a.nombre} {a.sucursal_nombre ? `— ${a.sucursal_nombre}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                /* SI NO ES ADMIN: Mostrar el texto fijo */
                <div style={{ padding: '10px', background: '#eaf4fc', borderRadius: '4px', fontWeight: 'bold', color: '#2c3e50' }}>
                  🏢 {almacenes.length > 0 ? almacenes[0].nombre : 'Sin almacén asignado'}
                </div>
              )}
            </div>

          <div className="card busqueda-card">
            <label>Buscar producto por(código, nombre o laboratorio)</label>
            <input
              ref={inputBusqueda}
              type="text"
              placeholder="Escribe para buscar..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setIndiceSeleccionado(0);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            {productosFiltrados.map((p, index) => {
              const stock = stockPorProducto[p.id_producto] || 0;
              const isSelected = index === indiceSeleccionado;
              return (
                <div 
                  key={p.id_producto} 
                  className={`resultado-item ${stock === 0 ? 'sin-stock' : ''} ${isSelected ? 'activo' : ''}`} 
                  onClick={() => {
                    if (stock === 0) return alert('No hay stock de este producto en este almacén.');
                    agregarAlCarrito(p);
                  }}
                  ref={isSelected ? (el) => el?.scrollIntoView({ block: 'nearest' }) : null}>
                  <div className="resultado-info">
                    <div>
                      <strong>{p.codigo}</strong> — {p.nombre}
                    </div>
                    <div className="resultado-presentacion">
                      {p.presentacion} | 🏭 {p.laboratorio_nombre || 'S/L'}
                    </div>
                  </div>
                  <div className="resultado-precio-stock">
                    <span className={`badge-stock-pos ${stock > 0 ? 'ok' : 'cero'}`}>
                      Stock: {stock}
                    </span>
                    <span className="resultado-precio">
                      Bs. {Number(p.precio_venta).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div> {/* 👈 ESTE ERA EL CIERRE QUE FALTABA */}

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
                          readOnly
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
              <span>Descuento:</span>
              <input
                type="number" 
                min="0" 
                max="100"
                step="1"
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
              <option value="qr">📱 QR</option>
              <option value="mixto">🔀 Mixto</option>
            </select>

            {metodoPago === 'efectivo' && (
              <div className="pago-efectivo-box">
                <label>Efectivo Recibido:</label>
                <input 
                  type="number" 
                  min="0" 
                  value={montoRecibido} 
                  onChange={(e) => setMontoRecibido(e.target.value)} 
                  className="input-pago"
                />
                <div className="cambio-texto">
                  Cambio: <strong>Bs. {montoCambio.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {metodoPago === 'mixto' && (
              <div className="pago-mixto-box">
                <div className="input-group">
                  <label>Efectivo (Bs.):</label>
                  <input type="number" min="0" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} className="input-pago" />
                </div>
                <div className="input-group">
                  <label>Tarjeta (Bs.):</label>
                  <input type="number" min="0" value={montoTarjeta} onChange={(e) => setMontoTarjeta(e.target.value)} className="input-pago" />
                </div>
                <div className="input-group">
                  <label>QR (Bs.):</label>
                  <input type="number" min="0" value={montoQr} onChange={(e) => setMontoQr(e.target.value)} className="input-pago" />
                </div>
                <div className="cambio-texto" style={{ marginTop: '10px' }}>
                  Total Ingresado: Bs. {(Number(montoEfectivo) + Number(montoTarjeta) + Number(montoQr)).toFixed(2)}
                  {montoCambio > 0 && <><br/>Cambio: <strong>Bs. {montoCambio.toFixed(2)}</strong></>}
                </div>
              </div>
            )}
            
            <div className="datos-cliente-box">
              <h3>Datos del Cliente</h3>
              <div className="input-group">
                <label>NIT/CI *</label>
                <input 
                  type="text" 
                  value={nitCi} 
                  onChange={(e) => setNitCi(e.target.value)} 
                  onBlur={buscarCliente} // 👈 Busca cuando se sale del campo
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      buscarCliente(); // 👈 Busca si presiona Enter
                    }
                  }}
                  placeholder="Ej. 12345678" 
                  required 
                />
                <small style={{color: '#7f8c8d', fontSize: '11px'}}>Presione Enter para buscar cliente</small>
              </div>
              <div className="input-group">
                <label>Razón Social / Nombre *</label>
                <input type="text" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Ej. Juan Pérez" required />
              </div>
              <div className="input-group">
                <label>Celular (Opcional)</label>
                <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Correo (Opcional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <button
                onClick={handleCobrar}
                disabled={
                  cargando || 
                  carrito.length === 0 || 
                  (metodoPago === 'efectivo' && Number(montoRecibido) < total) ||
                  (metodoPago === 'mixto' && (Number(montoEfectivo) + Number(montoTarjeta) + Number(montoQr)) < total)
                }
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