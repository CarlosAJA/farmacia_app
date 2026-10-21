import { useState, useEffect } from 'react';
import axios from 'axios';
import Tabla from './Tabla';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('vendedor');
    const [sucursalId, setSucursalId] = useState('');

    // Estados del listado y control
    const [usuarios, setUsuarios] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [cargando, setCargando] = useState(false);

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
    };

    const headersAuth = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const obtenerUsuarios = async () => {
    try {
        setCargando(true);
        const res = await axios.get('http://localhost:5000/api/usuarios', headersAuth());
        // 👇 Ahora res.data = { ok, data: [...] }
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
        // 👇 Ahora res.data = { ok, data: [...] }
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
            { nombre, email, password, rol, sucursal_id: sucursalId || null },
            headersAuth()
        );
        // 👇 Ahora es res.data.mensaje (ya no necesita .mensaje)
        mostrarMensaje(res.data.mensaje || 'Usuario registrado con éxito.', 'exito');
        setNombre('');
        setEmail('');
        setPassword('');
        setRol('vendedor');
        setSucursalId('');
        obtenerUsuarios();
    } catch (err) {
        // 👇 Ahora los errores vienen en err.response.data.error (mismo nombre)
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

    // Columnas de la tabla
    const columnas = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        {
            key: 'rol',
            label: 'Rol',
            render: (u) => <span className={`badge rol-${u.rol}`}>{u.rol || '—'}</span>,
        },
        {
            key: 'sucursal_nombre',
            label: 'Sucursal',
            render: (u) =>
                u.sucursal_nombre ? (
                    <span>
                        <strong>{u.sucursal_codigo}</strong> — {u.sucursal_nombre}
                    </span>
                ) : (
                    <span className="txt-sin-sucursal">Sin asignar</span>
                ),
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

            {/* FORMULARIO */}
            <div className="form-usuario">
                <h3>Registrar Nuevo Empleado</h3>
                <form onSubmit={handleAlta}>
                    <div className="form-grid">
                        <div>
                            <label>Nombre Completo</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                placeholder="Ej. Carlos Mendoza"
                            />
                        </div>

                        <div>
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="carlos@farmacia.com"
                            />
                        </div>

                        <div>
                            <label>Contraseña Inicial</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label>Rol del Empleado</label>
                            <select value={rol} onChange={(e) => setRol(e.target.value)}>
                                <option value="vendedor">Cajero (Punto de Venta)</option>
                                <option value="farmaceutico">Farmacéutico (Inventario)</option>
                                <option value="almacenero">Almacenero</option>
                                <option value="admin">Administrador (Control Total)</option>
                            </select>
                        </div>

                        <div>
                            <label>Sucursal Asignada</label>
                            <select
                                value={sucursalId}
                                onChange={(e) => setSucursalId(e.target.value)}
                            >
                                <option value="">— Sin asignar —</option>
                                {sucursales
                                    .filter((s) => s.estado === 'ACTIVA')
                                    .map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.codigo} — {s.nombre}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-botones">
                        <button type="submit" className="btn-primario" disabled={cargando}>
                            {cargando ? 'Guardando...' : 'Dar de Alta Empleado'}
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLA */}
            <h3 className="titulo-tabla">Lista de Personal</h3>
            <Tabla
                columnas={columnas}
                datos={usuarios}
                cargando={cargando}
                sinDatosMensaje="No hay usuarios registrados."
                clave="id_usuario"
                busquedaActiva={true}
                camposBusqueda={['nombre', 'email']}
                filtros={[
                    {
                        key: 'rol',
                        label: 'Todos los roles',
                        opciones: [
                            { value: 'admin', label: 'Admin' },
                            { value: 'vendedor', label: 'Vendedor' },
                            { value: 'farmaceutico', label: 'Farmacéutico' },
                            { value: 'almacenero', label: 'Almacenero' },
                        ],
                    },
                    {
                        key: 'estado',
                        label: 'Todos los estados',
                        opciones: [
                            { value: 'activo', label: 'Activos' },
                            { value: 'inactivo', label: 'Inactivos' },
                        ],
                    },
                ]}
                paginacionActiva={true}
                porPaginaInicial={10}
                acciones={(u) =>
                    u.estado === 'activo' ? (
                        <button
                            onClick={() => handleBaja(u.id_usuario, u.nombre)}
                            className="btn-baja"
                        >
                            Dar Baja
                        </button>
                    ) : (
                        <span className="txt-baja">Inhabilitado</span>
                    )
                }
            />
        </div>
    );
};

export default GestionUsuarios;

