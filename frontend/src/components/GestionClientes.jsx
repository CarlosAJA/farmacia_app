import { useEffect, useState } from 'react';
import Tabla from './Tabla';
import { clientesApi } from '../api/clientes';
import { exportarAExcel } from '../utils/excelUtils'; // 👈 Importamos la utilidad
import './GestionClientes.css';

export default function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para el historial
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const data = await clientesApi.listar({ busqueda });
      setClientes(data);
    } catch (err) {
      console.error('Error al cargar clientes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [busqueda]);

  const verHistorial = async (cliente) => {
    setClienteSeleccionado(cliente);
    setCargandoHistorial(true);
    try {
      const data = await clientesApi.historial(cliente.id_cliente);
      setHistorial(data);
    } catch (err) {
      alert('Error al cargar el historial');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleImprimirPDF = () => {
    window.print();
  };

  const handleExportarExcel = () => {
    if (historial.length === 0) return alert('No hay historial para exportar');

    // Aplanamos los datos (una fila por medicamento comprado)
    const datosAplanados = [];
    historial.forEach((venta) => {
      venta.detalles.forEach((det) => {
        datosAplanados.push({
          Factura: venta.numero_factura,
          Fecha: new Date(venta.fecha_venta).toLocaleString('es-BO'),
          Medicamento: det.producto_nombre,
          Cantidad: Number(det.cantidad),
          'Precio Unitario (Bs.)': Number(det.precio_unitario),
          'Subtotal (Bs.)': Number(det.subtotal),
          'Total Factura (Bs.)': Number(venta.total),
        });
      });
    });

    const columnasExcel = [
      { key: 'Factura', label: 'Nº Factura' },
      { key: 'Fecha', label: 'Fecha' },
      { key: 'Medicamento', label: 'Medicamento' },
      { key: 'Cantidad', label: 'Cantidad' },
      { key: 'Precio Unitario (Bs.)', label: 'Precio Unitario (Bs.)' },
      { key: 'Subtotal (Bs.)', label: 'Subtotal (Bs.)' },
      { key: 'Total Factura (Bs.)', label: 'Total Factura (Bs.)' },
    ];

    exportarAExcel(datosAplanados, columnasExcel, `Historial_${clienteSeleccionado.razon_social}`);
  };

  const columnas = [
    { key: 'nit_ci', label: 'NIT/CI' },
    { key: 'razon_social', label: 'Razón Social', render: (c) => c.nit_ci === '0' ? 'Consumidor Final' : c.razon_social },
    { key: 'celular', label: 'Celular', render: (c) => c.celular || '—' },
    { key: 'email', label: 'Correo', render: (c) => c.email || '—' },
    {
      key: 'fecha_registro',
      label: 'Registro',
      render: (c) => new Date(c.fecha_registro).toLocaleDateString('es-BO'),
    },
  ];

  return (
    <div className="gestion-clientes">
      <div className="header-clientes">
        <div>
          <h1>Directorio de Clientes</h1>
          <p className="subtitulo">Consulta los datos de los clientes y su historial de compras.</p>
        </div>
      </div>

      <div className="filtros-clientes">
        <input
          type="text"
          placeholder="Buscar por NIT/CI o Razón Social..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <Tabla
        columnas={columnas}
        datos={clientes}
        cargando={cargando}
        sinDatosMensaje="No hay clientes registrados."
        clave="id_cliente"
        acciones={(c) => (
          <button onClick={() => verHistorial(c)} className="btn-ver">
            📋 Ver Historial
          </button>
        )}
      />

      {/* MODAL DE HISTORIAL */}
      {clienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setClienteSeleccionado(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header-historial">
              <div>
                <h3>Historial de Compras</h3>
                <p><strong>Cliente:</strong> {clienteSeleccionado.razon_social}</p>
                <p><strong>NIT/CI:</strong> {clienteSeleccionado.nit_ci}</p>
              </div>
              
              {/* BOTONES DE EXPORTACIÓN Y CERRAR */}
              <div className="botones-acciones no-print">
                <button onClick={handleExportarExcel} className="btn-excel-historial">
                  📊 Excel
                </button>
                <button onClick={handleImprimirPDF} className="btn-pdf-historial">
                  🖨️ PDF
                </button>
                <button onClick={() => setClienteSeleccionado(null)} className="btn-cerrar-modal">
                  ✖
                </button>
              </div>
            </div>

            {cargandoHistorial ? (
              <p className="cargando">Cargando historial...</p>
            ) : historial.length === 0 ? (
              <p className="sin-datos">Este cliente aún no tiene compras registradas.</p>
            ) : (
              <div className="lista-historial">
                {historial.map((venta) => (
                  <div key={venta.id_venta} className="card-venta-historial">
                    <div className="venta-header">
                      <span><strong>Factura:</strong> {venta.numero_factura}</span>
                      <span><strong>Fecha:</strong> {new Date(venta.fecha_venta).toLocaleString('es-BO')}</span>
                      <span><strong>Total:</strong> Bs. {Number(venta.total).toFixed(2)}</span>
                    </div>
                    <table className="tabla-detalle-historial">
                      <thead>
                        <tr>
                          <th>Cant.</th>
                          <th>Medicamento</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venta.detalles.map((d, i) => (
                          <tr key={i}>
                            <td>{d.cantidad}</td>
                            <td>{d.producto_nombre}</td>
                            <td>Bs. {Number(d.precio_unitario).toFixed(2)}</td>
                            <td>Bs. {Number(d.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}