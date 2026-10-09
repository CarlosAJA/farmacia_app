// frontend/src/components/Tabla.jsx
import { useState, useMemo } from 'react';
import './Tabla.css';

const OPCIONES_POR_PAGINA = [10, 25, 50, 100];

const Tabla = ({
  columnas = [],
  datos = [],
  acciones = null,
  cargando = false,
  sinDatosMensaje = 'No hay datos disponibles.',
  clave = 'id',
  // Filtros
  busquedaActiva = false,
  camposBusqueda = [],
  filtros = [],   // [{ key, label, opciones: [{value, label}] }]
  // Paginación
  paginacionActiva = false,
  porPaginaInicial = 10,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtrosActivos, setFiltrosActivos] = useState({});
  const [porPagina, setPorPagina] = useState(porPaginaInicial);
  const [paginaActual, setPaginaActual] = useState(1);

  // 1. Aplicar filtros y búsqueda
  const datosFiltrados = useMemo(() => {
    if (!Array.isArray(datos)) return [];

    return datos.filter((fila) => {
      // Búsqueda por texto
      if (busquedaActiva && busqueda.trim()) {
        const termino = busqueda.toLowerCase().trim();
        const coincide = camposBusqueda.some((campo) => {
          const valor = fila[campo];
          return valor != null && String(valor).toLowerCase().includes(termino);
        });
        if (!coincide) return false;
      }

      // Filtros tipo select
      for (const filtro of filtros) {
        const valorSeleccionado = filtrosActivos[filtro.key];
        if (valorSeleccionado && String(fila[filtro.key]) !== String(valorSeleccionado)) {
          return false;
        }
      }

      return true;
    });
  }, [datos, busqueda, filtrosActivos, busquedaActiva, camposBusqueda, filtros]);

  // 2. Aplicar paginación sobre los datos ya filtrados
  const totalPaginas = paginacionActiva
    ? Math.max(1, Math.ceil(datosFiltrados.length / porPagina))
    : 1;

  // Si estamos en una página que ya no existe (por filtros), volvemos a la 1
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const datosPaginados = useMemo(() => {
    if (!paginacionActiva) return datosFiltrados;
    const inicio = (paginaSegura - 1) * porPagina;
    return datosFiltrados.slice(inicio, inicio + porPagina);
  }, [datosFiltrados, paginaSegura, porPagina, paginacionActiva]);

  // Resetear a página 1 cuando cambian los filtros o la búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const handleFiltroChange = (key, valor) => {
    setFiltrosActivos((prev) => ({ ...prev, [key]: valor }));
    setPaginaActual(1);
  };

  const handlePorPaginaChange = (e) => {
    setPorPagina(Number(e.target.value));
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltrosActivos({});
    setPaginaActual(1);
  };

  const hayFiltrosActivos =
    busqueda.trim() !== '' || Object.values(filtrosActivos).some((v) => v);

  // Estados de carga
  if (cargando) {
    return <p className="tabla-cargando">Cargando...</p>;
  }

  return (
    <div className="tabla-wrapper">
      {/* Barra de filtros */}
      {(busquedaActiva || filtros.length > 0) && (
        <div className="tabla-filtros">
          {busquedaActiva && (
            <input
              type="text"
              className="filtro-busqueda"
              placeholder="🔍 Buscar..."
              value={busqueda}
              onChange={handleBusquedaChange}
            />
          )}

          {filtros.map((filtro) => (
            <select
              key={filtro.key}
              className="filtro-select"
              value={filtrosActivos[filtro.key] || ''}
              onChange={(e) => handleFiltroChange(filtro.key, e.target.value)}
            >
              <option value="">{filtro.label}</option>
              {filtro.opciones.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          ))}

          {hayFiltrosActivos && (
            <button type="button" className="btn-limpiar-filtros" onClick={limpiarFiltros}>
              ✕ Limpiar
            </button>
          )}

          <span className="filtro-contador">
            {datosFiltrados.length} de {datos.length}
          </span>
        </div>
      )}

      {/* Tabla o mensaje de vacío */}
      {datosFiltrados.length === 0 ? (
        <p className="tabla-sin-datos">
          {datos.length === 0
            ? sinDatosMensaje
            : 'No hay resultados que coincidan con los filtros.'}
        </p>
      ) : (
        <>
          <div className="tabla-scroll">
            <table className="tabla-generica">
              <thead>
                <tr>
                  {columnas.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  {acciones && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {datosPaginados.map((fila) => (
                  <tr key={fila[clave]}>
                    {columnas.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(fila) : fila[col.key]}
                      </td>
                    ))}
                    {acciones && <td>{acciones(fila)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          {paginacionActiva && (
            <div className="tabla-paginacion">
              <div className="paginacion-izquierda">
                <label>Mostrar:</label>
                <select
                  value={porPagina}
                  onChange={handlePorPaginaChange}
                  className="paginacion-por-pagina"
                >
                  {OPCIONES_POR_PAGINA.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="paginacion-registros">
                  registros por página
                </span>
              </div>

              <div className="paginacion-derecha">
                <button
                  type="button"
                  className="btn-pagina"
                  disabled={paginaSegura <= 1}
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                >
                  ◀ Anterior
                </button>

                <span className="paginacion-info">
                  Página {paginaSegura} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="btn-pagina"
                  disabled={paginaSegura >= totalPaginas}
                  onClick={() =>
                    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                  }
                >
                  Siguiente ▶
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tabla;