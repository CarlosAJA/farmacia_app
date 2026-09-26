import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './Login.css'; // Archivo de estilos que crearemos a continuación

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            await login(email, password);
            navigate('/dashboard'); // Redirige al panel principal si es exitoso
        } catch (err) {
            // Captura el mensaje de error enviado por el backend
            setError(err.response?.data?.error || 'Error al conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-icon">💊</span>
                    <h2>FarmaSystem</h2>
                    <p>Control de Administración y Punto de Venta</p>
                </div>

                {error && <div className="login-error-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="ejemplo@farmacia.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={cargando}>
                        {cargando ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <p>Acceso restringido solo a personal autorizado.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;