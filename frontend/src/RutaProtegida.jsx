import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const RutaProtegida = ({ children, rolesPermitidos }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Normalizamos los roles a minúsculas para que 'admin' y 'Administrador' sean compatibles
    if (rolesPermitidos) {
        const rolesNormalizados = rolesPermitidos.map(r => r.toLowerCase());
        const userRolNormalizado = user.rol ? user.rol.toLowerCase() : '';

        if (!rolesNormalizados.includes(userRolNormalizado)) {
            return <h2 style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#dc2626' }}>
                No tienes permisos para ver esta sección de la farmacia.
            </h2>;
        }
    }

    return children;
};

export default RutaProtegida;