from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    """Vue racine de l'API"""
    return JsonResponse({
        'message': 'API EcoTrace - Gestion des déchets numériques',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth/',
            'users': '/api/users/',
            'waste': '/api/waste/',
            'notifications': '/api/notifications/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    # Administration Django
    path('admin/', admin.site.urls),
    
    # API racine
    path('api/', api_root, name='api_root'),    # API endpoints
    path('api/auth/', include(('users.urls', 'users'), namespace='auth')),  # Authentication endpoints
    path('api/users/', include(('users.urls', 'users'), namespace='users')),  # User management endpoints
    path('api/waste/', include('waste_management.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)