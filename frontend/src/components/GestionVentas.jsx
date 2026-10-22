import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tabla from './Tabla';
import { ventasApi } from '../api/ventas';
import FacturaModal from './FacturaModal';
import { exportarAExcel } from '../utils/excelUtils';
import './GestionVentas.css';

export default function GestionVentas() {
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  // Estado para controlar qué factura estamos viendo
  const [ventaFactura, setVentaFactura] = useState(null);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await ventasApi.listar(filtros);
      setVentas(data || []);
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al cargar ventas', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtros]);

  const handleAnular = async (id) => {
    if (!window.confirm('¿Anular esta venta? El stock se devolverá al inventario.')) return;
    try {
      const res = await ventasApi.anular(id);
      mostrarMensaje(res.mensaje || 'Venta anulada.', 'exito');
      cargar();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || 'Error al anular', 'error');
    }
  };

  const verFactura = async (id) => {
    try {
      const data = await ventasApi.obtener(id);
      setVentaFactura(data);
    } catch (err) {
      mostrarMensaje('Error al cargar la factura', 'error');
    }
  };

  const badgeEstado = (estado) => {
    const clases = {
      pendiente: 'badge-estado pendiente',
      completada: 'badge-estado completada',
      anulada: 'badge-estado anulada',
    };
    return <span className={clases[estado] || ''}>{estado}</span>;
  };

  const badgeMetodo = (metodo) => {
    const iconos = {
      efectivo: '💵',
      tarjeta: '💳',
      transferencia: '🏦',
      seguro: '🏥',
    };
    return `${iconos[metodo] || ''} ${metodo}`;
  };

  const columnas = [
    { key: 'numero_factura', label: 'Nº Factura' },
    {
      key: 'fecha_venta',
      label: 'Fecha',
      render: (v) =>
        new Date(v.fecha_venta).toLocaleString('es-BO', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
    { key: 'usuario_nombre', label: 'Vendedor' },
    { key: 'almacen_nombre', label: 'Almacén' },
    {
      key: 'metodo_pago',
      label: 'Pago',
      render: (v) => badgeMetodo(v.metodo_pago),
    },
    {
      key: 'total',
      label: 'Total',
      render: (v) => `Bs. ${Number(v.total).toFixed(2)}`,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (v) => badgeEstado(v.estado),
    },
  ];
   const handleExportar = () => {
    // Definimos cómo queremos que se vean las columnas en Excel
    const columnasExcel = [
      { key: 'numero_factura', label: 'Nº Factura' },
      { 
        key: 'fecha_venta', 
        label: 'Fecha',
        exportValue: (v) => new Date(v.fecha_venta).toLocaleString('es-BO')
      },
      { key: 'usuario_nombre', label: 'Vendedor' },
      { key: 'almacen_nombre', label: 'Almacén' },
      { key: 'metodo_pago', label: 'Método de Pago' },
      { 
        key: 'subtotal', 
        label: 'Subtotal (Bs.)',
        exportValue: (v) => Number(v.subtotal)
      },
      { 
        key: 'iva', 
        label: 'IVA (Bs.)',
        exportValue: (v) => Number(v.iva)
      },
      { 
        key: 'total', 
        label: 'Total (Bs.)',
        exportValue: (v) => Number(v.total)
      },
      { key: 'estado', label: 'Estado' },
    ];
    
    exportarAExcel(ventas, columnasExcel, 'Reporte_Ventas');
  };

  return (
    <div className="gestion-ventas">
      <div className="header-ventas">
        <div>
          <h1>Gestión de Ventas</h1>
          <p className="subtitulo">Historial de ventas realizadas.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportar} className="btn-excel">
            📊 Exportar a Excel
          </button>
          <button onClick={() => navigate('/pos')} className="btn-primario">
            + Nueva Venta
          </button>
        </div>
      </div>
      {mensaje.texto && <div className={`alerta ${mensaje.tipo}`}>{mensaje.texto}</div>}
      
      <div className="filtros-ventas">
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Todos los estados</option>
          <option value="completada">Completadas</option>
          <option value="anulada">Anuladas</option>
        </select>

        <input
          type="text"
          placeholder="Buscar por factura o vendedor..."
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
        />

        <input
          type="date"
          value={filtros.fecha_desde}
          onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
        />

        <input
          type="date"
          value={filtros.fecha_hasta}
          onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
        />
      </div>

      <Tabla
        columnas={columnas}
        datos={ventas}
        cargando={cargando}
        sinDatosMensaje="No hay ventas registradas."
        clave="id_venta"
        acciones={(v) => (
          <div className="acciones-tabla">
            <button onClick={() => verFactura(v.id_venta)} className="btn-ver">
              🖨️ Factura
            </button>
            {v.estado === 'completada' && (
              <button onClick={() => handleAnular(v.id_venta)} className="btn-anular">
                Anular
              </button>
            )}
          </div>
        )}
      />

      {/* MODAL DE FACTURA (Único y exclusivo para esto) */}
      {ventaFactura && (
        <FacturaModal 
          venta={ventaFactura} 
          onClose={() => setVentaFactura(null)} 
        />
      )}
    </div>
  );
}