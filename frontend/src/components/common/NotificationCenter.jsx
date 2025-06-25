import React, { useState, useEffect } from 'react';
import { notificationService, NOTIFICATION_TYPES, markAsRead, deleteNotification, markAllAsRead, clearAllNotifications } from '../../services/notificationService';
import './NotificationCenter.css';

const NotificationCenter = ({ userRole, showAsDropdown = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    // Load initial notifications
    notificationService.loadNotifications(userRole);
    
    // Subscribe to notification updates
    const unsubscribe = notificationService.addListener(setNotifications);
    
    // Request browser notification permission
    notificationService.requestPermission();
    
    // Start real-time simulation
    notificationService.startRealTimeSimulation(userRole);
    
    return unsubscribe;
  }, [userRole]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS: return '✅';
      case NOTIFICATION_TYPES.WARNING: return '⚠️';
      case NOTIFICATION_TYPES.ERROR: return '❌';
      case NOTIFICATION_TYPES.URGENT: return '🚨';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS: return '#10b981';
      case NOTIFICATION_TYPES.WARNING: return '#f59e0b';
      case NOTIFICATION_TYPES.ERROR: return '#ef4444';
      case NOTIFICATION_TYPES.URGENT: return '#dc2626';
      default: return '#3b82f6';
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !(n.read || n.is_read));
      case 'read': return notifications.filter(n => n.read || n.is_read);
      default: return notifications;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  const handleNotificationClick = (notification) => {
    if (!(notification.read || notification.is_read)) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl || notification.action_url) {
      window.location.href = notification.actionUrl || notification.action_url;
    }
  };

  const unreadCount = notifications.filter(n => !(n.read || n.is_read)).length;

  if (showAsDropdown) {
    return (
      <div className="notification-dropdown-container">
        <button 
          className="notification-bell"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
        
        {showDropdown && (
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            
            <div className="notification-dropdown-content">
              {notifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!(notification.read || notification.is_read) ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTimeAgo(notification.timestamp)}</div>
                  </div>
                </div>
              ))}
              
              {notifications.length === 0 && (
                <div className="no-notifications">
                  <span>🔕</span>
                  <p>Aucune notification</p>
                </div>
              )}
              
              {notifications.length > 5 && (
                <div className="view-all-notifications">
                  <button onClick={() => setShowDropdown(false)}>
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full notification center for dedicated section
  return (
    <div className="notification-center">
      <div className="notification-header">
        <h2>Centre de Notifications</h2>
        <div className="notification-stats">
          <span className="total-count">{notifications.length} total</span>
          <span className="unread-count">{unreadCount} non lues</span>
        </div>
      </div>

      <div className="notification-controls">
        <div className="notification-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </button>
          <button
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </button>
          <button
            className={filter === 'read' ? 'active' : ''}
            onClick={() => setFilter('read')}
          >
            Lues ({notifications.length - unreadCount})
          </button>
        </div>

        <div className="notification-actions">
          {unreadCount > 0 && (
            <button 
              className="action-btn secondary"
              onClick={markAllAsRead}
            >
              Marquer tout lu
            </button>
          )}
          <button 
            className="action-btn danger"
            onClick={clearAllNotifications}
          >
            Effacer tout
          </button>
        </div>
      </div>

      <div className="notification-list">
        {getFilteredNotifications().map(notification => (
          <div
            key={notification.id}
            className={`notification-card ${!notification.read ? 'unread' : ''} ${notification.priority || 'normal'}`}
            style={{ borderLeftColor: getNotificationColor(notification.type) }}
          >
            <div className="notification-card-header">
              <div className="notification-type-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-meta">
                <span className="notification-time">{formatTimeAgo(notification.timestamp)}</span>
                {notification.priority === 'urgent' && (
                  <span className="priority-badge urgent">URGENT</span>
                )}
                {notification.priority === 'high' && (
                  <span className="priority-badge high">IMPORTANT</span>
                )}
              </div>
              <div className="notification-card-actions">
                {!notification.read && (
                  <button 
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification.id)}
                    title="Marquer comme lu"
                  >
                    ✓
                  </button>
                )}
                <button 
                  className="delete-btn"
                  onClick={() => deleteNotification(notification.id)}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="notification-card-content">
              <h4 className="notification-title">{notification.title}</h4>
              <p className="notification-message">{notification.message}</p>
              
              {notification.actionUrl && (
                <button 
                  className="notification-action-btn"
                  onClick={() => handleNotificationClick(notification)}
                >
                  Voir les détails →
                </button>
              )}
            </div>

            {notification.category && (
              <div className="notification-category">
                <span className={`category-tag ${notification.category}`}>
                  {notification.category.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        ))}

        {getFilteredNotifications().length === 0 && (
          <div className="empty-notifications">
            <div className="empty-icon">🔕</div>
            <h3>Aucune notification</h3>
            <p>
              {filter === 'unread' ? 'Toutes vos notifications ont été lues !' : 
               filter === 'read' ? 'Aucune notification lue.' :
               'Vous n\'avez pas encore de notifications.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
