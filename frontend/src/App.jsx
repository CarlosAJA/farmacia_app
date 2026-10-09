import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import DashboardFarmacia from './components/DashboardFarmacia';
import GestionUsuarios from './components/GestionUsuarios';
import GestionSucursales from './components/GestionSucursales';   // 👈 NUEVO
import GestionProductos from './components/GestionProductos';
import RutaProtegida from './RutaProtegida';

import './App.css';

// Componente Layout oficial para React Router v7 usando Outlet
function LayoutConMenu() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main-content">
                {/* El Outlet le indica a React Router exactamente dónde inyectar la sub-ruta activa */}
                <Outlet />
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* 1. Redirección de raíz al Login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
                    {/* 2. Ruta pública del Formulario de Login */}
                    <Route path="/login" element={<Login />} />

                    {/* 3. GRUPO DE RUTAS PROTEGIDAS CON LAYOUT ANIDADO */}
                    <Route element={
                        <RutaProtegida>
                            <LayoutConMenu />
                        </RutaProtegida>
                    }>
                        {/* Se renderiza en el Outlet al entrar a /dashboard */}
                        <Route path="/dashboard" element={<DashboardFarmacia />} />
                        
                        {/* Se renderiza en el Outlet al entrar a /usuarios (Filtro por Rol) */}
                        <Route path="/usuarios" element={
                            <RutaProtegida rolesPermitidos={['Administrador', 'admin']}>
                                <GestionUsuarios />
                            </RutaProtegida>
                        } />

                         {/* ✨ NUEVO: Ruta de sucursales */}
                        <Route path="/sucursales" element={
                            <RutaProtegida rolesPermitidos={['Administrador', 'admin']}>
                                <GestionSucursales />
                            </RutaProtegida>
                        } />
                        <Route path="/productos" element={
                            <RutaProtegida rolesPermitidos={['Administrador', 'admin']}>
                                <GestionProductos />
                            </RutaProtegida>
                        } />
                    </Route>

                    {/* 4. Ruta comodín por si escriben cualquier otra cosa */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;