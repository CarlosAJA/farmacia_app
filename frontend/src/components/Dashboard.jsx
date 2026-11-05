import { useEffect, useState, useContext } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { reportesApi } from '../api/reportes';
import { AuthContext } from '../AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useContext(AuthContext); // 👈 Obtenemos el usuario logueado
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        // Si es vendedor, filtramos por su sucursal. Si es admin, ve todo.
        const params = user?.rol === 'vendedor' ? { id_sucursal: user.sucursal_id } : {};
        const res = await reportesApi.getDashboard(params);
        setData(res);
      } catch (err) {
        setError('Error al cargar los reportes');
      } finally {
        setCargando(false);
      }
    };
    
    if (user) {
      cargar();
    }
  }, [user]);

  if (cargando) return <div className="dashboard-loading">Cargando dashboard...</div>;
  if (error) return <div className="alerta error">{error}</div>;
  if (!data) return null;

  const { kpis, ventasSemana, topProductos, alertasStock } = data;

  const isVendedor = user?.rol === 'vendedor';

  // Formatear datos para el gráfico de ventas
  const chartData = ventasSemana.map((v) => ({
    fecha: new Date(v.fecha).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' }),
    total: Number(v.total),
  }));

  return (
    <div className="dashboard-container">
      <h1>{isVendedor ? 'Panel de Sucursal' : 'Panel de Control'}</h1>
      <p className="subtitulo">
        {isVendedor 
          ? `Resumen de ventas y stock de tu sucursal` 
          : 'Resumen general de la farmacia'}
      </p>

      {/* TARJETAS KPI */}
            {/* TARJETAS KPI */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-primary">
          <div className="kpi-icon">💰</div>
          <div className="kpi-info">
            <span className="kpi-label">Ventas de Hoy</span>
            <span className="kpi-value">Bs. {Number(kpis.ventas_hoy).toFixed(2)}</span>
          </div>
        </div>

        {/* 👇 ESTA TARJETA SOLO LA VE EL ADMINISTRADOR 👇 */}
        {!isVendedor && (
          <div className="kpi-card kpi-success">
            <div className="kpi-icon">📈</div>
            <div className="kpi-info">
              <span className="kpi-label">Ventas del Mes</span>
              <span className="kpi-value">Bs. {Number(kpis.ventas_mes).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="kpi-card kpi-info-card">
          <div className="kpi-icon">🧾</div>
          <div className="kpi-info">
            <span className="kpi-label">Transacciones Hoy</span>
            <span className="kpi-value">{kpis.transacciones_hoy}</span>
          </div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-info">
            <span className="kpi-label">Stock Crítico</span>
            <span className="kpi-value">{kpis.stock_bajo} productos</span>
          </div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-icon">⏳</div>
          <div className="kpi-info">
            <span className="kpi-label">Por Vencer (30 días)</span>
            <span className="kpi-value">{kpis.por_vencer_30d} productos</span>
          </div>
        </div>
      </div>

      {/* 👇 GRÁFICOS: SOLO EL ADMINISTRADOR LOS VE 👇 */}
      {!isVendedor && (
        <div className="graficos-grid">
          {/* Gráfico de Ventas */}
          <div className="card-grafico">
            <h2>Ventas Últimos 7 Días</h2>
            <div className="grafico-wrapper">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(value) => `Bs. ${value.toFixed(2)}`} />
                    <Line type="monotone" dataKey="total" stroke="#3498db" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="sin-datos">No hay ventas registradas en los últimos 7 días.</p>
              )}
            </div>
          </div>

          {/* Top Productos */}
          <div className="card-grafico">
            <h2>Top 5 Productos Más Vendidos</h2>
            <div className="grafico-wrapper">
              {topProductos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductos} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={100} />
                    <RechartsTooltip formatter={(value) => `${value} unidades`} />
                    <Bar dataKey="cantidad_vendida" fill="#27ae60" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="sin-datos">No hay productos vendidos aún.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABLA DE ALERTAS: SIEMPRE VISIBLE (Para el vendedor, solo de su sucursal) */}
      <div className="card-alertas">
        <h2>⚠️ Alertas de Stock Crítico {isVendedor ? 'de tu Sucursal' : ''}</h2>
        {alertasStock.length === 0 ? (
          <p className="sin-datos">Todo el stock está en niveles óptimos.</p>
        ) : (
          <table className="tabla-alertas">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Almacén</th>
                <th>Stock Actual</th>
                <th>Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {alertasStock.map((a, i) => (
                <tr key={i}>
                  <td>{a.codigo}</td>
                  <td>{a.nombre}</td>
                  <td>{a.almacen}</td>
                  <td className="text-danger">{a.stock_actual}</td>
                  <td>{a.stock_minimo}</td>
                  <td><span className="badge-alerta">REPONER</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}