from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.conf import settings

from .models import FormulaireCollecte, Collecte, Dechet
from .serializers import (
    FormulaireCollecteSerializer, FormulaireCollecteCreateSerializer,
    FormulaireCollecteListSerializer, CollecteSerializer, CollecteListSerializer,
    DechetSerializer
)

class FormulaireCollecteViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les formulaires de collecte
    """
    serializer_class = FormulaireCollecteSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Pour supporter l'upload de fichiers
    
    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        
        if user.is_administrateur or user.is_responsable_logistique:
            # Admin et responsable logistique voient tout
            return FormulaireCollecte.objects.all().select_related('utilisateur')  # CORRIGÉ: supprimé 'collecte'
        elif user.is_transporteur:
            # Transporteur voit les formulaires validés
            return FormulaireCollecte.objects.filter(
                statut__in=['VALIDE', 'EN_COURS']
            ).select_related('utilisateur')  # CORRIGÉ: supprimé 'collecte'
        else:
            # Particuliers et entreprises voient seulement leurs formulaires
            return FormulaireCollecte.objects.filter(
                utilisateur=user
            )  # CORRIGÉ: supprimé select_related pour ce cas simple
    
    def get_serializer_class(self):
        """Choisir le serializer selon l'action"""
        if self.action == 'list':
            return FormulaireCollecteListSerializer
        elif self.action == 'create':
            return FormulaireCollecteCreateSerializer
        return FormulaireCollecteSerializer
    
    def perform_create(self, serializer):
        """Créer un formulaire avec l'utilisateur connecté"""
        serializer.save(utilisateur=self.request.user)
    
    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Valider un formulaire (admin seulement)"""
        if not (request.user.is_administrateur or request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée. Seuls les administrateurs peuvent valider.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        formulaire = self.get_object()
        
        if formulaire.statut != 'SOUMIS':
            return Response(
                {'error': f'Impossible de valider un formulaire avec le statut: {formulaire.get_statut_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Informations du point de collecte pour apport volontaire
        point_collecte = request.data.get('point_collecte', '')
        horaires_ouverture = request.data.get('horaires_ouverture', '')
        
        if formulaire.mode_collecte == 'apport':
            formulaire.point_collecte = point_collecte
            formulaire.horaires_ouverture = horaires_ouverture
        
        formulaire.valider()
        
        serializer = self.get_serializer(formulaire)
        return Response({
            'message': 'Formulaire validé avec succès',
            'formulaire': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        """Rejeter un formulaire (admin seulement)"""
        if not (request.user.is_administrateur or request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée. Seuls les administrateurs peuvent rejeter.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        formulaire = self.get_object()
        raison = request.data.get('raison', 'Aucune raison fournie')
        
        formulaire.rejeter(raison)
        
        serializer = self.get_serializer(formulaire)
        return Response({
            'message': 'Formulaire rejeté',
            'formulaire': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def mes_formulaires(self, request):
        """Obtenir les formulaires de l'utilisateur connecté"""
        formulaires = FormulaireCollecte.objects.filter(
            utilisateur=request.user
        ).order_by('-date_creation')
        
        serializer = FormulaireCollecteListSerializer(formulaires, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques des formulaires (admin seulement)"""
        if not (request.user.is_administrateur or request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total = FormulaireCollecte.objects.count()
        soumis = FormulaireCollecte.objects.filter(statut='SOUMIS').count()
        valides = FormulaireCollecte.objects.filter(statut='VALIDE').count()
        rejetes = FormulaireCollecte.objects.filter(statut='REJETE').count()
        
        return Response({
            'total': total,
            'soumis': soumis,
            'valides': valides,
            'rejetes': rejetes,
            'en_attente': soumis,  # Alias
        })

class CollecteViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les collectes
    """
    serializer_class = CollecteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        
        if user.is_administrateur or user.is_responsable_logistique:
            # Admin et responsable logistique voient tout
            return Collecte.objects.all().select_related('utilisateur', 'transporteur', 'formulaire_origine')
        elif user.is_transporteur:
            # Transporteur voit les collectes qui lui sont assignées ou disponibles
            return Collecte.objects.filter(
                Q(transporteur=user) | Q(transporteur__isnull=True, statut='PLANIFIEE')
            ).select_related('utilisateur', 'formulaire_origine')
        else:
            # Particuliers et entreprises voient seulement leurs collectes
            return Collecte.objects.filter(
                utilisateur=user
            ).select_related('transporteur', 'formulaire_origine')
    
    def get_serializer_class(self):
        """Choisir le serializer selon l'action"""
        if self.action == 'list':
            return CollecteListSerializer
        return CollecteSerializer
    
    @action(detail=True, methods=['post'])
    def assigner_transporteur(self, request, pk=None):
        """Assigner un transporteur à une collecte (admin ou transporteur)"""
        collecte = self.get_object()
        
        if request.user.is_transporteur:
            # Le transporteur s'assigne lui-même
            transporteur = request.user
        elif request.user.is_administrateur or request.user.is_responsable_logistique:
            # Admin assigne un transporteur spécifique
            transporteur_id = request.data.get('transporteur_id')
            if not transporteur_id:
                return Response(
                    {'error': 'ID du transporteur requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Importer le modèle User correctement
            from users.models import User
            transporteur = get_object_or_404(
                User.objects.filter(role='TRANSPORTEUR'),
                id=transporteur_id
            )
        else:
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        collecte.transporteur = transporteur
        collecte.save()
        
        serializer = self.get_serializer(collecte)
        return Response({
            'message': 'Transporteur assigné avec succès',
            'collecte': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """Changer le statut d'une collecte"""
        collecte = self.get_object()
        nouveau_statut = request.data.get('statut')
        
        # Vérifier les permissions
        if not (request.user == collecte.transporteur or 
                request.user.is_administrateur or 
                request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if collecte.mettre_a_jour_statut(nouveau_statut):
            serializer = self.get_serializer(collecte)
            return Response({
                'message': f'Statut mis à jour: {collecte.get_statut_display()}',
                'collecte': serializer.data
            })
        else:
            return Response(
                {'error': 'Statut invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def mes_collectes(self, request):
        """Obtenir les collectes de l'utilisateur connecté"""
        collectes = Collecte.objects.filter(
            utilisateur=request.user
        ).order_by('-date_collecte')
        
        serializer = CollecteListSerializer(collectes, many=True)
        return Response(serializer.data)

class DechetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les déchets
    """
    serializer_class = DechetSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        
        if user.is_administrateur or user.is_responsable_logistique:
            # Admin et responsable logistique voient tout
            return Dechet.objects.all().select_related('collecte__utilisateur', 'technicien')
        elif user.is_technicien:
            # Technicien voit tous les déchets à traiter
            return Dechet.objects.all().select_related('collecte__utilisateur')
        elif user.is_transporteur:
            # Transporteur voit les déchets des collectes qui lui sont assignées
            return Dechet.objects.filter(
                collecte__transporteur=user
            ).select_related('collecte__utilisateur', 'technicien')
        else:
            # Particuliers et entreprises voient les déchets de leurs collectes
            return Dechet.objects.filter(
                collecte__utilisateur=user
            ).select_related('collecte', 'technicien')
    
    @action(detail=True, methods=['post'])
    def valoriser(self, request, pk=None):
        """Valoriser un déchet (technicien seulement)"""
        if not request.user.is_technicien:
            return Response(
                {'error': 'Seuls les techniciens peuvent valoriser les déchets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        dechet = self.get_object()
        nouvel_etat = request.data.get('etat')
        
        if nouvel_etat not in dict(Dechet.ETAT_CHOICES):
            return Response(
                {'error': 'État invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dechet.valoriser(request.user, nouvel_etat)
        
        serializer = self.get_serializer(dechet)
        return Response({
            'message': f'Déchet valorisé: {dechet.get_etat_display()}',
            'dechet': serializer.data
        })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """
    Statistiques pour le dashboard selon le rôle
    """
    user = request.user
    stats = {}
    
    if user.is_particulier or user.is_entreprise:
        # Stats pour particuliers/entreprises
        stats = {
            'formulaires_total': FormulaireCollecte.objects.filter(utilisateur=user).count(),
            'formulaires_en_attente': FormulaireCollecte.objects.filter(
                utilisateur=user, statut='SOUMIS'
            ).count(),
            'collectes_total': Collecte.objects.filter(utilisateur=user).count(),
            'collectes_en_cours': Collecte.objects.filter(
                utilisateur=user, statut='EN_COURS'
            ).count(),
            'collectes_terminees': Collecte.objects.filter(
                utilisateur=user, statut='TERMINEE'
            ).count(),
        }
    
    elif user.is_transporteur:
        # Stats pour transporteurs
        stats = {
            'collectes_assignees': Collecte.objects.filter(transporteur=user).count(),
            'collectes_en_cours': Collecte.objects.filter(
                transporteur=user, statut='EN_COURS'
            ).count(),
            'collectes_disponibles': Collecte.objects.filter(
                transporteur__isnull=True, statut='PLANIFIEE'
            ).count(),
        }
    
    elif user.is_technicien:
        # Stats pour techniciens
        stats = {
            'dechets_total': Dechet.objects.count(),
            'dechets_en_attente': Dechet.objects.filter(etat='COLLECTE').count(),
            'dechets_en_cours': Dechet.objects.filter(etat='TRI').count(),
            'dechets_traites': Dechet.objects.filter(technicien=user).count(),
        }
    
    elif user.is_administrateur or user.is_responsable_logistique:
        # Stats pour admins
        stats = {
            'formulaires_total': FormulaireCollecte.objects.count(),
            'formulaires_en_attente': FormulaireCollecte.objects.filter(statut='SOUMIS').count(),
            'collectes_total': Collecte.objects.count(),
            'collectes_planifiees': Collecte.objects.filter(statut='PLANIFIEE').count(),
            'collectes_en_cours': Collecte.objects.filter(statut='EN_COURS').count(),
            'dechets_total': Dechet.objects.count(),
        }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def points_collecte(request):
    """
    Liste des points de collecte pour l'apport volontaire
    """
    # Points de collecte statiques (à terme, cela pourrait venir d'une DB)
    points = [
        {
            'nom': 'EcoPoint Centre-Ville',
            'adresse': '15 Rue de la République, 75001 Paris',
            'horaires': 'Lun-Ven: 9h-18h, Sam: 9h-16h',
            'telephone': '01 23 45 67 89',
            'types_acceptes': ['ordinateur', 'smartphone', 'composants']
        },
        {
            'nom': 'Centre de Tri Nord',
            'adresse': '42 Avenue du Recyclage, 75018 Paris',
            'horaires': 'Mar-Sam: 8h-17h',
            'telephone': '01 98 76 54 32',
            'types_acceptes': ['electromenager', 'televiseur', 'autres']
        },
        {
            'nom': 'Déchetterie Municipale',
            'adresse': '8 Boulevard de l\'Environnement, 75012 Paris',
            'horaires': 'Lun-Dim: 8h-19h',
            'telephone': '01 11 22 33 44',
            'types_acceptes': ['ordinateur', 'smartphone', 'electromenager', 'televiseur', 'composants', 'autres']
        }
    ]
    
    return Response(points)