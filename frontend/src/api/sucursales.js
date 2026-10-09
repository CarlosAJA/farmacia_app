import api from './axios';

export const sucursalesApi = {
  listar: async (filtros = {}) => {
    const { data } = await api.get('/sucursales', { params: filtros });
    return data.data;              // 👈 .data.data por el nuevo formato { ok, data }
  },
  obtener: async (id) => {
    const { data } = await api.get(`/sucursales/${id}`);
    return data.data;
  },
  crear: async (sucursal) => {
    const { data } = await api.post('/sucursales', sucursal);
    return data.data;
  },
  actualizar: async (id, sucursal) => {
    const { data } = await api.put(`/sucursales/${id}`, sucursal);
    return data.data;
  },
  eliminar: async (id) => {
    const { data } = await api.delete(`/sucursales/${id}`);
    return data;
  },
};