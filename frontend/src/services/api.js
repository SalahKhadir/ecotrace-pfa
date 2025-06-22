import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Configuration de base pour Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré, rediriger vers login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
  },
  
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  }
};

// Services utilisateur
export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile/');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile/', userData);
    return response.data;
  }
};

// Services de gestion des déchets
export const wasteService = {
  // Formulaires de collecte
  createCollectForm: async (formData) => {
    const response = await api.post('/waste/collect-forms/', formData);
    return response.data;
  },
  
  getCollectForms: async () => {
    const response = await api.get('/waste/collect-forms/');
    return response.data;
  },
  
  // Collectes
  getCollectes: async () => {
    const response = await api.get('/waste/collectes/');
    return response.data;
  },
  
  updateCollecte: async (id, data) => {
    const response = await api.put(`/waste/collectes/${id}/`, data);
    return response.data;
  },
  
  // Déchets
  getWastes: async () => {
    const response = await api.get('/waste/wastes/');
    return response.data;
  },
  
  validateWaste: async (id, data) => {
    const response = await api.post(`/waste/wastes/${id}/validate/`, data);
    return response.data;
  }
};

export default api;