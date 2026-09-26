const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrae el token del formato "Bearer TOKEN"

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado. Token no provisto.' });
    }

    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado; // Guarda el id y rol en la petición
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

const permitirRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
        }
        next();
    };
};

// Exportación limpia de las dos funciones
module.exports = { verificarToken, permitirRoles };
