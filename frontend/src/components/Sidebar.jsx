import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Si por alguna razón no hay usuario, no mostramos el menú
    if (!user) return null;

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>💊 FarmaApp</h3>
                <div className="user-badge">
                    <span className="user-name">{user.nombre}</span>
                    <span className="user-rol">{user.rol}</span>
                </div>
            </div>

            <nav className="sidebar-menu">
                {/* 🛒 VISTAS COMUNES / VENDEDOR */}
                <p className="menu-section-title">Operaciones</p>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                    📊 Panel Principal
                </NavLink>
                <NavLink to="/ventas" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                    🛒 Nueva Venta
                </NavLink>
                <NavLink to="/inventario" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                    📦 Ver Inventario
                </NavLink>

                {/* ⚙️ VISTAS EXCLUSIVAS DEL ADMINISTRADOR */}
                {user.rol === 'Administrador' && (
                    <>
                        <p className="menu-section-title">Administración</p>
                        <NavLink to="/compras" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                            📥 Registrar Compra
                        </NavLink>
                        <NavLink to="/usuarios" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                            👥 Gestión de Usuarios
                        </NavLink>
                        <NavLink to="/reportes" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                            📈 Reportes y Gráficos
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button">
                    🚪 Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Sidebar;