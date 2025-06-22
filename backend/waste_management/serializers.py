from rest_framework import serializers
from django.utils import timezone
from .models import FormulaireCollecte, Collecte, Dechet

class FormulaireCollecteSerializer(serializers.ModelSerializer):
    """
    Serializer pour les formulaires de collecte
    """
    reference = serializers.CharField(read_only=True)
    utilisateur_info = serializers.SerializerMethodField(read_only=True)
    photos = serializers.SerializerMethodField(read_only=True)
    collecte_info = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = FormulaireCollecte
        fields = [
            'id', 'reference', 'utilisateur', 'utilisateur_info',
            'type_dechets', 'description', 'quantite_estimee', 'mode_collecte',
            'date_souhaitee', 'creneau_horaire', 'adresse_collecte', 'telephone',
            'instructions_speciales', 'photo1', 'photo2', 'photo3', 'photos',
            'statut', 'point_collecte', 'horaires_ouverture',
            'date_creation', 'date_modification', 'date_traitement',
            'collecte_info'  # CORRIGÉ: supprimé 'collecte'
        ]
        read_only_fields = [
            'utilisateur', 'reference', 'date_creation', 'date_modification',
            'date_traitement'  # CORRIGÉ: supprimé 'collecte'
        ]
    
    def get_utilisateur_info(self, obj):
        """Informations sur l'utilisateur qui a soumis le formulaire"""
        user = obj.utilisateur
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
        }
    
    def get_photos(self, obj):
        """Liste des URLs des photos"""
        return obj.get_photos()
    
    def get_collecte_info(self, obj):
        """Informations sur la collecte associée"""
        collecte = obj.get_collecte_associee()  # CORRIGÉ: utilise la méthode du modèle
        if collecte:
            return {
                'id': collecte.id,
                'reference': collecte.reference,
                'statut': collecte.statut,
                'date_collecte': collecte.date_collecte,
            }
        return None
    
    def validate_date_souhaitee(self, value):
        """Valider que la date souhaitée n'est pas dans le passé"""
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "La date souhaitée ne peut pas être dans le passé."
            )
        return value
    
    def validate_telephone(self, value):
        """Valider le format du téléphone"""
        # Validation basique du téléphone français
        import re
        if not re.match(r'^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$', value.replace(' ', '')):
            raise serializers.ValidationError(
                "Format de téléphone invalide. Utilisez un format français valide."
            )
        return value
    
    def validate(self, data):
        """Validation personnalisée selon le mode de collecte"""
        mode_collecte = data.get('mode_collecte', 'domicile')
        adresse_collecte = data.get('adresse_collecte', '')
        
        # L'adresse est obligatoire seulement pour la collecte à domicile
        if mode_collecte == 'domicile' and not adresse_collecte:
            raise serializers.ValidationError({
                'adresse_collecte': 'L\'adresse de collecte est obligatoire pour une collecte à domicile.'
            })
        
        return data

class FormulaireCollecteCreateSerializer(serializers.ModelSerializer):
    """
    Serializer simplifié pour la création de formulaires
    """
    class Meta:
        model = FormulaireCollecte
        fields = [
            'type_dechets', 'description', 'quantite_estimee', 'mode_collecte',
            'date_souhaitee', 'creneau_horaire', 'adresse_collecte', 'telephone',
            'instructions_speciales', 'photo1', 'photo2', 'photo3'
        ]
    
    def validate(self, data):
        """Validation personnalisée selon le mode de collecte"""
        mode_collecte = data.get('mode_collecte', 'domicile')
        adresse_collecte = data.get('adresse_collecte', '')
        
        # L'adresse est obligatoire seulement pour la collecte à domicile
        if mode_collecte == 'domicile' and not adresse_collecte:
            raise serializers.ValidationError({
                'adresse_collecte': 'L\'adresse de collecte est obligatoire pour une collecte à domicile.'
            })
        
        return data

