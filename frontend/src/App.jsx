import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import GestionUsuarios from './components/GestionUsuarios';
import GestionSucursales from './components/GestionSucursales';
import GestionProductos from './components/GestionProductos';
import GestionInventario from './components/GestionInventario';
import RegistrarCompra from './components/RegistrarCompra';
import GestionCompras from './components/GestionCompras';
import PuntoVenta from './components/PuntoVenta';
import GestionVentas from './components/GestionVentas';
import Dashboard from './components/Dashboard';
import RutaProtegida from './RutaProtegida';
import './App.css';

function LayoutConMenu() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main-content">
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
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        <Route path="/usuarios" element={
                            <RutaProtegida rolesPermitidos={['Administrador', 'admin']}>
                                <GestionUsuarios />
                            </RutaProtegida>
                        } />
                        
                        <Route path="/pos" element={
                            <RutaProtegida rolesPermitidos={['admin', 'vendedor']}>
                                <PuntoVenta />
                            </RutaProtegida>
                        } />

                        <Route path="/ventas" element={
                            <RutaProtegida rolesPermitidos={['admin', 'vendedor']}>
                                <GestionVentas />
                            </RutaProtegida>
                        } />

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
                        
                        <Route path="/inventario" element={
                            <RutaProtegida rolesPermitidos={['admin', 'almacenero', 'farmaceutico']}>
                                <GestionInventario />
                            </RutaProtegida>
                        } />
                        
                        <Route path="/compras" element={
                            <RutaProtegida rolesPermitidos={['admin', 'almacenero']}>
                                <GestionCompras />
                            </RutaProtegida>
                        } />
                        
                        <Route path="/compras/nueva" element={
                            <RutaProtegida rolesPermitidos={['admin', 'almacenero']}>
                                <RegistrarCompra />
                            </RutaProtegida>
                        } />
                    </Route>

                    {/* 4. Ruta comodín */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;