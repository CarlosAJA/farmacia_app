import api from './axios';

export const productosApi = {
  listar: async (filtros = {}) => {
    const { data } = await api.get('/productos', { params: filtros });
    return data.data;
  },
  obtener: async (id) => {
    const { data } = await api.get(`/productos/${id}`);
    return data.data;
  },
  crear: async (producto) => {
    const { data } = await api.post('/productos', producto);
    return data.data;
  },
  actualizar: async (id, producto) => {
    const { data } = await api.put(`/productos/${id}`, producto);
    return data.data;
  },
  eliminar: async (id) => {
    const { data } = await api.delete(`/productos/${id}`);
    return data;
  },
  alertas: async () => {
    const { data } = await api.get('/productos/alertas');
    return data.data;
  },
};