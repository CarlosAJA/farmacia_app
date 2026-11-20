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
  transferir: async (data) => {
    const response = await api.post('/inventario/transferir', data);
    return response.data;
  },
  agregarLote: async (data) => {
    const res = await api.post('/inventario/lotes', data);
    return res.data;
  },
  obtenerLotes: async (id_producto, id_almacen) => {
    const res = await api.get('/inventario/lotes', { params: { id_producto, id_almacen } });
    return res.data.data;
  },
};