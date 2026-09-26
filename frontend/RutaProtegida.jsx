import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const RutaProtegida = ({ children, rolesPermitidos }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
        return <h2>No tienes permisos para ver esta sección de la farmacia.</h2>;
    }

    return children;
};

export default RutaProtegida;