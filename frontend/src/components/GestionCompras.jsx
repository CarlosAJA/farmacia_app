import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tabla from './Tabla';
import { comprasApi, catalogosApi } from '../api/compras';
import './GestionCompras.css';

export default function GestionCompras() {
  const navigate = useNavigate();

  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [filtros, setFiltros] = useState({
    estado: '',
    id_proveedor: '',
    busqueda: '',
  });

  const [detalleAbierto, setDetalleAbierto] = useState(null);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await comprasApi.listar(filtros);
      setCompras(data || []);
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al cargar compras', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    catalogosApi.proveedores().then(setProveedores).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [filtros]);

  const handleRecibir = async (id) => {
    if (!window.confirm('¿Marcar esta compra como recibida? El inventario se actualizará.')) return;
    try {
      const res = await comprasApi.recibir(id);
      mostrarMensaje(res.mensaje || 'Compra recibida.', 'exito');
      cargar();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al recibir', 'error');
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta compra?')) return;
    try {
      const res = await comprasApi.cancelar(id);
      mostrarMensaje(res.mensaje || 'Compra cancelada.', 'exito');
      cargar();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al cancelar', 'error');
    }
  };

  const verDetalle = async (id) => {
    try {
      const data = await comprasApi.obtener(id);
      setDetalleAbierto(data);
    } catch (err) {
      mostrarMensaje('Error al cargar detalle', 'error');
    }
  };

  const badgeEstado = (estado) => {
    const clases = {
      pendiente: 'badge-estado pendiente',
      recibida: 'badge-estado recibida',
      cancelada: 'badge-estado cancelada',
    };
    return <span className={clases[estado] || ''}>{estado}</span>;
  };

  const columnas = [
    { key: 'numero_orden', label: 'Nº Orden' },
    { key: 'proveedor_nombre', label: 'Proveedor' },
    { key: 'almacen_nombre', label: 'Almacén' },
    {
      key: 'fecha_compra',
      label: 'Fecha',
      render: (c) => new Date(c.fecha_compra).toLocaleDateString('es-BO'),
    },
    {
      key: 'total',
      label: 'Total',
      render: (c) => `Bs. ${Number(c.total).toFixed(2)}`,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (c) => badgeEstado(c.estado),
    },
  ];

  return (
    <div className="gestion-compras">
      <div className="header-compras">
        <div>
          <h1>Gestión de Compras</h1>
          <p className="subtitulo">Historial de órdenes de compra a proveedores.</p>
        </div>
        <button onClick={() => navigate('/compras/nueva')} className="btn-primario">
          + Nueva Compra
        </button>
      </div>

      {mensaje.texto && <div className={`alerta ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="filtros-compras">
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="recibida">Recibidas</option>
          <option value="cancelada">Canceladas</option>
        </select>

        <select
          value={filtros.id_proveedor}
          onChange={(e) => setFiltros({ ...filtros, id_proveedor: e.target.value })}
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>
              {p.nombre_empresa}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por Nº orden o proveedor..."
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
        />
      </div>

      <Tabla
        columnas={columnas}
        datos={compras}
        cargando={cargando}
        sinDatosMensaje="No hay compras registradas."
        clave="id_compra"
        acciones={(c) => (
          <div className="acciones-tabla">
            <button onClick={() => verDetalle(c.id_compra)} className="btn-ver">
              Ver
            </button>
            {c.estado === 'pendiente' && (
              <>
                <button onClick={() => handleRecibir(c.id_compra)} className="btn-recibir">
                  Recibir
                </button>
                <button onClick={() => handleCancelar(c.id_compra)} className="btn-cancelar">
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* MODAL DETALLE */}
      {detalleAbierto && (
        <div className="modal-overlay" onClick={() => setDetalleAbierto(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h3>Compra {detalleAbierto.numero_orden}</h3>
            <p className="modal-detalle">
              <strong>Proveedor:</strong> {detalleAbierto.proveedor_nombre}
            </p>
            <p className="modal-detalle">
              <strong>Almacén:</strong> {detalleAbierto.almacen_nombre}
            </p>
            <p className="modal-detalle">
              <strong>Estado:</strong> {badgeEstado(detalleAbierto.estado)}
            </p>

            <h4>Productos</h4>
            <table className="tabla-modal">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalleAbierto.detalles.map((d) => (
                  <tr key={d.id_detalle}>
                    <td>{d.producto_nombre}</td>
                    <td>{d.cantidad}</td>
                    <td>Bs. {Number(d.precio_unitario).toFixed(2)}</td>
                    <td>Bs. {Number(d.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totales-modal">
              <div>
                <span>Subtotal:</span> Bs. {Number(detalleAbierto.subtotal).toFixed(2)}
              </div>
              <div>
                <span>IVA:</span> Bs. {Number(detalleAbierto.iva).toFixed(2)}
              </div>
              <div className="total">
                <span>TOTAL:</span> Bs. {Number(detalleAbierto.total).toFixed(2)}
              </div>
            </div>

            <div className="modal-botones">
              <button onClick={() => setDetalleAbierto(null)} className="btn-secundario">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}