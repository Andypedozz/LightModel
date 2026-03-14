// frontend/src/services/api.js
import axios from 'axios';

// Configurazione base dell'API
const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondi di timeout
});

// Interceptor per gestire le richieste
api.interceptors.request.use(
  (config) => {
    // Qui puoi aggiungere token di autenticazione se necessario
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor per gestire le risposte
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // La richiesta è stata fatta e il server ha risposto con un codice di errore
      console.error('❌ Response Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      
      // Gestione errori specifici
      switch (error.response.status) {
        case 400:
          error.message = error.response.data?.error || 'Richiesta non valida';
          break;
        case 401:
          error.message = 'Non autorizzato. Effettua il login.';
          // Redirect al login se necessario
          break;
        case 403:
          error.message = 'Accesso negato';
          break;
        case 404:
          error.message = 'Risorsa non trovata';
          break;
        case 500:
          error.message = 'Errore interno del server';
          break;
        default:
          error.message = error.response.data?.error || 'Errore nella richiesta';
      }
    } else if (error.request) {
      // La richiesta è stata fatta ma non c'è risposta
      console.error('❌ No response received:', error.request);
      error.message = 'Impossibile raggiungere il server. Verifica la connessione.';
    } else {
      // Errore nella configurazione della richiesta
      console.error('❌ Request Config Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper per gestire le richieste con caricamento
export const withLoading = async (promise, setLoading) => {
  try {
    setLoading?.(true);
    const response = await promise;
    return response;
  } finally {
    setLoading?.(false);
  }
};

// API service object
const apiService = {
  // Entity endpoints
  getEntities: () => api.get('/api/entities'),
  getEntity: (id) => api.get(`/api/entities/${id}`),
  createEntity: (data) => api.post('/api/entities', data),
  updateEntity: (id, data) => api.patch(`/api/entities/${id}`, data),
  deleteEntity: (id) => api.delete(`/api/entities/${id}`),
  getEntityFields: (id) => api.get(`/api/entities/${id}/fields`),
  getEntityRelations: (id) => api.get(`/api/entities/${id}/relations`),
  
  // Record endpoints (dinamici per slug)
  getRecords: (entitySlug) => api.get(`/api/${entitySlug}`),
  getRecord: (entitySlug, id) => api.get(`/api/${entitySlug}/${id}`),
  createRecord: (entitySlug, data) => api.post(`/api/${entitySlug}`, data),
  updateRecord: (entitySlug, id, data) => api.patch(`/api/${entitySlug}/${id}`, data),
  deleteRecord: (entitySlug, id) => api.delete(`/api/${entitySlug}/${id}`),
  
  // Media endpoints (da implementare)
  getMedia: () => api.get('/api/media'),
  uploadMedia: (formData) => api.post('/api/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // User endpoints (da implementare)
  getUsers: () => api.get('/api/users'),
  getRoles: () => api.get('/api/roles'),
  
  // API tokens (da implementare)
  getApiTokens: () => api.get('/api/api-tokens'),
  
  // Webhooks (da implementare)
  getWebhooks: () => api.get('/api/webhooks'),
  
  // Activity log (da implementare)
  getActivityLog: () => api.get('/api/activity-log'),
  
  // Health check
  healthCheck: () => api.get('/api/health')
};

export default apiService;