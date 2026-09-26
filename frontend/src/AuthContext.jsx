import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Inicializamos los estados leyendo DIRECTAMENTE del localStorage para evitar que se pierdan
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (token) {
            // Adjuntar el token automáticamente a todas las peticiones del Frontend
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/usuarios/login', { email, password });
        
        // Desestructuramos la respuesta del backend
        const { token: tokenRecibido, usuario: usuarioRecibido } = res.data;

        if (!tokenRecibido || !usuarioRecibido) {
            throw new Error("El servidor no devolvió los datos correctos.");
        }

        // Aseguramos que el rol siempre sea guardado en minúsculas para evitar problemas de compatibilidad
        const usuarioFormateado = {
            ...usuarioRecibido,
            rol: usuarioRecibido.rol.toLowerCase()
        };

        // Guardar físicamente en el navegador
        localStorage.setItem('token', tokenRecibido);
        localStorage.setItem('user', JSON.stringify(usuarioFormateado));

        // Actualizar estados de React
        setToken(tokenRecibido);
        setUser(usuarioFormateado);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
        window.location.href = '/login'; // Forzar redirección limpia al salir
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};