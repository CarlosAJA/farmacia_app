import { useEffect, useState } from 'react';
import axios from 'axios';
import Tabla from './Tabla';
import { inventarioApi } from '../api/inventario';
import { exportarAExcel } from '../utils/excelUtils';
import './GestionInventario.css';

const GestionInventario = () => {
  const [inventario, setInventario] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Filtros
  const [filtros, setFiltros] = useState({
    id_sucursal: '',
    id_almacen: '',
    busqueda: '',
    soloStockBajo: false,
  });

  // Modal de ajuste
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [motivo, setMotivo] = useState('');

  // Estados para el Traspaso
  const [modalTraspaso, setModalTraspaso] = useState(false);
  const [itemTraspaso, setItemTraspaso] = useState(null);
  const [cantidadTraspaso, setCantidadTraspaso] = useState('');
  const [almacenDestino, setAlmacenDestino] = useState('');
  const [motivoTraspaso, setMotivoTraspaso] = useState('');

  const headersAuth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  const cargarInventario = async () => {
    try {
      setCargando(true);
      const data = await inventarioApi.listar(filtros);
      setInventario(data || []);
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al cargar inventario', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      // Hacemos las dos peticiones al mismo tiempo
      const [sucRes, almRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sucursales', headersAuth()),
        axios.get('http://localhost:5000/api/catalogos/almacenes', headersAuth())
      ]);
      setSucursales(sucRes.data.data || []);
      setAlmacenes(almRes.data.data || []); // 👈 Ahora sí llenamos los almacenes
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarInventario();
  }, [filtros]);

  const abrirModal = (item) => {
    setItemEditando(item);
    setNuevaCantidad(String(item.cantidad));
    setMotivo('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setItemEditando(null);
    setNuevaCantidad('');
    setMotivo('');
  };

  const confirmarAjuste = async () => {
    if (!itemEditando) return;
    const cantidad = Number(nuevaCantidad);
    if (isNaN(cantidad) || cantidad < 0) {
      mostrarMensaje('La cantidad debe ser un número mayor o igual a 0', 'error');
      return;
    }

    try {
      await inventarioApi.ajustar(itemEditando.id_inventario, cantidad, motivo);
      mostrarMensaje('Cantidad ajustada correctamente.', 'exito');
      cerrarModal();
      cargarInventario();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al ajustar', 'error');
    }
  };

  const columnas = [
    { key: 'codigo', label: 'Código' },
    { key: 'producto_nombre', label: 'Producto' },
    { key: 'categoria_nombre', label: 'Categoría' },
    { key: 'sucursal_nombre', label: 'Sucursal' },
    { key: 'almacen_nombre', label: 'Almacén' },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (item) => {
        const bajo = item.cantidad <= item.stock_minimo;
        const sinStock = item.cantidad === 0;
        const clase = sinStock ? 'stock-cero' : bajo ? 'stock-bajo' : 'stock-ok';
        return <span className={`badge-stock ${clase}`}>{item.cantidad}</span>;
      },
    },
    {
      key: 'stock_minimo',
      label: 'Mínimo',
      render: (item) => item.stock_minimo,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (item) => (
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => abrirModal(item)} className="btn-ajustar">Ajustar</button>
          <button onClick={() => abrirTraspaso(item)} className="btn-traspaso">Transferir</button>
        </div>
      ),
    },
  ];

   const abrirTraspaso = (item) => {
    setItemTraspaso(item);
    setCantidadTraspaso('');
    setAlmacenDestino('');
    setMotivoTraspaso('');
    setModalTraspaso(true);
  };

  const confirmarTraspaso = async () => {
    if (!almacenDestino) return mostrarMensaje('Selecciona un almacén destino', 'error');
    if (!cantidadTraspaso || Number(cantidadTraspaso) <= 0) return mostrarMensaje('Cantidad inválida', 'error');
    if (Number(cantidadTraspaso) > itemTraspaso.cantidad) return mostrarMensaje('No puedes transferir más de lo que tienes', 'error');

    try {
      await inventarioApi.transferir({
        id_producto: itemTraspaso.id_producto,
        id_almacen_origen: itemTraspaso.id_almacen,
        id_almacen_destino: Number(almacenDestino),
        cantidad: Number(cantidadTraspaso),
        motivo: motivoTraspaso
      });
      mostrarMensaje('Traspaso realizado correctamente.', 'exito');
      setModalTraspaso(false);
      cargarInventario();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al transferir', 'error');
    }
  };
  const handleExportar = () => {
    // Definimos cómo queremos que se vean las columnas en Excel
    const columnasExcel = [
      { key: 'codigo', label: 'Código' },
      { key: 'producto_nombre', label: 'Producto' },
      { key: 'categoria_nombre', label: 'Categoría' },
      { key: 'almacen_nombre', label: 'Almacén' },
      { key: 'sucursal_nombre', label: 'Sucursal' },
      { 
        key: 'cantidad',
        label: 'Cantidad',
        exportValue: (v) => Number(v.cantidad)
      },
      { 
        key: 'stock_minimo',
        label: 'Stock Mínimo',
        exportValue: (v) => Number(v.stock_minimo)
      },
      { key: 'estado', label: 'Estado' },
    ];
    
    exportarAExcel(inventario, columnasExcel, 'Reporte_Inventario');
  };

  return (
    <div className="gestion-inventario">
      <h1>Gestión de Inventario</h1>
      <p className="subtitulo">
        Consulta y ajusta el stock de productos por sucursal y almacén.
      </p>

      {mensaje.texto && (
        <div className={`alerta ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {/* Filtros */}
      <div className="filtros-inventario">
        <select
          value={filtros.id_sucursal}
          onChange={(e) =>
            setFiltros({ ...filtros, id_sucursal: e.target.value, id_almacen: '' })
          }
        >
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.codigo} — {s.nombre}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
        />

        <label className="filtro-checkbox">
          <input
            type="checkbox"
            checked={filtros.soloStockBajo}
            onChange={(e) => setFiltros({ ...filtros, soloStockBajo: e.target.checked })}
          />
          Solo stock bajo
        </label>
         <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportar} className="btn-excel">
              📊 Exportar a Excel
            </button>
          </div>
      </div>

      <Tabla
        columnas={columnas}
        datos={inventario}
        cargando={cargando}
        sinDatosMensaje="No hay registros de inventario."
          clave="id_inventario"
      />

      {/* Modal de ajuste */}
      {modalAbierto && itemEditando && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h3>Ajustar cantidad</h3>
            <p>
              <strong>{itemEditando.producto_nombre}</strong>
            </p>
            <p className="modal-detalle">
              Sucursal: {itemEditando.sucursal_nombre} · Almacén: {itemEditando.almacen_nombre}
            </p>
            <p>
              Cantidad actual: <strong>{itemEditando.cantidad}</strong>
            </p>

            <label>
              Nueva cantidad:
              <input
                type="number"
                min="0"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                autoFocus
              />
            </label>

            <label>
              Motivo (opcional):
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Ajuste por inventario físico"
                rows={3}
              />
            </label>

            <div className="modal-botones">
              <button onClick={confirmarAjuste} className="btn-primario">
                Confirmar ajuste
              </button>
              <button onClick={cerrarModal} className="btn-secundario">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
{/* MODAL DE TRASPASO */}
      {modalTraspaso && itemTraspaso && (
        <div className="modal-overlay" onClick={() => setModalTraspaso(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h3>Transferir Producto</h3>
            <p><strong>{itemTraspaso.producto_nombre}</strong></p>
            <p className="modal-detalle">Origen: {itemTraspaso.almacen_nombre} (Stock: {itemTraspaso.cantidad})</p>

            <label>Almacén Destino:</label>
            <select value={almacenDestino} onChange={(e) => setAlmacenDestino(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
              <option value="">— Seleccionar —</option>
              {almacenes.filter(a => a.id_almacen !== itemTraspaso.id_almacen).map(a => (
                <option key={a.id_almacen} value={a.id_almacen}>{a.nombre}</option>
              ))}
            </select>

            <label>Cantidad a transferir:</label>
            <input type="number" min="1" max={itemTraspaso.cantidad} value={cantidadTraspaso} onChange={(e) => setCantidadTraspaso(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />

            <label>Motivo (opcional):</label>
            <textarea value={motivoTraspaso} onChange={(e) => setMotivoTraspaso(e.target.value)} rows={2} style={{ width: '100%', padding: '8px' }} />

            <div className="modal-botones" style={{ marginTop: '20px' }}>
              <button onClick={confirmarTraspaso} className="btn-primario">Confirmar Traspaso</button>
              <button onClick={() => setModalTraspaso(false)} className="btn-secundario">Cancelar</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default GestionInventario;