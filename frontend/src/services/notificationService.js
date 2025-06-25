// Notification Service for EcoTrace
import { notificationService as apiNotificationService } from './api';

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
  VALORISATION: 'valorisation',
  PLANIFICATION: 'planification',
  VALIDATION: 'validation'
};

class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
    this.unreadCount = 0;
    this.pollingInterval = null;
    this.isInitialized = false;
  }

  // Initialize the notification service
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Request browser notification permission
      await this.requestPermission();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
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

  // Load notifications from API
  // Load notifications from API
  async loadNotifications(userRole, unreadOnly = false) {
    try {
      const response = await apiNotificationService.getUserNotifications(unreadOnly);
      this.notifications = response.notifications || [];
      this.unreadCount = response.unread_count || 0;
      
      this.notifyListeners();
      return this.notifications;
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to mock notifications if API fails
      const mockNotifications = this.generateRoleNotifications(userRole);
      this.notifications = mockNotifications;
      this.unreadCount = mockNotifications.filter(n => !n.read).length;
      this.notifyListeners();
      return this.notifications;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await apiNotificationService.markAsRead(notificationId);
      
      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.read_at = new Date().toISOString();
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifyListeners();
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await apiNotificationService.markAllAsRead();
      
      // Update local state
      this.notifications.forEach(notification => {
        notification.read = true;
        notification.read_at = new Date().toISOString();
      });
      this.unreadCount = 0;
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await apiNotificationService.deleteNotification(notificationId);
      
      // Update local state
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        const notification = this.notifications[index];
        if (!notification.read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications.splice(index, 1);
        this.notifyListeners();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get notification statistics
  async getStats() {
    try {
      return await apiNotificationService.getNotificationStats();
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total_notifications: this.notifications.length,
        unread_notifications: this.unreadCount,
        read_notifications: this.notifications.length - this.unreadCount,
        notifications_by_category: {},
        user_role: 'UNKNOWN'
      };
    }
  }

  // Get notifications by category
  getNotificationsByCategory(category) {
    return this.notifications.filter(n => n.category === category);
  }

  // Get unread notifications count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Request browser notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      };

      const browserNotification = new Notification(notification.title, options);
      
      // Auto-close after 5 seconds unless urgent
      if (notification.priority !== 'urgent') {
        setTimeout(() => browserNotification.close(), 5000);
      }

      return browserNotification;
    }
    return null;
  }

  // Start real-time polling for new notifications
  startPolling() {
    if (this.pollingInterval) return; // Already polling
    
    this.pollingInterval = setInterval(async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        if (userRole) {
          await this.loadNotifications(userRole);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000); // Poll every 30 seconds
  }

  // Stop real-time polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Generate role-specific notifications (fallback)
  generateRoleNotifications(userRole) {
    const now = new Date().toISOString();
    
    const roleNotifications = {
      'ADMINISTRATEUR': [
        {
          id: 'admin_1',
          title: 'Nouvelles demandes en attente',
          message: '3 demandes de collecte nécessitent votre validation',
          type: NOTIFICATION_TYPES.WARNING,
          category: NOTIFICATION_CATEGORIES.DEMANDE,
          priority: 'high',
          action_url: '/dashboard/administrateur?section=demandes',
          read: false,
          created_at: now,
          time_ago: 'Il y a 2 heures'
        },
        {
          id: 'admin_2',
          title: 'Rapport mensuel disponible',
          message: 'Le rapport de collectes du mois est prêt à être généré',
          type: NOTIFICATION_TYPES.INFO,
          category: NOTIFICATION_CATEGORIES.SYSTEM,
          priority: 'normal',
          action_url: '/dashboard/administrateur?section=rapports',
          read: false,
          created_at: now,
          time_ago: 'Il y a 1 jour'
        }
      ],

      'TRANSPORTEUR': [
        {
          id: 'transport_1',
          title: 'Collecte urgente assignée',
          message: 'Collecte COL-2025-003 nécessite une intervention aujourd\'hui',
          type: NOTIFICATION_TYPES.URGENT,
          category: NOTIFICATION_CATEGORIES.COLLECTE,
          priority: 'urgent',
          action_url: '/dashboard/transporteur?section=collectes',
          read: false,
          created_at: now,
          time_ago: 'Il y a 30 minutes'
        },
        {
          id: 'transport_2',
          title: 'Nouvelle collecte assignée',
          message: 'Collecte programmée pour demain à 14h00',
          type: NOTIFICATION_TYPES.INFO,
          category: NOTIFICATION_CATEGORIES.COLLECTE,
          priority: 'high',
          action_url: '/dashboard/transporteur?section=collectes',
          read: false,
          created_at: now,
          time_ago: 'Il y a 2 heures'
        }
      ],

      'TECHNICIEN': [
        {
          id: 'tech_1',
          title: 'Nouveaux déchets reçus',
          message: '5 nouveaux déchets nécessitent une valorisation',
          type: NOTIFICATION_TYPES.INFO,
          category: NOTIFICATION_CATEGORIES.VALORISATION,
          priority: 'normal',
          action_url: '/dashboard/technicien?section=dechets',
          read: false,
          created_at: now,
          time_ago: 'Il y a 1 heure'
        },
        {
          id: 'tech_2',
          title: 'Processus en attente',
          message: '2 processus de valorisation nécessitent votre attention',
          type: NOTIFICATION_TYPES.WARNING,
          category: NOTIFICATION_CATEGORIES.VALORISATION,
          priority: 'high',
          action_url: '/dashboard/technicien?section=processus',
          read: false,
          created_at: now,
          time_ago: 'Il y a 3 heures'
        }
      ],

      'ENTREPRISE': [
        {
          id: 'entreprise_1',
          title: 'Collecte confirmée',
          message: 'Votre collecte du 26/06/2025 a été confirmée',
          type: NOTIFICATION_TYPES.SUCCESS,
          category: NOTIFICATION_CATEGORIES.COLLECTE,
          priority: 'normal',
          action_url: '/dashboard/entreprise?section=collectes',
          read: false,
          created_at: now,
          time_ago: 'Il y a 4 heures'
        }
      ],

      'PARTICULIER': [
        {
          id: 'particulier_1',
          title: 'Demande approuvée',
          message: 'Votre demande de collecte a été approuvée',
          type: NOTIFICATION_TYPES.SUCCESS,
          category: NOTIFICATION_CATEGORIES.DEMANDE,
          priority: 'normal',
          action_url: '/dashboard/particulier?section=formulaires',
          read: false,
          created_at: now,
          time_ago: 'Il y a 6 heures'
        }
      ],

      'RESPONSABLE_LOGISTIQUE': [
        {
          id: 'logistique_1',
          title: 'Planification requise',
          message: '2 demandes approuvées nécessitent une planification',
          type: NOTIFICATION_TYPES.WARNING,
          category: NOTIFICATION_CATEGORIES.PLANIFICATION,
          priority: 'high',
          action_url: '/dashboard/responsable-logistique?section=planification',
          read: false,
          created_at: now,
          time_ago: 'Il y a 2 heures'
        }
      ]
    };

    const notifications = roleNotifications[userRole] || [];
    this.notifications = notifications;
    this.unreadCount = notifications.filter(n => !n.read).length;
    this.notifyListeners();
    
    return notifications;
  }

  // Create a new notification
  createNotification(notification) {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      read: false,
      created_at: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    this.unreadCount++;
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

  // Simulate real-time notifications (for demo)
  startRealTimeSimulation(userRole) {
    // This method is kept for backward compatibility but doesn't do anything
    // since we now use real polling with startPolling()
    console.log('Real-time simulation started for', userRole);
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
