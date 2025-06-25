#!/usr/bin/env python
"""
Script to create test notifications for different user roles
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.services import NotificationService

User = get_user_model()

def create_test_notifications():
    """Create test notifications for all user roles"""
    
    # Get users of different roles
    try:
        admin_user = User.objects.filter(role='ADMINISTRATEUR').first()
        if not admin_user:
            print("No ADMINISTRATEUR user found. Creating one...")
            admin_user = User.objects.create_user(
                username='admin_test',
                email='admin@test.com',
                role='ADMINISTRATEUR',
                first_name='Admin',
                last_name='Test'
            )
        
        entreprise_user = User.objects.filter(role='ENTREPRISE').first()
        if not entreprise_user:
            print("No ENTREPRISE user found. Creating one...")
            entreprise_user = User.objects.create_user(
                username='entreprise_test',
                email='entreprise@test.com',
                role='ENTREPRISE',
                first_name='Entreprise',
                last_name='Test'
            )
            
        particulier_user = User.objects.filter(role='PARTICULIER').first()
        if not particulier_user:
            print("No PARTICULIER user found. Creating one...")
            particulier_user = User.objects.create_user(
                username='particulier_test',
                email='particulier@test.com',
                role='PARTICULIER',
                first_name='Particulier',
                last_name='Test'
            )
            
        transporteur_user = User.objects.filter(role='TRANSPORTEUR').first()
        if not transporteur_user:
            print("No TRANSPORTEUR user found. Creating one...")
            transporteur_user = User.objects.create_user(
                username='transporteur_test',
                email='transporteur@test.com',
                role='TRANSPORTEUR',
                first_name='Transporteur',
                last_name='Test'
            )
            
        technicien_user = User.objects.filter(role='TECHNICIEN').first()
        if not technicien_user:
            print("No TECHNICIEN user found. Creating one...")
            technicien_user = User.objects.create_user(
                username='technicien_test',
                email='technicien@test.com',
                role='TECHNICIEN',
                first_name='Technicien',
                last_name='Test'
            )
            
        responsable_user = User.objects.filter(role='RESPONSABLE_LOGISTIQUE').first()
        if not responsable_user:
            print("No RESPONSABLE_LOGISTIQUE user found. Creating one...")
            responsable_user = User.objects.create_user(
                username='responsable_test',
                email='responsable@test.com',
                role='RESPONSABLE_LOGISTIQUE',
                first_name='Responsable',
                last_name='Test'
            )
        
        # Create test notifications using the NotificationService
        
        # For ADMINISTRATEUR
        if admin_user:
            NotificationService.create_notification(
                title="Nouvel utilisateur enregistré",
                message=f"L'utilisateur {entreprise_user.username} s'est inscrit",
                notification_type='info',
                category='utilisateur',
                priority='normal',
                user=admin_user,
                action_url='/dashboard/administrateur?section=utilisateurs'
            )
            
            NotificationService.create_notification(
                title="Nouvelle demande de collecte",
                message="Une nouvelle demande de collecte nécessite votre attention",
                notification_type='info',
                category='demande',
                priority='high',
                user=admin_user,
                action_url='/dashboard/administrateur?section=demandes'
            )
            
            NotificationService.create_notification(
                title="Maintenance système",
                message="Une maintenance est prévue ce soir de 22h à 2h",
                notification_type='warning',
                category='system',
                priority='high',
                user=admin_user
            )
        
        # For ENTREPRISE
        if entreprise_user:
            NotificationService.create_notification(
                title="Collecte assignée",
                message="Votre collecte a été assignée à un transporteur",
                notification_type='success',
                category='collecte',
                priority='normal',
                user=entreprise_user,
                action_url='/dashboard/entreprise?section=collectes'
            )
            
            NotificationService.create_notification(
                title="Demande approuvée",
                message="Votre demande de collecte a été approuvée",
                notification_type='success',
                category='demande',
                priority='normal',
                user=entreprise_user,
                action_url='/dashboard/entreprise?section=formulaires'
            )
        
        # For PARTICULIER
        if particulier_user:
            NotificationService.create_notification(
                title="Collecte programmée",
                message="Votre collecte a été programmée pour demain",
                notification_type='success',
                category='collecte',
                priority='normal',
                user=particulier_user,
                action_url='/dashboard/particulier?section=collectes'
            )
            
            NotificationService.create_notification(
                title="Demande validée",
                message="Votre demande de collecte a été validée",
                notification_type='success',
                category='demande',
                priority='normal',
                user=particulier_user,
                action_url='/dashboard/particulier?section=formulaires'
            )
        
        # For TRANSPORTEUR
        if transporteur_user:
            NotificationService.create_notification(
                title="Nouvelle collecte assignée",
                message="Une nouvelle collecte vous a été assignée",
                notification_type='info',
                category='collecte',
                priority='normal',
                user=transporteur_user,
                action_url='/dashboard/transporteur?section=collectes'
            )
            
            NotificationService.create_notification(
                title="Collecte urgente",
                message="Une collecte urgente nécessite votre attention",
                notification_type='urgent',
                category='collecte',
                priority='urgent',
                user=transporteur_user,
                action_url='/dashboard/transporteur?section=collectes'
            )
        
        # For TECHNICIEN
        if technicien_user:
            NotificationService.create_notification(
                title="Nouveaux déchets à traiter",
                message="De nouveaux déchets sont arrivés pour valorisation",
                notification_type='info',
                category='valorisation',
                priority='normal',
                user=technicien_user,
                action_url='/dashboard/technicien?section=dechets'
            )
            
            NotificationService.create_notification(
                title="Maintenance équipement",
                message="L'équipement A3 nécessite une maintenance",
                notification_type='warning',
                category='system',
                priority='medium',
                user=technicien_user
            )
        
        # For RESPONSABLE_LOGISTIQUE
        if responsable_user:
            NotificationService.create_notification(
                title="Demande de planification",
                message="Une nouvelle demande de planification est disponible",
                notification_type='info',
                category='planification',
                priority='normal',
                user=responsable_user,
                action_url='/dashboard/responsable-logistique?section=planification'
            )
            
            NotificationService.create_notification(
                title="Collecte urgente à planifier",
                message="Une collecte urgente nécessite une planification immédiate",
                notification_type='urgent',
                category='collecte',
                priority='urgent',
                user=responsable_user,
                action_url='/dashboard/responsable-logistique?section=collectes'
            )
        
        print("✅ Test notifications created successfully!")
        print(f"Created notifications for:")
        print(f"- ADMINISTRATEUR: {admin_user.username if admin_user else 'None'}")
        print(f"- ENTREPRISE: {entreprise_user.username if entreprise_user else 'None'}")
        print(f"- PARTICULIER: {particulier_user.username if particulier_user else 'None'}")
        print(f"- TRANSPORTEUR: {transporteur_user.username if transporteur_user else 'None'}")
        print(f"- TECHNICIEN: {technicien_user.username if technicien_user else 'None'}")
        print(f"- RESPONSABLE_LOGISTIQUE: {responsable_user.username if responsable_user else 'None'}")
        
    except Exception as e:
        print(f"❌ Error creating test notifications: {e}")

if __name__ == "__main__":
    create_test_notifications()
