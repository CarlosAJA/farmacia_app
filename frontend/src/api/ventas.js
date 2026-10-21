import api from './axios';

export const ventasApi = {
  listar: async (filtros = {}) => {
    const { data } = await api.get('/ventas', { params: filtros });
    return data.data;
  },
  obtener: async (id) => {
    const { data } = await api.get(`/ventas/${id}`);
    return data.data;
  },
  crear: async (venta) => {
    const { data } = await api.post('/ventas', venta);
    return data;
  },
  anular: async (id) => {
    const { data } = await api.put(`/ventas/${id}/anular`, {});
    return data;
  },
};