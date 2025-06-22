from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'waste_management'

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'formulaires', views.FormulaireCollecteViewSet, basename='formulaire')
router.register(r'collectes', views.CollecteViewSet, basename='collecte')
router.register(r'dechets', views.DechetViewSet, basename='dechet')

urlpatterns = [
    # URLs des ViewSets
    path('', include(router.urls)),
    
    # URLs pour les vues fonctionnelles
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('points-collecte/', views.points_collecte, name='points_collecte'),
]