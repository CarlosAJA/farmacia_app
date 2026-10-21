import api from './axios';

export const comprasApi = {
  listar: async (filtros = {}) => {
    const { data } = await api.get('/compras', { params: filtros });
    return data.data;
  },
  obtener: async (id) => {
    const { data } = await api.get(`/compras/${id}`);
    return data.data;
  },
  crear: async (compra) => {
    const { data } = await api.post('/compras', compra);
    return data;
  },
  recibir: async (id) => {
    const { data } = await api.put(`/compras/${id}/recibir`, {});
    return data;
  },
  cancelar: async (id) => {
    const { data } = await api.put(`/compras/${id}/cancelar`, {});
    return data;
  },
};

export const catalogosApi = {
  proveedores: async () => {
    const { data } = await api.get('/catalogos/proveedores');
    return data.data;
  },
  productos: async () => {
    const { data } = await api.get('/catalogos/productos');
    return data.data;
  },
  almacenes: async () => {
    const { data } = await api.get('/catalogos/almacenes');
    return data.data;
  },
};