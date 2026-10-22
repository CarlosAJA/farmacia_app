import { useEffect, useState } from 'react';
import Tabla from './Tabla';
import { inventarioApi } from '../api/inventario';
import { catalogosApi } from '../api/compras';
import { exportarAExcel } from '../utils/excelUtils';
import './GestionMovimientos.css';

export default function GestionMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    id_almacen: '',
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await inventarioApi.listarMovimientos(filtros);
      setMovimientos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    catalogosApi.almacenes().then(setAlmacenes).catch(console.error);
  }, []);

  useEffect(() => {
    cargar();
  }, [filtros]);

  const badgeTipo = (tipo) => {
    const clases = {
      entrada: 'badge-entrada',
      salida: 'badge-salida',
      ajuste: 'badge-ajuste',
    };
    return <span className={`badge-mov ${clases[tipo]}`}>{tipo.toUpperCase()}</span>;
  };

  const columnas = [
    {
      key: 'fecha_movimiento',
      label: 'Fecha / Hora',
      render: (m) => new Date(m.fecha_movimiento).toLocaleString('es-BO'),
    },
    { key: 'usuario_nombre', label: 'Usuario' },
    { key: 'codigo', label: 'Código' },
    { key: 'producto_nombre', label: 'Producto' },
    { key: 'almacen_nombre', label: 'Almacén' },
    {
      key: 'tipo_movimiento',
      label: 'Tipo',
      render: (m) => badgeTipo(m.tipo_movimiento),
    },
    { key: 'cantidad', label: 'Cant.', render: (m) => <strong>{m.cantidad}</strong> },
    { key: 'motivo', label: 'Motivo' },
  ];
const handleExportar = () => {
    const columnasExcel = [
      { key: 'fecha_movimiento', label: 'Fecha', exportValue: (m) => new Date(m.fecha_movimiento).toLocaleString('es-BO') },
      { key: 'tipo_movimiento', label: 'Tipo' },
      { key: 'codigo', label: 'Código' },
      { key: 'producto_nombre', label: 'Producto' },
      { key: 'almacen_nombre', label: 'Almacén' },
      { key: 'cantidad', label: 'Cantidad', exportValue: (m) => Number(m.cantidad) },
      { key: 'usuario_nombre', label: 'Usuario' },
      { key: 'motivo', label: 'Motivo' },
    ];
    exportarAExcel(movimientos, columnasExcel, 'Reporte_Movimientos');
  };
  return (
    <div className="gestion-movimientos">
      <h1>Auditoría de Inventario (Kardex)</h1>
      <p className="subtitulo">Historial detallado de entradas, salidas y traspasos.</p>

      <div className="filtros-movimientos">
        <select value={filtros.tipo_movimiento} onChange={(e) => setFiltros({ ...filtros, tipo_movimiento: e.target.value })}>
          <option value="">Todos los movimientos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>

        <select value={filtros.id_almacen} onChange={(e) => setFiltros({ ...filtros, id_almacen: e.target.value })}>
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => (
            <option key={a.id_almacen} value={a.id_almacen}>{a.nombre}</option>
          ))}
        </select>
        <button onClick={handleExportar} className="btn-excel">
              📊 Exportar a Excel
            </button>
      </div>

      <Tabla
        columnas={columnas}
        datos={movimientos}
        cargando={cargando}
        sinDatosMensaje="No hay movimientos registrados."
        clave="id_movimiento"
      />
    </div>
  );
}