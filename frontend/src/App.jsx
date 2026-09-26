import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import DashboardFarmacia from './components/DashboardFarmacia';
import GestionUsuarios from './components/GestionUsuarios';
import RutaProtegida from './RutaProtegida';
import './App.css';
const LayoutConMenu = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main-content">
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* 1. Si alguien entra a la raíz '/', lo redirigimos automáticamente al Login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
                    {/* 2. Ruta pública del Formulario de Login */}
                    <Route path="/login" element={<Login />} />
                    {/* Panel del Vendedor y Administrador */}
                    <Route path="/dashboard" element={
                        <RutaProtegida>
                            <LayoutConMenu>
                                <DashboardFarmacia />
                            </LayoutConMenu>
                        </RutaProtegida>
                    } />
                    
                    {/* 3. Panel principal protegido para cualquier usuario logueado */}
                    <Route path="/dashboard" element={
                        <RutaProtegida>
                            <DashboardFarmacia />
                        </RutaProtegida>
                    } />

                    {/* 4. Gestión de usuarios exclusiva para Administradores */}
                    <Route path="/usuarios" element={
                        <RutaProtegida rolesPermitidos={['Administrador','admin']}>
                            <GestionUsuarios />
                        </RutaProtegida>
                    } />

                    {/* 5. Ruta comodín por si escriben cualquier otra cosa, manda al login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;