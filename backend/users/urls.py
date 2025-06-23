from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'users'

# Router for ViewSets
router = DefaultRouter()
router.register(r'manage', views.UserManagementViewSet, basename='user_management')

urlpatterns = [
    # ViewSet URLs
    path('', include(router.urls)),
    
    # Authentification JWT (accessible both at /api/auth/ and /api/users/auth/)
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Auth endpoints with auth/ prefix for legacy compatibility
    path('auth/login/', views.LoginView.as_view(), name='auth_login'),
    path('auth/logout/', views.LogoutView.as_view(), name='auth_logout'),
    path('auth/register/', views.RegisterView.as_view(), name='auth_register'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='auth_token_obtain_pair'),
    
    # Profil utilisateur
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('dashboard-info/', views.user_dashboard_info, name='dashboard_info'),
    
    # Gestion des utilisateurs (admin)
    path('users/', views.UserListView.as_view(), name='user_list'),
    
    # Vérification d'accès aux dashboards
    path('dashboard-access/<str:dashboard_type>/', views.dashboard_access, name='dashboard_access'),
]