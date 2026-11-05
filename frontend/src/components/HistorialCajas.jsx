import { useEffect, useState } from 'react';
import Tabla from './Tabla';
import { cajasApi } from '../api/cajas';
import { exportarAExcel } from '../utils/excelUtils';
import './HistorialCajas.css';

export default function HistorialCajas() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await cajasApi.listarHistorial(filtros);
      setSesiones(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtros]);

  const badgeDiferencia = (diferencia) => {
    const val = Number(diferencia);
    if (val === 0) return <span className="badge-dif ok">CUADRADO</span>;
    if (val > 0) return <span className="badge-dif sobrante">+ Bs. {val.toFixed(2)}</span>;
    return <span className="badge-dif faltante">Bs. {val.toFixed(2)}</span>;
  };
    const handleExportarExcel = () => {
    const columnasExcel = [
      { key: 'id_sesion', label: 'ID Caja' },
      { 
        key: 'fecha_apertura', 
        label: 'Fecha Apertura', 
        exportValue: (s) => new Date(s.fecha_apertura).toLocaleString('es-BO') 
      },
      { key: 'usuario_nombre', label: 'Cajero' },
      { key: 'almacen_nombre', label: 'Sucursal' },
      { 
        key: 'monto_apertura', 
        label: 'Monto Inicial (Bs.)', 
        exportValue: (s) => Number(s.monto_apertura) 
      },
      { 
        key: 'fecha_cierre', 
        label: 'Fecha Cierre', 
        exportValue: (s) => s.fecha_cierre ? new Date(s.fecha_cierre).toLocaleString('es-BO') : 'En curso'
      },
      { 
        key: 'monto_sistema', 
        label: 'Esperado (Bs.)', 
        exportValue: (s) => s.monto_sistema ? Number(s.monto_sistema) : 0
      },
      { 
        key: 'monto_real', 
        label: 'Contado (Bs.)', 
        exportValue: (s) => s.monto_real !== null ? Number(s.monto_real) : 0
      },
      { 
        key: 'diferencia', 
        label: 'Diferencia (Bs.)', 
        exportValue: (s) => s.diferencia !== null ? Number(s.diferencia) : 0
      },
      { key: 'estado', label: 'Estado' },
    ];
    
    exportarAExcel(sesiones, columnasExcel, 'Reporte_Arqueos_Caja');
  };

  const handleExportarPDF = () => {
    window.print();
  };

  const columnas = [
    { key: 'id_sesion', label: 'ID Caja' },
    { 
      key: 'fecha_apertura', 
      label: 'Apertura',
      render: (s) => new Date(s.fecha_apertura).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
    },
    { key: 'usuario_nombre', label: 'Cajero / Responsable' },
    { key: 'almacen_nombre', label: 'Sucursal / Almacén' },
    { 
      key: 'monto_apertura', 
      label: 'Monto Inicial',
      render: (s) => `Bs. ${Number(s.monto_apertura).toFixed(2)}`
    },
    { 
      key: 'fecha_cierre', 
      label: 'Cierre',
      render: (s) => s.fecha_cierre ? new Date(s.fecha_cierre).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }) : '—'
    },
    { 
      key: 'monto_sistema', 
      label: 'Esperado',
      render: (s) => s.monto_sistema ? `Bs. ${Number(s.monto_sistema).toFixed(2)}` : '—'
    },
    { 
      key: 'monto_real', 
      label: 'Contado',
      render: (s) => s.monto_real !== null ? `Bs. ${Number(s.monto_real).toFixed(2)}` : '—'
    },
    { 
      key: 'diferencia', 
      label: 'Diferencia',
      render: (s) => s.estado === 'abierta' ? <span className="badge-estado abierta">EN CURSO</span> : badgeDiferencia(s.diferencia)
    },
  ];

  return (
    <div className="historial-cajas">
      <div className="header-cajas no-print">
        <div>
          <h1>Historial de Arqueos de Caja</h1>
          <p className="subtitulo">Auditoría de aperturas y cierres de caja por sucursal.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportarExcel} className="btn-excel">
            📊 Exportar a Excel
          </button>
          <button onClick={handleExportarPDF} className="btn-pdf">
            📄 Exportar a PDF
          </button>
        </div>
      </div>

      <div className="filtros-cajas">
        <input
          type="date"
          value={filtros.fecha_desde}
          onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
        />
        <span>hasta</span>
        <input
          type="date"
          value={filtros.fecha_hasta}
          onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
        />
      </div>

      <Tabla
        columnas={columnas}
        datos={sesiones}
        cargando={cargando}
        sinDatosMensaje="No hay arqueos registrados en este período."
        clave="id_sesion"
      />
    </div>
  );
}