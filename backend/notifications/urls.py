from django.urls import path
from . import views

urlpatterns = [
    # Récupérer les notifications de l'utilisateur
    path('', views.get_user_notifications, name='user_notifications'),
    
    # Marquer une notification comme lue
    path('<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    
    # Marquer toutes les notifications comme lues
    path('mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    
    # Supprimer une notification
    path('<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    
    # Statistiques des notifications
    path('stats/', views.get_notification_stats, name='notification_stats'),
]