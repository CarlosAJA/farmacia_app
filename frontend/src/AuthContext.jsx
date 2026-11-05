import { createContext, useState, useEffect } from 'react';
import api from './api/axios'; // 👈 Usamos nuestra instancia personalizada

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // El interceptor en api/axios.js ya se encarga de poner el token en los headers.
    // No necesitamos el useEffect de axios.defaults aquí.

    const login = async (email, password) => {
        // 👇 Usamos api.post y solo la ruta relativa
        const res = await api.post('/usuarios/login', {
            email,
            password,
        });

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