class CollecteSerializer(serializers.ModelSerializer):
    """
    Serializer pour les collectes
    """
    reference = serializers.CharField(read_only=True)
    utilisateur_info = serializers.SerializerMethodField(read_only=True)
    transporteur_info = serializers.SerializerMethodField(read_only=True)
    formulaire_info = serializers.SerializerMethodField(read_only=True)
    dechets_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Collecte
        fields = [
            'id', 'reference', 'utilisateur', 'utilisateur_info',
            'formulaire_origine', 'formulaire_info', 'date_collecte', 'date_prevue',
            'mode_collecte', 'statut', 'adresse', 'telephone', 'transporteur',
            'transporteur_info', 'point_collecte', 'dechets_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'utilisateur', 'reference', 'created_at', 'updated_at'
        ]
    
    def get_utilisateur_info(self, obj):
        """Informations sur l'utilisateur"""
        user = obj.utilisateur
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
        }
    
    def get_transporteur_info(self, obj):
        """Informations sur le transporteur assigné"""
        if obj.transporteur:
            user = obj.transporteur
            return {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'company_name': user.company_name,
            }
        return None
    
    def get_formulaire_info(self, obj):
        """Informations sur le formulaire d'origine"""
        if obj.formulaire_origine:
            return {
                'id': obj.formulaire_origine.id,
                'reference': obj.formulaire_origine.reference,
                'type_dechets': obj.formulaire_origine.type_dechets,
                'description': obj.formulaire_origine.description,
            }
        return None
    
    def get_dechets_count(self, obj):
        """Nombre de déchets associés à cette collecte"""
        return obj.dechets.count()

class DechetSerializer(serializers.ModelSerializer):
    """
    Serializer pour les déchets
    """
    collecte_info = serializers.SerializerMethodField(read_only=True)
    technicien_info = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Dechet
        fields = [
            'id', 'type', 'categorie', 'description', 'quantite', 'etat',
            'collecte', 'collecte_info', 'technicien', 'technicien_info',
            'photo_avant', 'photo_apres', 'created_at', 'updated_at', 
            'date_traitement'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_collecte_info(self, obj):
        """Informations sur la collecte"""
        return {
            'id': obj.collecte.id,
            'reference': obj.collecte.reference,
            'date_collecte': obj.collecte.date_collecte,
            'utilisateur_nom': obj.collecte.utilisateur.get_full_name() or obj.collecte.utilisateur.username,
        }
    
    def get_technicien_info(self, obj):
        """Informations sur le technicien"""
        if obj.technicien:
            user = obj.technicien
            return {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        return None

class FormulaireCollecteListSerializer(serializers.ModelSerializer):
    """
    Serializer simplifié pour la liste des formulaires
    """
    utilisateur_nom = serializers.SerializerMethodField()
    photos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FormulaireCollecte
        fields = [
            'id', 'reference', 'utilisateur_nom', 'type_dechets', 'description',
            'mode_collecte', 'date_souhaitee', 'statut', 'photos_count',
            'date_creation'
        ]
    
    def get_utilisateur_nom(self, obj):
        """Nom de l'utilisateur"""
        return obj.utilisateur.get_full_name() or obj.utilisateur.username
    
    def get_photos_count(self, obj):
        """Nombre de photos attachées"""
        return len(obj.get_photos())

class CollecteListSerializer(serializers.ModelSerializer):
    """
    Serializer simplifié pour la liste des collectes
    """
    utilisateur_nom = serializers.SerializerMethodField()
    transporteur_nom = serializers.SerializerMethodField()
    
    class Meta:
        model = Collecte
        fields = [
            'id', 'reference', 'utilisateur_nom', 'date_collecte', 'mode_collecte',
            'statut', 'transporteur_nom', 'created_at'
        ]
    
    def get_utilisateur_nom(self, obj):
        """Nom de l'utilisateur"""
        return obj.utilisateur.get_full_name() or obj.utilisateur.username
    
    def get_transporteur_nom(self, obj):
        """Nom du transporteur"""
        if obj.transporteur:
            return obj.transporteur.get_full_name() or obj.transporteur.username
        return None