import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // Il tuo backend Express

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per gestire errori
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export const resourcesApi = {
  // Definizioni delle risorse (Model Builder)
  getAllDefinitions: () => api.get('/admin/resources'),
  getDefinition: (name) => api.get(`/admin/resources/${name}`),
  createDefinition: (data) => api.post('/admin/resources', data),
  updateDefinition: (name, data) => api.put(`/admin/resources/${name}`, data),
  deleteDefinition: (name) => api.delete(`/admin/resources/${name}`),

  // Contenuti (CRUD dinamico)
  getAllContent: (resourceName, params = {}) => 
    api.get(`/${resourceName}`, { params }),
  getContent: (resourceName, id) => 
    api.get(`/${resourceName}/${id}`),
  createContent: (resourceName, data) => 
    api.post(`/${resourceName}`, data),
  updateContent: (resourceName, id, data) => 
    api.put(`/${resourceName}/${id}`, data),
  deleteContent: (resourceName, id) => 
    api.delete(`/${resourceName}/${id}`),
};

export default api;