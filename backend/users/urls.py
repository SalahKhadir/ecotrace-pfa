from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Authentification JWT
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Alternative avec JWT direct
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Profil utilisateur
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('dashboard-info/', views.user_dashboard_info, name='dashboard_info'),
    
    # Gestion des utilisateurs (admin)
    path('users/', views.UserListView.as_view(), name='user_list'),
    
    # Vérification d'accès aux dashboards
    path('dashboard-access/<str:dashboard_type>/', views.dashboard_access, name='dashboard_access'),
]