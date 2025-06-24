from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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
    
    def get_parser_classes(self):
        """Choose parser based on action"""
        if self.action in ['approuver', 'rejeter', 'valider']:
            # For admin actions, use JSON parser only
            return [JSONParser]
        # For file uploads (create, update)
        return [MultiPartParser, FormParser, JSONParser]
    
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
    
    @action(detail=True, methods=['post'], parser_classes=[JSONParser])
    def approuver(self, request, pk=None):
        """Approuver une demande (admin seulement)"""
        if not (request.user.is_administrateur or request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée. Seuls les administrateurs peuvent approuver.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        formulaire = self.get_object()
        
        if formulaire.statut != 'SOUMIS':
            return Response(
                {'error': f'Impossible d\'approuver un formulaire avec le statut: {formulaire.get_statut_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour le statut et les informations d'approbation
        formulaire.statut = 'VALIDE'  # ou 'APPROUVE' selon votre modèle
        formulaire.date_validation = timezone.now()
        formulaire.validateur = request.user
        
        # Ajouter les notes d'administration
        notes_admin = request.data.get('notes', '')
        priorite = request.data.get('priorite', 'normale')
        
        if hasattr(formulaire, 'notes_admin'):
            formulaire.notes_admin = notes_admin
        if hasattr(formulaire, 'priorite'):
            formulaire.priorite = priorite
            
        formulaire.save()
        
        serializer = self.get_serializer(formulaire)
        return Response({            'message': 'Demande approuvée avec succès',
            'formulaire': serializer.data
        })
    
    @action(detail=True, methods=['post'], parser_classes=[JSONParser])
    def rejeter(self, request, pk=None):
        """Rejeter un formulaire (admin seulement)"""
        if not (request.user.is_administrateur or request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée. Seuls les administrateurs peuvent rejeter.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        formulaire = self.get_object()
        
        if formulaire.statut != 'SOUMIS':
            return Response(
                {'error': f'Impossible de rejeter un formulaire avec le statut: {formulaire.get_statut_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        motif = request.data.get('motif', 'Aucun motif fourni')
        notes = request.data.get('notes', '')
        
        # Mettre à jour le statut et les informations de rejet
        formulaire.statut = 'REJETE'
        formulaire.date_validation = timezone.now()
        formulaire.validateur = request.user
        
        if hasattr(formulaire, 'motif_rejet'):
            formulaire.motif_rejet = motif
        if hasattr(formulaire, 'notes_admin'):
            formulaire.notes_admin = notes
            
        formulaire.save()
        
        serializer = self.get_serializer(formulaire)
        return Response({
            'message': 'Formulaire rejeté',
            'formulaire': serializer.data,
            'motif': motif
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
    
    def perform_create(self, serializer):
        """Créer une collecte avec gestion de l'utilisateur et du transporteur"""
        # Si un utilisateur spécifique est fourni dans les données, l'utiliser
        # Sinon, utiliser l'utilisateur connecté par défaut
        utilisateur_id = self.request.data.get('utilisateur')
        if utilisateur_id:
            try:
                from users.models import User
                utilisateur = User.objects.get(id=utilisateur_id)
                collecte = serializer.save(utilisateur=utilisateur)
            except User.DoesNotExist:
                collecte = serializer.save(utilisateur=self.request.user)
        else:
            collecte = serializer.save(utilisateur=self.request.user)
        
        # Update the related formulaire status to EN_COURS
        if collecte.formulaire_origine:
            formulaire = collecte.formulaire_origine
            formulaire.statut = 'EN_COURS'
            formulaire.save()

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
        
        # Si le transporteur termine la collecte, créer automatiquement les déchets
        if nouveau_statut == 'TERMINEE' and request.user == collecte.transporteur:
            self._creer_dechets_automatiquement(collecte, request.data)
        
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
    
    def _creer_dechets_automatiquement(self, collecte, data):
        """Créer automatiquement les déchets basés sur le formulaire de collecte"""
        from .models import Dechet
        
        if collecte.formulaire_origine:
            formulaire = collecte.formulaire_origine
            
            # Utiliser les informations du formulaire pour créer les déchets
            quantite_estimee = data.get('quantite_reelle', formulaire.quantite_estimee)
            
            # Convertir la quantité textuelle en nombre si nécessaire
            if isinstance(quantite_estimee, str):
                if '1-5kg' in quantite_estimee:
                    quantite = 3.0  # moyenne
                elif '5-10kg' in quantite_estimee:
                    quantite = 7.5
                elif '10-20kg' in quantite_estimee:
                    quantite = 15.0
                elif '20kg+' in quantite_estimee:
                    quantite = 25.0
                else:
                    quantite = 5.0  # défaut
            else:
                quantite = float(quantite_estimee) if quantite_estimee else 5.0
            
            # Créer le déchet principal
            Dechet.objects.create(
                type=formulaire.type_dechets,
                categorie=formulaire.type_dechets,
                description=f"Collecte {collecte.reference} - {formulaire.description}",
                quantite=quantite,
                etat='COLLECTE',
                collecte=collecte
            )
            
            # Si des déchets supplémentaires sont spécifiés dans les données
            dechets_supplementaires = data.get('dechets_supplementaires', [])
            for dechet_data in dechets_supplementaires:
                Dechet.objects.create(
                    type=dechet_data.get('type', 'autres'),
                    categorie=dechet_data.get('categorie', 'divers'),
                    description=dechet_data.get('description', ''),
                    quantite=float(dechet_data.get('quantite', 1.0)),
                    etat='COLLECTE',
                    collecte=collecte
                )
    
    @action(detail=False, methods=['get'])
    def mes_collectes(self, request):
        """Obtenir les collectes de l'utilisateur connecté"""
        collectes = Collecte.objects.filter(
            utilisateur=request.user
        ).order_by('-date_collecte')
        
        serializer = CollecteListSerializer(collectes, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle collecte"""
        if not (request.user.is_administrateur or request.user.is_responsable_logistique):
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)

class DechetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les déchets collectés
    """
    serializer_class = DechetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        
        if user.is_administrateur or user.is_responsable_logistique:
            # Admin et responsable logistique voient tous les déchets
            return Dechet.objects.all().select_related('collecte', 'technicien')
        elif user.is_technicien:
            # Technicien voit les déchets non assignés et ses déchets assignés
            return Dechet.objects.filter(
                Q(technicien__isnull=True) | Q(technicien=user)
            ).select_related('collecte')
        elif user.is_transporteur:
            # Transporteur voit les déchets de ses collectes
            return Dechet.objects.filter(
                collecte__transporteur=user
            ).select_related('collecte')
        else:
            # Particuliers et entreprises voient les déchets de leurs collectes
            return Dechet.objects.filter(
                collecte__utilisateur=user
            ).select_related('collecte', 'technicien')
    
    @action(detail=True, methods=['post'])
    def assigner_technicien(self, request, pk=None):
        """Assigner un technicien à un déchet (admin ou technicien)"""
        dechet = self.get_object()
        
        if request.user.is_technicien:
            # Le technicien s'assigne lui-même
            technicien = request.user
        elif request.user.is_administrateur or request.user.is_responsable_logistique:
            # Admin assigne un technicien spécifique
            technicien_id = request.data.get('technicien_id')
            if not technicien_id:
                return Response(
                    {'error': 'ID du technicien requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from users.models import User
            technicien = get_object_or_404(
                User.objects.filter(role='TECHNICIEN'),
                id=technicien_id
            )
        else:
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        dechet.technicien = technicien
        dechet.etat = 'TRI'
        dechet.save()
        
        serializer = self.get_serializer(dechet)
        return Response({
            'message': f'Technicien {technicien.get_full_name()} assigné au déchet',
            'dechet': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def valoriser(self, request, pk=None):
        """Valoriser un déchet (technicien seulement)"""
        dechet = self.get_object()
        
        if not request.user.is_technicien:
            return Response(
                {'error': 'Seuls les techniciens peuvent valoriser les déchets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if dechet.technicien != request.user:
            return Response(
                {'error': 'Vous ne pouvez valoriser que vos déchets assignés'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        nouvel_etat = request.data.get('etat')
        if nouvel_etat not in ['TRI', 'A_RECYCLER', 'RECYCLE', 'A_DETRUIRE', 'DETRUIT']:
            return Response(
                {'error': 'État invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Valoriser le déchet
        dechet.valoriser(request.user, nouvel_etat)
        
        serializer = self.get_serializer(dechet)
        return Response({
            'message': f'Déchet valorisé: {dechet.get_etat_display()}',
            'dechet': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def mes_dechets(self, request):
        """Récupérer les déchets du technicien connecté"""
        if not request.user.is_technicien:
            return Response(
                {'error': 'Accès refusé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        dechets = Dechet.objects.filter(
            technicien=request.user
        ).select_related('collecte')
        
        serializer = self.get_serializer(dechets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Récupérer les déchets disponibles pour assignation"""
        if not request.user.is_technicien:
            return Response(
                {'error': 'Accès refusé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        dechets = Dechet.objects.filter(
            technicien__isnull=True,
            etat='COLLECTE'
        ).select_related('collecte')
        
        serializer = self.get_serializer(dechets, many=True)
        return Response(serializer.data)
        
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """
    Statistiques pour le tableau de bord selon le rôle
    """
    
    stats = {}
    user = request.user
    
    if user.is_particulier or user.is_entreprise:
        # Stats pour particuliers et entreprises
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
        # Stats pour transporteurs - CORRIGÉ
        stats = {
            'formulaires_a_verifier': FormulaireCollecte.objects.filter(
                statut__in=['VALIDE', 'EN_COURS']
            ).count(),
            'collectes_assignees': Collecte.objects.filter(
                transporteur=user
            ).count(),
            'collectes_en_attente': Collecte.objects.filter(
                transporteur=user, statut='PLANIFIEE'
            ).count(),
            'collectes_terminees': Collecte.objects.filter(
                transporteur=user, statut='TERMINEE'
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
        # Stats pour admins et responsables logistique
        from users.models import User
        
        stats = {
            'total_utilisateurs': User.objects.count(),
            'demandes_en_attente': FormulaireCollecte.objects.filter(statut='SOUMIS').count(),
            'collectes_planifiees': Collecte.objects.filter(statut='PLANIFIEE').count(),
            'sous_traitants_actifs': User.objects.filter(
                role__in=['TRANSPORTEUR', 'TECHNICIEN'], is_active=True
            ).count(),
            'formulaires_total': FormulaireCollecte.objects.count(),
            'collectes_total': Collecte.objects.count(),
            'collectes_en_cours': Collecte.objects.filter(statut='EN_COURS').count(),
            'dechets_total': Dechet.objects.count(),
        }
    
    else:
        stats = {}
    
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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def collectes_transporteur(request):
    """
    Récupère les collectes assignées au transporteur connecté
    """
    user = request.user
    
    if not user.is_transporteur:
        return Response(
            {'error': 'Accès refusé. Seuls les transporteurs peuvent accéder à cette ressource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer toutes les collectes assignées à ce transporteur
    collectes = Collecte.objects.filter(transporteur=user).select_related(
        'utilisateur', 
        'formulaire_origine'
    ).prefetch_related('dechets')
    
    # Organiser les données par statut
    collectes_data = {
        'assignees': [],
        'en_cours': [],
        'terminees': []
    }
    
    for collecte in collectes:
        collecte_info = {
            'id': collecte.id,
            'reference': collecte.reference,
            'date_collecte': collecte.date_collecte,
            'statut': collecte.statut,
            'statut_display': collecte.get_statut_display(),
            'adresse': collecte.adresse,
            'telephone': collecte.telephone,
            'utilisateur': {
                'id': collecte.utilisateur.id,
                'nom': collecte.utilisateur.get_full_name() or collecte.utilisateur.username,
                'email': collecte.utilisateur.email,
                'role': collecte.utilisateur.role
            },
            'formulaire_origine': None
        }
        
        # Ajouter les informations du formulaire d'origine si disponible
        if collecte.formulaire_origine:
            form = collecte.formulaire_origine
            collecte_info['formulaire_origine'] = {
                'id': form.id,
                'reference': form.reference,
                'type_dechets': form.type_dechets,
                'description': form.description,
                'quantite_estimee': form.quantite_estimee,
                'mode_collecte': form.mode_collecte,
                'date_souhaitee': form.date_souhaitee,
                'statut': form.statut
            }
        
        # Classer par statut
        if collecte.statut == 'PLANIFIEE':
            collectes_data['assignees'].append(collecte_info)
        elif collecte.statut == 'EN_COURS':
            collectes_data['en_cours'].append(collecte_info)
        elif collecte.statut == 'TERMINEE':
            collectes_data['terminees'].append(collecte_info)
    
    return Response(collectes_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def formulaires_a_verifier(request):
    """
    Récupère les formulaires de collecte que le transporteur doit vérifier
    """
    user = request.user
    
    if not user.is_transporteur:
        return Response(
            {'error': 'Accès refusé. Seuls les transporteurs peuvent accéder à cette ressource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les formulaires des collectes assignées à ce transporteur
    collectes_assignees = Collecte.objects.filter(transporteur=user).values_list('formulaire_origine', flat=True)
    
    formulaires = FormulaireCollecte.objects.filter(
        id__in=collectes_assignees
    ).select_related('utilisateur')
    
    formulaires_data = []
    for form in formulaires:
        # Récupérer la collecte associée
        collecte_associee = Collecte.objects.filter(formulaire_origine=form, transporteur=user).first()
        
        formulaire_info = {
            'id': form.id,
            'reference': form.reference,
            'type_dechets': form.type_dechets,
            'description': form.description,
            'quantite_estimee': form.quantite_estimee,
            'mode_collecte': form.mode_collecte,
            'date_souhaitee': form.date_souhaitee,
            'creneau_horaire': form.creneau_horaire,
            'adresse_collecte': form.adresse_collecte,
            'telephone': form.telephone,
            'instructions_speciales': form.instructions_speciales,
            'statut': form.statut,
            'date_creation': form.date_creation,
            'utilisateur_info': {
                'id': form.utilisateur.id,
                'first_name': form.utilisateur.first_name,
                'last_name': form.utilisateur.last_name,
                'email': form.utilisateur.email,
                'username': form.utilisateur.username,
                'role': form.utilisateur.role,
            },
            'photos': form.get_photos(),
            'collecte': None
        }
        
        # Ajouter les infos de la collecte si elle existe
        if collecte_associee:
            formulaire_info['collecte'] = {
                'id': collecte_associee.id,
                'reference': collecte_associee.reference,
                'date_collecte': collecte_associee.date_collecte,
                'statut': collecte_associee.statut,
                'adresse': collecte_associee.adresse,
                'telephone': collecte_associee.telephone
            }
        
        formulaires_data.append(formulaire_info)
    
    return Response(formulaires_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dechets_technicien(request):
    """
    Récupère les déchets pour le technicien connecté
    """
    user = request.user
    
    if not user.is_technicien:
        return Response(
            {'error': 'Accès refusé. Seuls les techniciens peuvent accéder à cette ressource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Organiser les déchets par statut
    dechets_data = {
        'nouveau': [],  # Déchets non assignés
        'en_cours': [],  # Déchets assignés au technicien
        'termines': []   # Déchets valorisés par le technicien
    }
    
    # Déchets non assignés (disponibles)
    dechets_disponibles = Dechet.objects.filter(
        technicien__isnull=True,
        etat='COLLECTE'
    ).select_related('collecte', 'collecte__utilisateur', 'collecte__formulaire_origine')
    
    # Déchets assignés au technicien
    mes_dechets = Dechet.objects.filter(
        technicien=user
    ).select_related('collecte', 'collecte__utilisateur', 'collecte__formulaire_origine')
    
    # Traiter les déchets disponibles
    for dechet in dechets_disponibles:
        collecte = dechet.collecte
        dechets_data['nouveau'].append({
            'id': dechet.id,
            'type': dechet.type,
            'categorie': dechet.categorie,
            'description': dechet.description,
            'quantite': dechet.quantite,
            'etat': dechet.etat,
            'etat_display': dechet.get_etat_display(),
            'created_at': dechet.created_at,
            'collecte': {
                'id': collecte.id,
                'reference': collecte.reference,
                'date_collecte': collecte.date_collecte,
                'utilisateur': {
                    'nom': collecte.utilisateur.get_full_name() or collecte.utilisateur.username,
                    'email': collecte.utilisateur.email
                }
            }
        })
    
    # Traiter mes déchets
    for dechet in mes_dechets:
        collecte = dechet.collecte
        dechet_info = {
            'id': dechet.id,
            'type': dechet.type,
            'categorie': dechet.categorie,
            'description': dechet.description,
            'quantite': dechet.quantite,
            'etat': dechet.etat,
            'etat_display': dechet.get_etat_display(),
            'created_at': dechet.created_at,
            'date_traitement': dechet.date_traitement,
            'collecte': {
                'id': collecte.id,
                'reference': collecte.reference,
                'date_collecte': collecte.date_collecte,
                'utilisateur': {
                    'nom': collecte.utilisateur.get_full_name() or collecte.utilisateur.username,
                    'email': collecte.utilisateur.email
                }
            }
        }
        
        if dechet.etat in ['RECYCLE', 'DETRUIT']:
            dechets_data['termines'].append(dechet_info)
        else:
            dechets_data['en_cours'].append(dechet_info)
    
    return Response(dechets_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def historique_dechets(request):
    """
    Récupère l'historique des déchets pour le particulier connecté
    """
    user = request.user
    
    # Récupérer tous les déchets des collectes de l'utilisateur
    dechets = Dechet.objects.filter(
        collecte__utilisateur=user
    ).select_related('collecte', 'technicien').order_by('-created_at')
    
    dechets_data = []
    for dechet in dechets:
        collecte = dechet.collecte
        dechets_data.append({
            'id': dechet.id,
            'type': dechet.type,
            'categorie': dechet.categorie,
            'description': dechet.description,
            'quantite': dechet.quantite,
            'etat': dechet.etat,
            'etat_display': dechet.get_etat_display(),
            'created_at': dechet.created_at,
            'date_traitement': dechet.date_traitement,
            'collecte': {
                'id': collecte.id,
                'reference': collecte.reference,
                'date_collecte': collecte.date_collecte
            },
            'technicien': {
                'nom': dechet.technicien.get_full_name() if dechet.technicien else None,
                'email': dechet.technicien.email if dechet.technicien else None
            } if dechet.technicien else None
        })
    
    return Response(dechets_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dechets_recus_technicien(request):
    """
    Récupère les déchets des collectes terminées disponibles pour valorisation
    """
    user = request.user
    
    if not user.is_technicien:
        return Response(
            {'error': 'Accès refusé. Seuls les techniciens peuvent accéder à cette ressource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les déchets des collectes terminées qui ne sont pas encore traités
    dechets_recus = Dechet.objects.filter(
        collecte__statut='TERMINEE',  # Collecte livrée par le transporteur
        etat='COLLECTE',  # Déchet pas encore traité
        technicien__isnull=True  # Pas encore assigné à un technicien
    ).select_related(
        'collecte__utilisateur',
        'collecte__transporteur'
    ).order_by('-collecte__date_prevue')
    
    # Serializer les données
    dechets_data = []
    for dechet in dechets_recus:
        collecte = dechet.collecte
        dechet_info = {
            'id': dechet.id,
            'type': dechet.type,
            'categorie': dechet.categorie,
            'description': dechet.description,
            'quantite': dechet.quantite,
            'etat': dechet.etat,
            'etat_display': dechet.get_etat_display(),
            'photo_avant': dechet.photo_avant.url if dechet.photo_avant else None,
            'collecte': {
                'id': collecte.id,
                'reference': collecte.reference,
                'date_collecte': collecte.date_collecte,
                'date_prevue': collecte.date_prevue,
                'adresse': collecte.adresse,
                'utilisateur': {
                    'nom': collecte.utilisateur.get_full_name() or collecte.utilisateur.username,
                    'role': collecte.utilisateur.role,
                    'company_name': getattr(collecte.utilisateur, 'company_name', None)
                },
                'transporteur': {
                    'nom': collecte.transporteur.get_full_name() or collecte.transporteur.username if collecte.transporteur else 'N/A'
                }
            },
            'date_reception': collecte.updated_at,  # Date de dernière mise à jour (livraison)
        }
        dechets_data.append(dechet_info)
    
    return Response({
        'dechets': dechets_data,
        'total': len(dechets_data),
        'status': 'success'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def demarrer_valorisation(request, dechet_id):
    """
    Démarre le processus de valorisation d'un déchet par un technicien
    """
    user = request.user
    
    if not user.is_technicien:
        return Response(
            {'error': 'Accès refusé. Seuls les techniciens peuvent valoriser.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        dechet = Dechet.objects.get(
            id=dechet_id,
            collecte__statut='TERMINEE',  # Collecte doit être terminée
            etat='COLLECTE',  # Déchet pas encore traité
            technicien__isnull=True  # Pas encore assigné
        )
    except Dechet.DoesNotExist:
        return Response(
            {'error': 'Déchet non trouvé ou non disponible pour valorisation.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Assigner le technicien et changer l'état
    dechet.technicien = user
    dechet.etat = 'TRI'  # Commence le tri
    dechet.save()
    
    return Response({
        'message': 'Valorisation démarrée avec succès',
        'dechet': {
            'id': dechet.id,
            'type': dechet.type,
            'etat': dechet.etat,
            'technicien': user.get_full_name() or user.username
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def valoriser_dechet_complet(request, dechet_id):
    """
    Finalise la valorisation d'un déchet avec le formulaire de valorisation
    """
    user = request.user
    
    if not user.is_technicien:
        return Response(
            {'error': 'Accès refusé. Seuls les techniciens peuvent valoriser.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        dechet = Dechet.objects.get(
            id=dechet_id,
            technicien=user,  # Doit être assigné au technicien connecté
            etat='TRI'  # Doit être en cours de tri
        )
    except Dechet.DoesNotExist:
        return Response(
            {'error': 'Déchet non trouvé ou non autorisé.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Récupérer les données du formulaire
    type_valorisation = request.data.get('type_valorisation')  # 'A_RECYCLER' ou 'A_DETRUIRE'
    quantite_valorisee = request.data.get('quantite_valorisee')
    rendement = request.data.get('rendement')
    methode_valorisation = request.data.get('methode_valorisation')
    notes_technicien = request.data.get('notes_technicien')
    photo_apres = request.FILES.get('photo_apres')
    
    # Validations
    if not type_valorisation or type_valorisation not in ['A_RECYCLER', 'A_DETRUIRE']:
        return Response(
            {'error': 'Type de valorisation requis (A_RECYCLER ou A_DETRUIRE)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not quantite_valorisee or float(quantite_valorisee) <= 0:
        return Response(
            {'error': 'Quantité valorisée requise et doit être positive'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if float(quantite_valorisee) > dechet.quantite:
        return Response(
            {'error': 'Quantité valorisée ne peut pas dépasser la quantité collectée'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mettre à jour le déchet
    dechet.etat = type_valorisation
    dechet.quantite = float(quantite_valorisee)  # Quantité effective valorisée
    dechet.date_traitement = timezone.now()
    
    if photo_apres:
        dechet.photo_apres = photo_apres
    
    # Ajouter les notes dans la description (ou créer un nouveau champ si nécessaire)
    valorisation_info = f"""
VALORISATION EFFECTUÉE LE {timezone.now().strftime('%d/%m/%Y à %H:%M')}
Technicien: {user.get_full_name() or user.username}
Méthode: {methode_valorisation or 'Non spécifiée'}
Rendement: {rendement or 'Non spécifié'}%
Quantité valorisée: {quantite_valorisee} kg sur {dechet.quantite} kg collectées
Notes: {notes_technicien or 'Aucune note'}
---
{dechet.description or ''}
    """.strip()
    
    dechet.description = valorisation_info
    dechet.save()
    
    return Response({
        'message': 'Valorisation finalisée avec succès',
        'dechet': {
            'id': dechet.id,
            'type': dechet.type,
            'etat': dechet.etat,
            'etat_display': dechet.get_etat_display(),
            'quantite_valorisee': quantite_valorisee,
            'date_traitement': dechet.date_traitement,
            'technicien': user.get_full_name() or user.username
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dechets_en_cours_technicien(request):
    """
    Récupère les déchets en cours de traitement par le technicien connecté
    """
    user = request.user
    
    if not user.is_technicien:
        return Response(
            {'error': 'Accès refusé. Seuls les techniciens peuvent accéder à cette ressource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les déchets en cours de traitement par ce technicien
    dechets_en_cours = Dechet.objects.filter(
        technicien=user,
        etat='TRI'  # En cours de tri
    ).select_related('collecte__utilisateur').order_by('-updated_at')
    
    serializer = DechetSerializer(dechets_en_cours, many=True)
    return Response({
        'dechets': serializer.data,
        'total': len(serializer.data)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dechets_valorises_technicien(request):
    """
    Récupère l'historique des déchets valorisés par le technicien connecté
    """
    user = request.user
    
    if not user.is_technicien:
        return Response(
            {'error': 'Accès refusé. Seuls les techniciens peuvent accéder à cette ressource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les déchets valorisés par ce technicien
    dechets_valorises = Dechet.objects.filter(
        technicien=user,
        etat__in=['A_RECYCLER', 'RECYCLE', 'A_DETRUIRE', 'DETRUIT']
    ).select_related('collecte__utilisateur').order_by('-date_traitement')
    
    serializer = DechetSerializer(dechets_valorises, many=True)
    return Response({
        'dechets': serializer.data,
        'total': len(serializer.data)
    })