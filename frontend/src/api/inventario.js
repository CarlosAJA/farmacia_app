import api from './axios';

export const inventarioApi = {
  listar: async (filtros = {}) => {
    const { data } = await api.get('/inventario', { params: filtros });
    return data.data;
  },
  listarMovimientos: async (filtros = {}) => {
    const { data } = await api.get('/inventario/movimientos', { params: filtros });
    return data.data;
  },
  ajustar: async (id, cantidad, motivo) => {
    const { data } = await api.put(`/inventario/${id}/ajustar`, { cantidad, motivo });
    return data;
  },
};