import api from './axios';

export const reportesApi = {
  getDashboard: async () => {
    const { data } = await api.get('/reportes/dashboard');
    return data.data;
  },
};