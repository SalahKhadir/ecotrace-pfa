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

  // Get transporteurs for logistics planning
  getTransporteurs: async () => {
    const response = await api.get('/users/manage/transporteurs/');
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
    changerStatutCollecte: async (collecteId, payload) => {
    // Si payload est juste un string (ancien format), le convertir
    const data = typeof payload === 'string' ? { statut: payload } : payload;
    const response = await api.post(`/waste/collectes/${collecteId}/changer_statut/`, data);
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

  // Méthodes spécifiques pour les transporteurs
  getCollectesTransporteur: async () => {
    const response = await api.get('/waste/transporteur/collectes/');
    return response.data;
  },

  getFormulairesTransporteur: async () => {
    const response = await api.get('/waste/transporteur/formulaires/');
    return response.data;
  },  // Méthodes spécifiques pour les techniciens
  getDechetsTechinicien: async () => {
    const response = await api.get('/waste/technicien/dechets/');
    return response.data;
  },
  
  // Nouvelles méthodes pour le workflow technicien
  getDechetsRecus: async () => {
    const response = await api.get('/waste/technicien/dechets-recus/');
    return response.data;
  },
  
  getDechetsEnCours: async () => {
    const response = await api.get('/waste/technicien/dechets-en-cours/');
    return response.data;
  },
  
  getDechetsValorises: async () => {
    const response = await api.get('/waste/technicien/dechets-valorises/');
    return response.data;
  },
  
  demarrerValorisation: async (dechetId) => {
    const response = await api.post(`/waste/technicien/demarrer-valorisation/${dechetId}/`);
    return response.data;
  },
  
  valoriserDechetComplet: async (dechetId, valorisationData) => {
    const formData = new FormData();
    Object.keys(valorisationData).forEach(key => {
      if (valorisationData[key] !== null && valorisationData[key] !== undefined) {
        formData.append(key, valorisationData[key]);
      }
    });
    
    const response = await api.post(`/waste/technicien/valoriser-dechet/${dechetId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },
  
  getStatsTechnicien: async () => {
    try {
      const [dechetsRecus, dechetsEnCours, dechetsValorises] = await Promise.all([
        wasteService.getDechetsRecus(),
        wasteService.getDechetsEnCours(),
        wasteService.getDechetsValorises()
      ]);

      return {
        dechets_recus: dechetsRecus.total || 0,
        dechets_en_cours: dechetsEnCours.total || 0,
        dechets_valorises: dechetsValorises.total || 0,
        dechets_recycles: dechetsValorises.dechets?.filter(d => 
          d.etat === 'A_RECYCLER' || d.etat === 'RECYCLE'
        ).length || 0,
        dechets_detruits: dechetsValorises.dechets?.filter(d => 
          d.etat === 'A_DETRUIRE' || d.etat === 'DETRUIT'
        ).length || 0
      };
    } catch (error) {
      console.error('Erreur récupération stats technicien:', error);
      return {
        dechets_recus: 0,
        dechets_en_cours: 0,
        dechets_valorises: 0,
        dechets_recycles: 0,
        dechets_detruits: 0
      };
    }
  },
  
  valoriserDechet: async (dechetId, etat) => {
    const response = await api.post(`/waste/dechets/${dechetId}/valoriser/`, { etat });
    return response.data;
  },
  
  assignerDechetTechnicien: async (dechetId, technicienId = null) => {
    const data = technicienId ? { technicien_id: technicienId } : {};
    const response = await api.post(`/waste/dechets/${dechetId}/assigner_technicien/`, data);
    return response.data;
  },
  
  // Historique des déchets pour les particuliers
  getHistoriqueDechets: async () => {
    const response = await api.get('/waste/historique-dechets/');
    return response.data;
  }
};

// Service pour les notifications
export const notificationService = {
  // Récupérer les notifications de l'utilisateur
  getUserNotifications: async (unreadOnly = false, limit = 20) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread_only', 'true');
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/notifications/?${params.toString()}`);
    return response.data;
  },

  // Marquer une notification comme lue
  markAsRead: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/read/`);
    return response.data;
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },

  // Supprimer une notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}/delete/`);
    return response.data;
  },

  // Récupérer les statistiques des notifications
  getNotificationStats: async () => {
    const response = await api.get('/notifications/stats/');
    return response.data;
  }
};

export default api;
