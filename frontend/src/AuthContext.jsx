import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/usuarios/login', {
            email,
            password,
        });

        // 👇 Nueva estructura: { ok, data: { token, usuario } }
        const respuesta = res.data;
        if (!respuesta.ok || !respuesta.data) {
            throw new Error(respuesta.error || 'El servidor no devolvió los datos correctos.');
        }

        const { token: tokenRecibido, usuario: usuarioRecibido } = respuesta.data;

        const usuarioFormateado = {
            ...usuarioRecibido,
            rol: usuarioRecibido.rol.toLowerCase(),
        };

        localStorage.setItem('token', tokenRecibido);
        localStorage.setItem('user', JSON.stringify(usuarioFormateado));

        setToken(tokenRecibido);
        setUser(usuarioFormateado);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};