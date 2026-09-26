import { useState, useEffect } from 'react';
import axios from 'axios';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
    // Estados para el formulario de Alta
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('Cajero');

    // Estados para el listado y control
    const [usuarios, setUsuarios] = useState([]);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [cargando, setCargando] = useState(false);

    // Cargar usuarios desde el servidor
    const obtenerUsuarios = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/usuarios');
            setUsuarios(res.data);
        } catch (err) {
            mostrarMensaje('Error al cargar la lista de usuarios.', 'error');
        }
    };

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
    };

    // Función para el Alta
    const handleAlta = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const res = await axios.post('http://localhost:5000/api/usuarios/registro', {
                nombre,
                email,
                password,
                rol
            });
            mostrarMensaje(res.data.mensaje || 'Usuario registrado con éxito.', 'exito');
            setNombre('');
            setEmail('');
            setPassword('');
            setRol('Cajero');
            obtenerUsuarios();
        } catch (err) {
            mostrarMensaje(err.response?.data?.error || 'No se pudo registrar al usuario.', 'error');
        } finally {
            setCargando(false);
        }
    };

    // Función para la Baja
    const handleBaja = async (id, nombreUsuario) => {
        if (!window.confirm(`¿Estás seguro de que deseas dar de baja a ${nombreUsuario}?`)) return;
        try {
            const res = await axios.put(`http://localhost:5000/api/usuarios/baja/${id}`);
            mostrarMensaje(res.data.mensaje || 'Usuario dado de baja.', 'exito');
            obtenerUsuarios();
        } catch (err) {
            mostrarMensaje(err.response?.data?.error || 'Error al procesar la baja.', 'error');
        }
    };

    return (
        <div className="gestion-container">
            <h1>Control del Personal de Farmacia</h1>
            <p className="subtitle">Sección exclusiva para la administración de altas, bajas y asignación de roles.</p>

            {mensaje.texto && (
                <div className={`alerta-msg ${mensaje.tipo}`}>{mensaje.texto}</div>
            )}

            <div className="gestion-grid">
                {/* FORMULARIO DE ALTA */}
                <div className="gestion-card form-section">
                    <h2>Registrar Nuevo Empleado</h2>
                    <form onSubmit={handleAlta} className="alta-form">
                        <div className="form-group-panel">
                            <label>Nombre Completo</label>
                            <input 
                                type="text" 
                                value={nombre} 
                                onChange={(e) => setNombre(e.target.value)} 
                                required 
                                placeholder="Ej. Carlos Mendoza"
                            />
                        </div>

                        <div className="form-group-panel">
                            <label>Correo Electrónico</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="carlos@farmacia.com"
                            />
                        </div>

                        <div className="form-group-panel">
                            <label>Contraseña Inicial</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="form-group-panel">
                            <label>Rol del Empleado</label>
                            <select value={rol} onChange={(e) => setRol(e.target.value)}>
                                <option value="Cajero">Cajero (Punto de Venta)</option>
                                <option value="Farmacéutico">Farmacéutico (Inventario)</option>
                                <option value="Administrador">Administrador (Control Total)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-alta" disabled={cargando}>
                            {cargando ? 'Guardando...' : 'Dar de Alta Empleado'}
                        </button>
                    </form>
                </div>

                {/* TABLA DE USUARIOS CON TUS COLUMNAS REALES */}
                <div className="gestion-card table-section">
                    <h2>Lista de Personal</h2>
                    <div className="table-responsive">
                        <table className="tabla-usuarios">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((u) => (
                                    <tr key={u.id_usuario} className={u.estado === 'inactivo' ? 'fila-inactiva' : ''}>
                                        <td>{u.nombre}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`badge rol-${u.rol}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge estado-${u.estado}`}>
                                                {u.estado}
                                            </span>
                                        </td>
                                        <td>
                                            {u.estado === 'activo' ? (
                                                <button 
                                                    onClick={() => handleBaja(u.id_usuario, u.nombre)}
                                                    className="btn-baja"
                                                >
                                                    Dar Baja
                                                </button>
                                            ) : (
                                                <span className="txt-baja">Inhabilitado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestionUsuarios;

