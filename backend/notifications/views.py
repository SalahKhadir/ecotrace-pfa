from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .services import NotificationService
from .serializers import NotificationSerializer
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """
    Récupérer les notifications pour l'utilisateur connecté
    """
    user = request.user
    unread_only = request.GET.get('unread_only', 'false').lower() == 'true'
    limit = int(request.GET.get('limit', 20))
    
    # Récupérer les notifications spécifiques à l'utilisateur et à son rôle
    notifications = NotificationService.get_role_notifications(
        user_role=user.role,
        user_id=user.id,
        unread_only=unread_only
    )[:limit]
    
    serializer = NotificationSerializer(notifications, many=True)
    
    # Compter les notifications non lues
    unread_count = NotificationService.get_role_notifications(
        user_role=user.role,
        user_id=user.id,
        unread_only=True
    ).count()
    
    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count,
        'total': notifications.count() if hasattr(notifications, 'count') else len(notifications)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Marquer une notification comme lue
    """
    try:
        notification = Notification.objects.get(
            id=notification_id,
            user=request.user
        )
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marquée comme lue',
            'notification_id': notification_id
        })
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Marquer toutes les notifications de l'utilisateur comme lues
    """
    user = request.user
    
    # Marquer toutes les notifications de l'utilisateur comme lues
    notifications = Notification.objects.filter(
        user=user,
        read=False
    )
    
    count = notifications.count()
    notifications.update(read=True, read_at=timezone.now())
    
    return Response({
        'message': f'{count} notifications marquées comme lues',
        'count': count
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    Supprimer une notification
    """
    try:
        notification = Notification.objects.get(
            id=notification_id,
            user=request.user
        )
        notification.delete()
        
        return Response({
            'message': 'Notification supprimée',
            'notification_id': notification_id
        })
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notification_stats(request):
    """
    Récupérer les statistiques des notifications pour l'utilisateur
    """
    user = request.user
    
    total_notifications = Notification.objects.filter(
        user=user
    ).count()
    
    unread_notifications = Notification.objects.filter(
        user=user,
        read=False
    ).count()
    
    notifications_by_category = {}
    categories = Notification.objects.filter(user=user).values_list('category', flat=True).distinct()
    
    for category in categories:
        notifications_by_category[category] = Notification.objects.filter(
            user=user,
            category=category
        ).count()
    
    return Response({
        'total_notifications': total_notifications,
        'unread_notifications': unread_notifications,
        'read_notifications': total_notifications - unread_notifications,
        'notifications_by_category': notifications_by_category,
        'user_role': user.role
    })
