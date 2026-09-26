import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

const DashboardFarmacia = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Panel Principal de la Farmacia</h1>
            <p>Bienvenido, <strong>{user?.nombre}</strong> ({user?.rol})</p>
            <button 
                onClick={logout} 
                style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Cerrar Sesión
            </button>
        </div>
    );
};

export default DashboardFarmacia;
