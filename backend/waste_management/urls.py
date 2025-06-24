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
    
    # URLs spécifiques pour les transporteurs
    path('transporteur/collectes/', views.collectes_transporteur, name='collectes_transporteur'),
    path('transporteur/formulaires/', views.formulaires_a_verifier, name='formulaires_a_verifier'),
      # URLs spécifiques pour les techniciens
    path('technicien/dechets/', views.dechets_technicien, name='dechets_technicien'),
    path('technicien/dechets-recus/', views.dechets_recus_technicien, name='dechets_recus_technicien'),
    path('technicien/dechets-en-cours/', views.dechets_en_cours_technicien, name='dechets_en_cours_technicien'),
    path('technicien/dechets-valorises/', views.dechets_valorises_technicien, name='dechets_valorises_technicien'),
    path('technicien/demarrer-valorisation/<int:dechet_id>/', views.demarrer_valorisation, name='demarrer_valorisation'),
    path('technicien/valoriser-dechet/<int:dechet_id>/', views.valoriser_dechet_complet, name='valoriser_dechet_complet'),
    
    # URLs pour l'historique des déchets (particuliers)
    path('historique-dechets/', views.historique_dechets, name='historique_dechets'),
]