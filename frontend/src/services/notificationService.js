// Notification Service for EcoTrace
// Note: API integration can be added later if needed

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  URGENT: 'urgent'
};

export const NOTIFICATION_CATEGORIES = {
  COLLECTE: 'collecte',
  DEMANDE: 'demande',
  UTILISATEUR: 'utilisateur',
  SYSTEM: 'system',
  VALORISATION: 'valorisation'
};

class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
  }

  // Add listener for real-time notifications
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Create notification
  createNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(`EcoTrace - ${notification.title}`, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }

    return newNotification;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Get notifications by category
  getByCategory(category) {
    return this.notifications.filter(n => n.category === category);
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Request browser notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Generate role-specific notifications
  generateRoleNotifications(userRole, data = {}) {
    const now = new Date().toISOString();
    
    switch (userRole) {
      case 'ADMINISTRATEUR':
        return [
          {
            title: 'Nouvelle demande en attente',
            message: 'Une nouvelle demande de collecte nécessite votre validation',
            type: NOTIFICATION_TYPES.WARNING,
            category: NOTIFICATION_CATEGORIES.DEMANDE,
            priority: 'high',
            actionUrl: '/dashboard/administrateur?section=demandes'
          },
          {
            title: 'Rapport mensuel disponible',
            message: 'Le rapport de collectes du mois est prêt à être généré',
            type: NOTIFICATION_TYPES.INFO,
            category: NOTIFICATION_CATEGORIES.SYSTEM,
            priority: 'normal'
          }
        ];

      case 'TRANSPORTEUR':
        return [
          {
            title: 'Nouvelle collecte assignée',
            message: 'Une collecte vous a été assignée pour demain',
            type: NOTIFICATION_TYPES.INFO,
            category: NOTIFICATION_CATEGORIES.COLLECTE,
            priority: 'high',
            actionUrl: '/dashboard/transporteur?section=collectes'
          },
          {
            title: 'Collecte urgente',
            message: 'Collecte prioritaire à effectuer aujourd\'hui',
            type: NOTIFICATION_TYPES.URGENT,
            category: NOTIFICATION_CATEGORIES.COLLECTE,
            priority: 'urgent'
          }
        ];

      case 'TECHNICIEN':
        return [
          {
            title: 'Nouveaux déchets reçus',
            message: 'Des déchets sont arrivés et nécessitent une valorisation',
            type: NOTIFICATION_TYPES.INFO,
            category: NOTIFICATION_CATEGORIES.VALORISATION,
            priority: 'normal',
            actionUrl: '/dashboard/technicien?section=dechets'
          },
          {
            title: 'Processus de valorisation en attente',
            message: '3 processus de valorisation nécessitent votre attention',
            type: NOTIFICATION_TYPES.WARNING,
            category: NOTIFICATION_CATEGORIES.VALORISATION,
            priority: 'high'
          }
        ];

      case 'ENTREPRISE':
        return [
          {
            title: 'Collecte planifiée confirmée',
            message: 'Votre collecte du 26/06/2025 a été confirmée',
            type: NOTIFICATION_TYPES.SUCCESS,
            category: NOTIFICATION_CATEGORIES.COLLECTE,
            priority: 'normal'
          },
          {
            title: 'Rappel: Collecte demain',
            message: 'N\'oubliez pas votre collecte programmée demain à 14h',
            type: NOTIFICATION_TYPES.WARNING,
            category: NOTIFICATION_CATEGORIES.COLLECTE,
            priority: 'high'
          }
        ];

      case 'PARTICULIER':
        return [
          {
            title: 'Demande de collecte approuvée',
            message: 'Votre demande de collecte a été approuvée',
            type: NOTIFICATION_TYPES.SUCCESS,
            category: NOTIFICATION_CATEGORIES.DEMANDE,
            priority: 'normal'
          },
          {
            title: 'Collecte programmée',
            message: 'Votre collecte est programmée pour demain à 10h',
            type: NOTIFICATION_TYPES.INFO,
            category: NOTIFICATION_CATEGORIES.COLLECTE,
            priority: 'normal'
          }
        ];

      case 'RESPONSABLE_LOGISTIQUE':
        return [
          {
            title: 'Nouvelle demande approuvée',
            message: 'Une demande de collecte a été approuvée et nécessite une planification',
            type: NOTIFICATION_TYPES.INFO,
            category: NOTIFICATION_CATEGORIES.DEMANDE,
            priority: 'normal',
            actionUrl: '/dashboard/logistique?section=planification'
          },
          {
            title: 'Collecte urgente à planifier',
            message: 'Une collecte prioritaire doit être planifiée rapidement',
            type: NOTIFICATION_TYPES.WARNING,
            category: NOTIFICATION_CATEGORIES.COLLECTE,
            priority: 'high'
          },
          {
            title: 'Rapport de suivi disponible',
            message: 'Le rapport de traçabilité mensuel est prêt',
            type: NOTIFICATION_TYPES.SUCCESS,
            category: NOTIFICATION_CATEGORIES.SYSTEM,
            priority: 'low'
          }
        ];

      default:
        return [];
    }
  }

  // Load initial notifications for user role
  async loadNotifications(userRole) {
    try {
      // Try to load from API first
      // const response = await api.get('/notifications/');
      // this.notifications = response.data.results || response.data;
      
      // For now, generate role-specific mock notifications
      const mockNotifications = this.generateRoleNotifications(userRole);
      this.notifications = mockNotifications.map(notification => ({
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: Math.random() > 0.7, // 30% chance of being unread
        ...notification
      }));
      
      this.notifyListeners();
      return this.notifications;
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Simulate real-time notifications (for demo)
  startRealTimeSimulation(userRole) {
    setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every interval
        const newNotifications = this.generateRoleNotifications(userRole);
        if (newNotifications.length > 0) {
          const randomNotification = newNotifications[Math.floor(Math.random() * newNotifications.length)];
          this.createNotification(randomNotification);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export notification utilities
export const createNotification = (notification) => notificationService.createNotification(notification);
export const markAsRead = (id) => notificationService.markAsRead(id);
export const markAllAsRead = () => notificationService.markAllAsRead();
export const deleteNotification = (id) => notificationService.deleteNotification(id);
export const clearAllNotifications = () => notificationService.clearAll();
