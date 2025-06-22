#!/usr/bin/env python
"""
Script simple pour créer des utilisateurs de test EcoTrace
Usage: python create_test_users.py
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from users.models import User

def create_test_users():
    """Créer les utilisateurs de test"""
    
    print("🚀 Création des utilisateurs de test EcoTrace...")
    
    users_data = [
        {
            'username': 'particulier_test',
            'email': 'particulier@test.com',
            'password': 'test123',
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'role': 'PARTICULIER',
            'phone': '0123456789',
            'address': '123 Rue de la Paix, 75001 Paris',
        },
        {
            'username': 'entreprise_test',
            'email': 'entreprise@test.com',
            'password': 'test123',
            'first_name': 'Marie',
            'last_name': 'Martin',
            'role': 'ENTREPRISE',
            'phone': '0123456790',
            'address': '456 Avenue des Entreprises, 69000 Lyon',
            'company_name': 'TechCorp SARL',
            'company_siret': '12345678901234',
        },
        {
            'username': 'transporteur_test',
            'email': 'transporteur@test.com',
            'password': 'test123',
            'first_name': 'Pierre',
            'last_name': 'Dubois',
            'role': 'TRANSPORTEUR',
            'phone': '0123456791',
            'address': '789 Route du Transport, 13000 Marseille',
            'company_name': 'Transport Express',
            'company_siret': '12345678901235',
        },
        {
            'username': 'technicien_test',
            'email': 'technicien@test.com',
            'password': 'test123',
            'first_name': 'Sophie',
            'last_name': 'Legrand',
            'role': 'TECHNICIEN',
            'phone': '0123456792',
            'address': '321 Rue de la Technique, 33000 Bordeaux',
        },
        {
            'username': 'admin_test',
            'email': 'admin@test.com',
            'password': 'test123',
            'first_name': 'Admin',
            'last_name': 'EcoTrace',
            'role': 'ADMINISTRATEUR',
            'phone': '0123456793',
            'address': '654 Boulevard Admin, 75008 Paris',
            'is_staff': True,
        },
        {
            'username': 'logistique_test',
            'email': 'logistique@test.com',
            'password': 'test123',
            'first_name': 'Laurent',
            'last_name': 'Moreau',
            'role': 'RESPONSABLE_LOGISTIQUE',
            'phone': '0123456794',
            'address': '987 Avenue Logistique, 59000 Lille',
        },
    ]
    
    created_count = 0
    
    for user_info in users_data:
        email = user_info['email']
        
        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(email=email).exists():
            print(f"⚠️  Utilisateur {email} existe déjà")
            continue
        
        try:
            # Extraire le mot de passe
            password = user_info.pop('password')
            
            # Créer l'utilisateur
            user = User.objects.create_user(**user_info)
            user.set_password(password)
            user.save()
            
            created_count += 1
            print(f"✅ Créé: {user.email} ({user.get_role_display()})")
            
        except Exception as e:
            print(f"❌ Erreur pour {email}: {e}")
    
    print(f"\n🎉 {created_count} utilisateurs créés avec succès!")
    
    # Afficher le récapitulatif
    print("\n" + "="*60)
    print("📋 COMPTES DE TEST DISPONIBLES")
    print("="*60)
    print("Email                    | Mot de passe | Rôle")
    print("-"*60)
    
    for user_info in users_data:
        role = user_info.get('role', 'UNKNOWN')
        email = user_info.get('email', 'unknown@test.com')
        print(f"{email:24} | test123      | {role}")
    
    print("="*60)
    print("🚀 Vous pouvez maintenant tester la connexion!")

if __name__ == '__main__':
    create_test_users()