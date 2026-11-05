import api from './axios';

export const reportesApi = {
  getDashboard: async (params = {}) => {
    const { data } = await api.get('/reportes/dashboard', { params });
    return data.data;
  },
};