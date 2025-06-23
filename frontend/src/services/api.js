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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Essayer de rafraîchir le token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('accessToken', newAccessToken);
          
          // Refaire la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Le refresh a échoué, rediriger vers login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
      } else {
        // Pas de refresh token, rediriger vers login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { 
        email, 
        password 
      });
      return response.data;
    } catch (error) {
      console.error('Erreur de connexion:', error.response?.data);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours nettoyer le localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userInfo');
    }
  },
  
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
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
  },

  getDashboardInfo: async () => {
    const response = await api.get('/users/dashboard-info/');
    return response.data;
  },

  checkDashboardAccess: async (dashboardType) => {
    const response = await api.get(`/users/dashboard-access/${dashboardType}/`);
    return response.data;
  },
  // User management for administrators
  getAllUsers: async () => {
    const response = await api.get('/users/manage/');
    return response.data;
  },
  
  createUser: async (userData) => {
    const response = await api.post('/users/manage/', userData);
    return response.data;
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/manage/${userId}/`, userData);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/manage/${userId}/`);
    return response.data;
  },
  
  toggleUserStatus: async (userId) => {
    const response = await api.post(`/users/manage/${userId}/toggle_status/`);
    return response.data;
  },
  
  getUserStatistics: async () => {
    const response = await api.get('/users/manage/statistics/');
    return response.data;
  },
};

// Services de gestion des déchets (NOUVEAUX)
export const wasteService = {
  // Formulaires de collecte
  createFormulaireCollecte: async (formData) => {
    // Créer FormData pour supporter les fichiers
    const form = new FormData();
    
    // Ajouter tous les champs du formulaire
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        if (key.startsWith('photo') && formData[key] instanceof File) {
          form.append(key, formData[key]);
        } else {
          form.append(key, formData[key]);
        }
      }
    });

    const response = await api.post('/waste/formulaires/', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getFormulaireCollecte: async (id) => {
    const response = await api.get(`/waste/formulaires/${id}/`);
    return response.data;
  },
  
  getMesFormulaires: async () => {
    const response = await api.get('/waste/formulaires/mes_formulaires/');
    return response.data;
  },
  
  getAllFormulaires: async () => {
    const response = await api.get('/waste/formulaires/');
    return response.data;
  },
  
  validerFormulaire: async (id, data = {}) => {
    const response = await api.post(`/waste/formulaires/${id}/valider/`, data);
    return response.data;
  },  // Demande approval/rejection  
  approuverDemande: async (id, data = {}) => {
    const response = await api.post(`/waste/formulaires/${id}/approuver/`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return response.data;
  },
  
  rejeterDemande: async (id, data) => {
    const response = await api.post(`/waste/formulaires/${id}/rejeter/`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return response.data;
  },
  
  // Collectes
  getCollecte: async (id) => {
    const response = await api.get(`/waste/collectes/${id}/`);
    return response.data;
  },
  
  getMesCollectes: async () => {
    const response = await api.get('/waste/collectes/mes_collectes/');
    return response.data;
  },
  
  getAllCollectes: async () => {
    const response = await api.get('/waste/collectes/');
    return response.data;
  },
  
  assignerTransporteur: async (collecteId, transporteurId = null) => {
    const data = transporteurId ? { transporteur_id: transporteurId } : {};
    const response = await api.post(`/waste/collectes/${collecteId}/assigner_transporteur/`, data);
    return response.data;
  },
  
  changerStatutCollecte: async (collecteId, statut) => {
    const response = await api.post(`/waste/collectes/${collecteId}/changer_statut/`, { statut });
    return response.data;
  },
  
  // Déchets
  getAllDechets: async () => {
    const response = await api.get('/waste/dechets/');
    return response.data;
  },
  
  valoriserDechet: async (dechetId, etat) => {
    const response = await api.post(`/waste/dechets/${dechetId}/valoriser/`, { etat });
    return response.data;
  },
  
  // Statistiques
  getDashboardStats: async () => {
    const response = await api.get('/waste/dashboard-stats/');
    return response.data;
  },
  
  // Points de collecte
  getPointsCollecte: async () => {
    const response = await api.get('/waste/points-collecte/');
    return response.data;
  },

  // Créer une collecte
  createCollecte: async (collecteData) => {
    const response = await api.post('/waste/collectes/', collecteData);
    return response.data;
  },

  // Obtenir un utilisateur courant (pour remplacer authService.getCurrentUser)
  getCurrentUser: async () => {
    const response = await api.get('/users/dashboard-info/');
    return response.data;
  },
};

export default api;
