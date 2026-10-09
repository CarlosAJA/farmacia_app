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

    if (!user) return null;

    const esAdmin = user.rol?.toLowerCase() === 'administrador' || user.rol?.toLowerCase() === 'admin';

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>💊 FarmaApp</h3>
                <div className="user-badge">
                    <span className="user-name">{user.nombre}</span>
                    <span className="user-rol">{user.rol}</span>
                </div>
            </div>

            {/* 🛒 VISTAS COMUNES / VENDEDOR */}
            <nav className="sidebar-menu">
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
            </nav>

            {/* ⚙️ VISTAS EXCLUSIVAS DEL ADMINISTRADOR */}
            {esAdmin && (
                <nav className="sidebar-menu">
                    <p className="menu-section-title">Administración</p>
                    <NavLink to="/compras" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                        📥 Registrar Compra
                    </NavLink>
                    <NavLink to="/sucursales" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                        🏢 Gestión de Sucursales
                    </NavLink>
                    <NavLink to="/productos" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                        💊 Productos
                    </NavLink>
                    <NavLink to="/usuarios" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                        👥 Gestión de Usuarios
                    </NavLink>
                    <NavLink to="/reportes" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                        📈 Reportes y Gráficos
                    </NavLink>
                </nav>
            )}

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button">
                    🚪 Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Sidebar;