import api from './axios';

export const cajasApi = {
  verificarCajaActiva: async () => {
    const { data } = await api.get('/cajas/activa');
    return data.data;
  },
  abrirCaja: async (id_almacen, monto_apertura) => {
    const { data } = await api.post('/cajas/abrir', { id_almacen, monto_apertura });
    return data;
  },
  obtenerResumen: async (id_sesion) => {
    const { data } = await api.get(`/cajas/${id_sesion}/resumen`);
    return data.data;
  },
  cerrarCaja: async (id_sesion, monto_real) => {
    const { data } = await api.post(`/cajas/${id_sesion}/cerrar`, { monto_real });
    return data;
  },
};