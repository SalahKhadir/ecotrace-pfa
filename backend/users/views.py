from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404

from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer, 
    LoginSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer
)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vue personnalisée pour obtenir les tokens JWT avec informations utilisateur
    """
    serializer_class = CustomTokenObtainPairSerializer

class LoginView(APIView):
    """
    Vue pour la connexion utilisateur (alternative à JWT)
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'company_name': user.company_name,
                    'dashboard_url': user.get_dashboard_url(),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """
    Vue pour la déconnexion (blacklist du refresh token)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Déconnexion réussie'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Erreur lors de la déconnexion'
            }, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(generics.CreateAPIView):
    """
    Vue pour l'inscription d'un nouvel utilisateur
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Générer les tokens pour l'utilisateur nouvellement créé
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'message': 'Inscription réussie',
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'dashboard_url': user.get_dashboard_url(),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Vue pour consulter et modifier le profil utilisateur
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    """
    Vue pour lister tous les utilisateurs (admin seulement)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Seuls les administrateurs peuvent voir tous les utilisateurs
        if self.request.user.is_administrateur or self.request.user.is_superuser:
            return User.objects.all()
        else:
            # Les autres ne voient que leur propre profil
            return User.objects.filter(id=self.request.user.id)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_access(request, dashboard_type):
    """
    Vue pour vérifier l'accès à un tableau de bord spécifique
    """
    user = request.user
    
    # Vérifier si l'utilisateur peut accéder à ce dashboard
    if user.can_access_dashboard(dashboard_type):
        return Response({
            'access_granted': True,
            'user_role': user.role,
            'dashboard_type': dashboard_type,
            'user_info': {
                'id': user.id,
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'company_name': user.company_name,
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'access_granted': False,
            'message': f'Accès refusé. Votre rôle ({user.get_role_display()}) ne permet pas d\'accéder à ce tableau de bord.',
            'user_role': user.role,
            'required_role': dashboard_type.upper()
        }, status=status.HTTP_403_FORBIDDEN)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard_info(request):
    """
    Vue pour obtenir les informations du tableau de bord de l'utilisateur connecté
    """
    user = request.user
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'role_display': user.get_role_display(),
            'company_name': user.company_name,
            'dashboard_url': user.get_dashboard_url(),
            'phone': user.phone,
            'address': user.address,
        },
        'permissions': {
            'is_particulier': user.is_particulier,
            'is_entreprise': user.is_entreprise,
            'is_transporteur': user.is_transporteur,
            'is_technicien': user.is_technicien,
            'is_administrateur': user.is_administrateur,
            'is_responsable_logistique': user.is_responsable_logistique,
        }
    }, status=status.HTTP_200_OK)