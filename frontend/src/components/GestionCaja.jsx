import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { catalogosApi } from '../api/compras';
import { cajasApi } from '../api/cajas';
import './GestionCaja.css';

const BILLETES = [200, 100, 50, 20, 10];
const MONEDAS = [5, 2, 1, 0.5, 0.2, 0.1];

export default function GestionCaja() {
  const { user } = useContext(AuthContext);
  
  const [cargando, setCargando] = useState(true);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [almacenes, setAlmacenes] = useState([]);
  const [error, setError] = useState(null);

  // Estados para Apertura
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState('');
  const [conteoApertura, setConteoApertura] = useState({});

  // Estados para Cierre
  const [conteoCierre, setConteoCierre] = useState({});

  useEffect(() => {
    const iniciar = async () => {
      try {
        const [caja, alms] = await Promise.all([
          cajasApi.verificarCajaActiva(),
          catalogosApi.almacenes()
        ]);
        
        if (caja) {
          setCajaActiva(caja);
          const res = await cajasApi.obtenerResumen(caja.id_sesion);
          setResumen(res);
        } else {
          setAlmacenes(alms);
          // Si es vendedor, preseleccionamos su almacén si lo tiene asignado
          if (user?.rol === 'vendedor' && user.sucursal_id) {
             const miAlmacen = alms.find(a => a.id_sucursal === user.sucursal_id);
             if (miAlmacen) setAlmacenSeleccionado(miAlmacen.id_almacen);
          }
        }
      } catch (err) {
        setError('Error al cargar el estado de la caja');
      } finally {
        setCargando(false);
      }
    };
    iniciar();
  }, [user]);

  // --- CÁLCULOS DE DENOMINACIONES ---
  const calcularTotal = (conteo) => {
    let total = 0;
    BILLETES.forEach(b => total += (conteo[`b${b}`] || 0) * b);
    MONEDAS.forEach(m => total += (conteo[`m${m}`] || 0) * m);
    return total;
  };

  const totalApertura = calcularTotal(conteoApertura);
  const totalCierre = calcularTotal(conteoCierre);
  const diferencia = resumen ? (totalCierre - resumen.total_efectivo_sistema) : 0;

  // --- HANDLERS ---
    const handleAbrir = async () => {
    if (!almacenSeleccionado) {
      return setError('No se ha detectado un almacén. Contacta al administrador.');
    }
    if (totalApertura <= 0) {
      return setError('Debes ingresar al menos un billete o moneda para iniciar el turno.');
    }
    
    try {
      await cajasApi.abrirCaja(Number(almacenSeleccionado), totalApertura);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al abrir caja');
    }
  };

  const handleCerrar = async () => {
    if (!window.confirm('¿Estás seguro de cerrar la caja? No podrás hacer más ventas hasta abrir una nueva.')) return;
    try {
      await cajasApi.cerrarCaja(cajaActiva.id_sesion, totalCierre);
      alert('Caja cerrada con éxito.');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cerrar caja');
    }
  };

    const renderInputs = (lista, prefijo, conteo, setConteo) => {
    return lista.map(val => {
      // Buscamos la imagen según el valor
      const carpeta = prefijo === 'b' ? 'billetes' : 'monedas';
      const nombreArchivo = val % 1 === 0 ? val : val.toFixed(1);
      const imgSrc = `/img/${carpeta}/${nombreArchivo}.png`;

      return (
        <div key={val} className="denominacion-row">
          <div className="denominacion-info">
            {/* 👇 IMAGEN DEL BILLETE/MONEDA 👇 */}
            <img 
              src={imgSrc} 
              alt={`Bs. ${val}`} 
              className="denominacion-img" 
              onError={(e) => e.target.style.display = 'none'} // Si no encuentra la imagen, la oculta
            />
            <span className="denominacion-label">Bs. {val.toFixed(2)}</span>
          </div>
          <input 
            type="number" 
            min="0"
            value={conteo[`${prefijo}${val}`] || ''} 
            onChange={(e) => setConteo({ ...conteo, [`${prefijo}${val}`]: Number(e.target.value) })}
            placeholder="0"
          />
          <span className="denominacion-subtotal">
            Bs. {((conteo[`${prefijo}${val}`] || 0) * val).toFixed(2)}
          </span>
        </div>
      );
    });
  };

  if (cargando) return <div className="caja-loading">Verificando estado de caja...</div>;

  return (
    <div className="gestion-caja">
      <h1>{cajaActiva ? 'Arqueo y Cierre de Caja' : 'Apertura de Caja'}</h1>
      {error && <div className="alerta error">{error}</div>}

      {!cajaActiva ? (
        // ================= VISTA DE APERTURA =================
        <div className="caja-layout">
          <div className="caja-card">
            <h2>Iniciar Turno</h2>
            <p className="subtitulo">Ingresa el monto inicial de cambio en caja.</p>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                Almacén de Operación:
              </label>
              
              {/* 👇 SI ES VENDEDOR, MOSTRAMOS EL DISEÑO BONITO DEL POS 👇 */}
              {user?.rol === 'vendedor' ? (
                <div style={{
                  background: '#eaf4fc',
                  border: '1px solid #bce0fd',
                  padding: '12px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  🏢 {almacenes.find(a => a.id_almacen === Number(almacenSeleccionado))?.nombre || 'Cargando almacén...'}
                </div>
              ) : (
                /* 👇 SI ES ADMIN, MOSTRAMOS EL SELECT NORMAL 👇 */
                <select 
                  value={almacenSeleccionado} 
                  onChange={(e) => setAlmacenSeleccionado(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '15px' }}
                >
                  <option value="">— Selecciona un almacén —</option>
                  {almacenes.map(a => (
                    <option key={a.id_almacen} value={a.id_almacen}>{a.nombre}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="conteo-grid">
              <div>
                <h3>Billetes</h3>
                {renderInputs(BILLETES, 'b', conteoApertura, setConteoApertura)}
              </div>
              <div>
                <h3>Monedas</h3>
                {renderInputs(MONEDAS, 'm', conteoApertura, setConteoApertura)}
              </div>
            </div>

            <div className="caja-total-box">
              <span>TOTAL APERTURA:</span>
              <span>Bs. {totalApertura.toFixed(2)}</span>
            </div>

            <button onClick={handleAbrir} className="btn-primario w-100">Abrir Caja</button>
          </div>
        </div>
      ) : (
        // ================= VISTA DE CIERRE =================
        <div className="caja-layout cierre">
          <div className="caja-card resumen-sistema">
            <h2>Resumen del Sistema</h2>
            <p className="subtitulo">Caja abierta: {new Date(cajaActiva.fecha_apertura).toLocaleString()}</p>
            
            <div className="resumen-linea">
              <span>(+) Apertura / Saldo Inicial:</span>
              <span>Bs. {Number(resumen.monto_apertura).toFixed(2)}</span>
            </div>
            <div className="resumen-linea">
              <span>(+) Ventas Efectivo:</span>
              <span>Bs. {Number(resumen.ventas_efectivo).toFixed(2)}</span>
            </div>
            <div className="resumen-linea">
              <span>(+) Ventas Mixto (Efectivo):</span>
              <span>Bs. {Number(resumen.ventas_mixto_efectivo).toFixed(2)}</span>
            </div>
            <div className="resumen-linea total-sistema">
              <span>EFECTIVO ESPERADO:</span>
              <span>Bs. {Number(resumen.total_efectivo_sistema).toFixed(2)}</span>
            </div>

            <div className="resumen-linea mt-4" style={{ color: '#7f8c8d' }}>
              <span>Ventas Tarjeta:</span>
              <span>Bs. {Number(resumen.ventas_tarjeta).toFixed(2)}</span>
            </div>
            <div className="resumen-linea" style={{ color: '#7f8c8d' }}>
              <span>Ventas QR:</span>
              <span>Bs. {Number(resumen.ventas_qr).toFixed(2)}</span>
            </div>
          </div>

          <div className="caja-card conteo-fisico">
            <h2>Conteo Físico (Arqueo)</h2>
            <p className="subtitulo">Ingresa cuánto dinero real hay en la gaveta.</p>

            <div className="conteo-grid">
              <div>
                <h3>Billetes</h3>
                {renderInputs(BILLETES, 'b', conteoCierre, setConteoCierre)}
              </div>
              <div>
                <h3>Monedas</h3>
                {renderInputs(MONEDAS, 'm', conteoCierre, setConteoCierre)}
              </div>
            </div>

            <div className="caja-total-box">
              <span>TOTAL CONTADO:</span>
              <span>Bs. {totalCierre.toFixed(2)}</span>
            </div>

            <div className={`caja-total-box diferencia ${diferencia === 0 ? 'ok' : diferencia > 0 ? 'sobrante' : 'faltante'}`}>
              <span>{diferencia === 0 ? 'CUADRADO' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'}:</span>
              <span>Bs. {Math.abs(diferencia).toFixed(2)}</span>
            </div>

            <button onClick={handleCerrar} className="btn-primario w-100 btn-peligro">Procesar Cierre</button>
          </div>
        </div>
      )}
    </div>
  );
}