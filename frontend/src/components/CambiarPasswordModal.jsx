import { useState } from 'react';
import api from '../api/axios';
import './CambiarPasswordModal.css';

export default function CambiarPasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas nuevas no coinciden.');
    }
    if (newPassword.length < 6) {
      return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    setCargando(true);
    try {
      const res = await api.put('/usuarios/change-password', { oldPassword, newPassword });
      setExito(res.data.mensaje || 'Contraseña actualizada exitosamente.');
      setTimeout(() => {
        onClose(); // Cierra el modal después de 2 segundos
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay-password" onClick={onClose}>
      <div className="modal-password-contenido" onClick={(e) => e.stopPropagation()}>
        <h3>🔒 Cambiar Contraseña</h3>
        <p className="subtitulo-modal">Actualiza tu clave de acceso al sistema.</p>

        {error && <div className="alerta-error">{error}</div>}
        {exito && <div className="alerta-exito">{exito}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group-pwd">
            <label>Contraseña Actual:</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group-pwd">
            <label>Nueva Contraseña:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group-pwd">
            <label>Confirmar Nueva Contraseña:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="modal-botones-pwd">
            <button type="button" onClick={onClose} className="btn-cancelar-pwd">
              Cancelar
            </button>
            <button type="submit" className="btn-guardar-pwd" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}