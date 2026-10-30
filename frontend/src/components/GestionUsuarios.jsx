import { useState, useEffect } from 'react';
import axios from 'axios';
import Tabla from './Tabla';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
    // Estados del formulario (con los nuevos campos)
    const [nombre, setNombre] = useState('');
    const [ci, setCi] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [emailPersonal, setEmailPersonal] = useState('');
    const [rol, setRol] = useState('vendedor');
    const [sucursalId, setSucursalId] = useState('');

    // Estados del listado
    const [usuarios, setUsuarios] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [cargando, setCargando] = useState(false);

    // Estados para el Modal de Editar
    const [modalEditar, setModalEditar] = useState(false);
    const [editForm, setEditForm] = useState({});

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
    };

    const headersAuth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const obtenerUsuarios = async () => {
        try {
            setCargando(true);
            const res = await axios.get('http://localhost:5000/api/usuarios', headersAuth());
            setUsuarios(res.data.data || []);
        } catch (err) {
            mostrarMensaje('Error al cargar la lista de usuarios.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const obtenerSucursales = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/sucursales', headersAuth());
            setSucursales(res.data.data || []);
        } catch (err) {
            console.error('Error al cargar sucursales:', err);
        }
    };

    useEffect(() => {
        obtenerUsuarios();
        obtenerSucursales();
    }, []);

    const handleAlta = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const res = await axios.post(
                'http://localhost:5000/api/usuarios/registro',
                { 
                    nombre_completo: nombre, 
                    ci, 
                    direccion, 
                    telefono, 
                    email_personal: emailPersonal, 
                    rol, 
                    sucursal_id: sucursalId || null 
                },
                headersAuth()
            );
            
            // Mostramos las credenciales generadas
            alert(`✅ Empleado registrado.\n\nCredenciales de acceso:\nUsuario: ${res.data.credenciales.email}\nContraseña: ${res.data.credenciales.password}`);
            mostrarMensaje('Empleado registrado exitosamente.', 'exito');
            
            setNombre(''); setCi(''); setDireccion(''); setTelefono(''); setEmailPersonal(''); setRol('vendedor'); setSucursalId('');
            obtenerUsuarios();
        } catch (err) {
            mostrarMensaje(err.response?.data?.error || 'No se pudo registrar al usuario.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const handleBaja = async (id, nombreUsuario) => {
        if (!window.confirm(`¿Estás seguro de que deseas dar de baja a ${nombreUsuario}?`)) return;
        try {
            const res = await axios.put(
                `http://localhost:5000/api/usuarios/baja/${id}`,
                {},
                headersAuth()
            );
            mostrarMensaje(res.data.mensaje || 'Usuario dado de baja.', 'exito');
            obtenerUsuarios();
        } catch (err) {
            mostrarMensaje(err.response?.data?.error || 'Error al procesar la baja.', 'error');
        }
    };
    const abrirEditar = (usuario) => {
        setEditForm({
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            ci: usuario.ci || '',
            direccion: usuario.direccion || '',
            telefono: usuario.telefono || '',
            email_personal: usuario.email_personal || '',
            sucursal_id: usuario.sucursal_id || '',
            rol: usuario.rol,
            estado: usuario.estado
        });
        setModalEditar(true);
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:5000/api/usuarios/${editForm.id_usuario}`, editForm, headersAuth());
            mostrarMensaje(res.data.mensaje, 'exito');
            setModalEditar(false);
            obtenerUsuarios();
        } catch (err) {
            mostrarMensaje(err.response?.data?.error || 'Error al actualizar', 'error');
        }
    };

    const resetPassword = async (id, nombre) => {
        if (!window.confirm(`¿Resetear la contraseña de ${nombre}? Se establecerá su nombre de usuario como contraseña.`)) return;
        try {
            const res = await axios.put(`http://localhost:5000/api/usuarios/${id}/reset-password`, {}, headersAuth());
            alert(`✅ ${res.data.mensaje}\n\nLa nueva contraseña es: ${res.data.nuevaPassword}`);
            mostrarMensaje('Contraseña reseteada con éxito.', 'exito');
        } catch (err) {
            mostrarMensaje(err.response?.data?.error || 'Error al resetear contraseña', 'error');
        }
    };


    // Columnas de la tabla
    const columnas = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        {
            key: 'rol',
            label: 'Rol',
            render: (u) => <span className={`badge rol-${u.rol}`}>{u.rol}</span>,
        },
        {
            key: 'sucursal_nombre',
            label: 'Sucursal',
            render: (u) => u.sucursal_nombre || <span className="txt-sin-sucursal">Sin asignar</span>,
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (u) => <span className={`badge estado-${u.estado}`}>{u.estado}</span>,
        },
    ];

    return (
        <div className="gestion-usuarios">
            <h1>Control del Personal de Farmacia</h1>
            <p className="subtitle">
                Sección exclusiva para la administración de altas, bajas y asignación de roles.
            </p>

            {mensaje.texto && (
                <div className={`alerta-msg ${mensaje.tipo}`}>{mensaje.texto}</div>
            )}

            {/* FORMULARIO DE ALTA */}
            <div className="form-usuario">
                <h3>Registrar Nuevo Empleado</h3>
                <form onSubmit={handleAlta}>
                    <div className="form-grid">
                        <div>
                            <label>Nombre Completo *</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Carlos Justiniano" />
                        </div>
                        <div>
                            <label>C.I. *</label>
                            <input type="text" value={ci} onChange={(e) => setCi(e.target.value)} required placeholder="Ej. 12345678" />
                        </div>
                        <div>
                            <label>Domicilio</label>
                            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Av. Alemana #123" />
                        </div>
                        <div>
                            <label>Celular</label>
                            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 70012345" />
                        </div>
                        <div>
                            <label>Correo Personal</label>
                            <input type="email" value={emailPersonal} onChange={(e) => setEmailPersonal(e.target.value)} placeholder="Ej. carlos@gmail.com" />
                        </div>
                        <div>
                            <label>Rol del Empleado</label>
                            <select value={rol} onChange={(e) => setRol(e.target.value)}>
                                <option value="vendedor">Vendedor (POS)</option>
                                <option value="farmaceutico">Farmacéutico (POS, Inv)</option>
                                <option value="almacenero">Almacenero (Inventario)</option>
                                <option value="admin">Administrador (Total)</option>
                            </select>
                        </div>
                        <div>
                            <label>Sucursal Asignada</label>
                            <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                                <option value="">— Sin asignar —</option>
                                {sucursales.filter(s => s.estado === 'ACTIVA').map(s => (
                                    <option key={s.id} value={s.id}>{s.codigo} — {s.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-botones">
                        <button type="submit" className="btn-primario" disabled={cargando}>
                            {cargando ? 'Guardando...' : 'Registrar Empleado'}
                        </button>
                    </div>
                </form>
            </div>

                        {/* MODAL DE EDITAR USUARIO */}
            {modalEditar && (
                <div className="modal-overlay" onClick={() => setModalEditar(false)}>
                    <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                        <h3>Editar Empleado</h3>
                        <form onSubmit={guardarEdicion} className="form-grid" style={{ marginTop: '20px' }}>
                            <div>
                                <label>Nombre Completo</label>
                                <input type="text" value={editForm.nombre} onChange={(e) => setEditForm({...editForm, nombre: e.target.value})} required />
                            </div>
                            <div>
                                <label>C.I.</label>
                                <input type="text" value={editForm.ci} onChange={(e) => setEditForm({...editForm, ci: e.target.value})} />
                            </div>
                            <div>
                                <label>Domicilio</label>
                                <input type="text" value={editForm.direccion} onChange={(e) => setEditForm({...editForm, direccion: e.target.value})} />
                            </div>
                            <div>
                                <label>Celular</label>
                                <input type="text" value={editForm.telefono} onChange={(e) => setEditForm({...editForm, telefono: e.target.value})} />
                            </div>
                            <div>
                                <label>Correo Personal</label>
                                <input type="email" value={editForm.email_personal} onChange={(e) => setEditForm({...editForm, email_personal: e.target.value})} />
                            </div>
                            <div>
                                <label>Rol</label>
                                <select value={editForm.rol} onChange={(e) => setEditForm({...editForm, rol: e.target.value})}>
                                    <option value="vendedor">Vendedor (POS)</option>
                                    <option value="farmaceutico">Farmacéutico (POS, Inv)</option>
                                    <option value="almacenero">Almacenero (Inventario)</option>
                                    <option value="admin">Administrador (Total)</option>
                                </select>
                            </div>
                            <div>
                                <label>Sucursal</label>
                                <select value={editForm.sucursal_id} onChange={(e) => setEditForm({...editForm, sucursal_id: e.target.value})}>
                                    <option value="">— Sin asignar —</option>
                                    {sucursales.filter(s => s.estado === 'ACTIVA').map(s => (
                                        <option key={s.id} value={s.id}>{s.codigo} — {s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Estado</label>
                                <select value={editForm.estado} onChange={(e) => setEditForm({...editForm, estado: e.target.value})}>
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button type="button" onClick={() => setModalEditar(false)} className="btn-secundario">Cancelar</button>
                                <button type="submit" className="btn-primario">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TABLA DE USUARIOS */}
            <h2 className="titulo-tabla">Lista de Personal</h2>
            <Tabla
                columnas={columnas}
                datos={usuarios}
                cargando={cargando}
                sinDatosMensaje="No hay usuarios registrados."
                clave="id_usuario"
                                acciones={(u) => (
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => abrirEditar(u)} className="btn-editar" title="Editar datos">
                            ✏️ Editar
                        </button>
                        <button onClick={() => resetPassword(u.id_usuario, u.nombre)} className="btn-clave" title="Resetear contraseña">
                            🔑 Clave
                        </button>
                        {u.estado === 'activo' ? (
                            <button onClick={() => handleBaja(u.id_usuario, u.nombre)} className="btn-baja">
                                Dar Baja
                            </button>
                        ) : (
                            <span className="txt-baja">Inhabilitado</span>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default GestionUsuarios;