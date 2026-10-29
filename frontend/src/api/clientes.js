import api from './axios';

export const clientesApi = {
  listar: async (filtros = {}) => {
    const { data } = await api.get('/clientes', { params: filtros });
    return data.data;
  },
  historial: async (id) => {
    const { data } = await api.get(`/clientes/${id}/historial`);
    return data.data;
  },
};