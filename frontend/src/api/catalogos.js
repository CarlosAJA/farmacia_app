import api from './axios';

export const catalogosApi = {
  listarCategorias: async () => {
    const { data } = await api.get('/categorias', { params: { estado: 'activo' } });
    return data.data;
  },
  listarLaboratorios: async () => {
    const { data } = await api.get('/laboratorios', { params: { estado: 'activo' } });
    return data.data;
  },
  listarProveedores: async () => {
    const { data } = await api.get('/proveedores', { params: { estado: 'activo' } });
    return data.data;
  },
};