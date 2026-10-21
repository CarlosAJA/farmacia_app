import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { comprasApi, catalogosApi } from '../api/compras';
import './RegistrarCompra.css';

const DETALLE_VACIO = {
  id_producto: '',
  cantidad: 1,
  precio_unitario: 0,
  lote: '',
  fecha_vencimiento_lote: '',
};

export default function RegistrarCompra() {
  const navigate = useNavigate();

  // Catálogos
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  // Cabecera
  const [idProveedor, setIdProveedor] = useState('');
  const [idAlmacen, setIdAlmacen] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [tipoPago, setTipoPago] = useState('contado');
  const [diasCredito, setDiasCredito] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [observaciones, setObservaciones] = useState('');

  // Detalles (carrito)
  const [detalles, setDetalles] = useState([]);
  const [detalleActual, setDetalleActual] = useState(DETALLE_VACIO);

  // UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [p, pr, a] = await Promise.all([
          catalogosApi.proveedores(),
          catalogosApi.productos(),
          catalogosApi.almacenes(),
        ]);
        setProveedores(p);
        setProductos(pr);
        setAlmacenes(a);
      } catch (err) {
        setError('Error al cargar catálogos');
      }
    };
    cargar();
  }, []);

  // Cálculos automáticos
  const subtotal = detalles.reduce(
    (sum, d) => sum + Number(d.cantidad) * Number(d.precio_unitario),
    0
  );
  const iva = subtotal * 0.13;
  const total = subtotal + iva - Number(descuento);

  // Cuando cambia el producto seleccionado, precargar precio_compra
  const handleProductoChange = (id_producto) => {
    const prod = productos.find((p) => String(p.id_producto) === String(id_producto));
    setDetalleActual({
      ...detalleActual,
      id_producto,
      precio_unitario: prod ? Number(prod.precio_compra) : 0,
    });
  };

  const agregarDetalle = () => {
    if (!detalleActual.id_producto) {
      setError('Selecciona un producto');
      return;
    }
    if (Number(detalleActual.cantidad) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }
    if (Number(detalleActual.precio_unitario) <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    // Verificar duplicados
    if (detalles.some((d) => String(d.id_producto) === String(detalleActual.id_producto))) {
      setError('Ese producto ya está en la lista');
      return;
    }

    setDetalles([...detalles, { ...detalleActual }]);
    setDetalleActual(DETALLE_VACIO);
    setError(null);
  };

  const eliminarDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!idProveedor) {
      setError('Selecciona un proveedor');
      return;
    }
    if (!idAlmacen) {
      setError('Selecciona un almacén destino');
      return;
    }
    if (detalles.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setCargando(true);
    try {
      const payload = {
        id_proveedor: Number(idProveedor),
        id_almacen: Number(idAlmacen),
        fecha_entrega: fechaEntrega || null,
        tipo_pago: tipoPago,
        dias_credito: tipoPago === 'credito' ? Number(diasCredito) : 0,
        descuento: Number(descuento),
        observaciones,
        detalles: detalles.map((d) => ({
          id_producto: Number(d.id_producto),
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          lote: d.lote || null,
          fecha_vencimiento_lote: d.fecha_vencimiento_lote || null,
        })),
      };

      const res = await comprasApi.crear(payload);
      alert(`✅ Compra ${res.data.numero_orden} registrada como pendiente.`);
      navigate('/compras');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la compra');
    } finally {
      setCargando(false);
    }
  };

  const nombreProducto = (id) => {
    const p = productos.find((x) => String(x.id_producto) === String(id));
    return p ? `${p.codigo} — ${p.nombre}` : '';
  };

  return (
    <div className="registrar-compra">
      <h1>Registrar Compra</h1>
      <p className="subtitulo">
        Crea una orden de compra. Al recibirla, el inventario se actualizará automáticamente.
      </p>

      {error && <div className="alerta error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* CABECERA */}
        <div className="card">
          <h2>Datos de la orden</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Proveedor *</label>
              <select value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {proveedores.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_empresa}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Almacén destino *</label>
              <select value={idAlmacen} onChange={(e) => setIdAlmacen(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {almacenes.map((a) => (
                  <option key={a.id_almacen} value={a.id_almacen}>
                    {a.nombre}
                    {a.sucursal_nombre ? ` — ${a.sucursal_nombre}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha de entrega estimada</label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tipo de pago</label>
              <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            {tipoPago === 'credito' && (
              <div className="form-group">
                <label>Días de crédito</label>
                <input
                  type="number"
                  min="0"
                  value={diasCredito}
                  onChange={(e) => setDiasCredito(e.target.value)}
                />
              </div>
            )}

            <div className="form-group full-width">
              <label>Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                placeholder="Ej: Pedido mensual de insumos"
              />
            </div>
          </div>
        </div>

        {/* AGREGAR PRODUCTO */}
        <div className="card">
          <h2>Agregar productos</h2>
          <div className="form-grid-detalle">
            <div className="form-group">
              <label>Producto</label>
              <select
                value={detalleActual.id_producto}
                onChange={(e) => handleProductoChange(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.codigo} — {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                value={detalleActual.cantidad}
                onChange={(e) => setDetalleActual({ ...detalleActual, cantidad: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Precio unitario</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={detalleActual.precio_unitario}
                onChange={(e) =>
                  setDetalleActual({ ...detalleActual, precio_unitario: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Lote (opcional)</label>
              <input
                type="text"
                value={detalleActual.lote}
                onChange={(e) => setDetalleActual({ ...detalleActual, lote: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Vencimiento (opcional)</label>
              <input
                type="date"
                value={detalleActual.fecha_vencimiento_lote}
                onChange={(e) =>
                  setDetalleActual({ ...detalleActual, fecha_vencimiento_lote: e.target.value })
                }
              />
            </div>
            <button type="button" onClick={agregarDetalle} className="btn-agregar">
              + Agregar
            </button>
          </div>
        </div>

        {/* DETALLES */}
        <div className="card">
          <h2>Detalle de la compra</h2>
          {detalles.length === 0 ? (
            <p className="sin-datos">Aún no has agregado productos.</p>
          ) : (
            <table className="tabla-detalle">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, i) => (
                  <tr key={i}>
                    <td>{nombreProducto(d.id_producto)}</td>
                    <td>{d.cantidad}</td>
                    <td>Bs. {Number(d.precio_unitario).toFixed(2)}</td>
                    <td>Bs. {(Number(d.cantidad) * Number(d.precio_unitario)).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => eliminarDetalle(i)}
                        className="btn-eliminar-detalle"
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* TOTALES */}
        <div className="card totales-card">
          <div className="totales">
            <div className="linea">
              <span>Subtotal:</span>
              <span>Bs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="linea">
              <span>IVA (13%):</span>
              <span>Bs. {iva.toFixed(2)}</span>
            </div>
            <div className="linea">
              <span>Descuento:</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="input-descuento"
              />
            </div>
            <div className="linea total">
              <span>TOTAL:</span>
              <span>Bs. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="botones-finales">
          <button type="button" onClick={() => navigate('/compras')} className="btn-secundario">
            Cancelar
          </button>
          <button type="submit" className="btn-primario" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Registrar Compra'}
          </button>
        </div>
      </form>
    </div>
  );
}