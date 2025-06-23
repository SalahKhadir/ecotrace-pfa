#!/usr/bin/env python
"""
Script to create sample transporteur users for testing
"""
import os
import sys
import django

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from users.models import User

def create_transporteurs():
    """Create sample transporteur users"""
    
    transporteurs_data = [
        {
            'username': 'transport1',
            'email': 'transport1@ecotrace.com',
            'first_name': 'Jean',
            'last_name': 'Transporteur',
            'role': 'TRANSPORTEUR',
            'phone': '0123456789',
            'company_name': 'Transport Express',
        },
        {
            'username': 'transport2', 
            'email': 'transport2@ecotrace.com',
            'first_name': 'Marie',
            'last_name': 'Logistique',
            'role': 'TRANSPORTEUR',
            'phone': '0987654321',
            'company_name': 'EcoTransport',
        },
        {
            'username': 'transport3',
            'email': 'transport3@ecotrace.com', 
            'first_name': 'Pierre',
            'last_name': 'Collecteur',
            'role': 'TRANSPORTEUR',
            'phone': '0145678901',
            'company_name': 'Green Logistics',
        }
    ]
    
    created_count = 0
    for data in transporteurs_data:
        if not User.objects.filter(username=data['username']).exists():
            user = User.objects.create_user(
                password='password123',  # Simple password for testing
                **data
            )
            print(f"✅ Transporteur créé: {user.username} - {user.get_full_name()}")
            created_count += 1
        else:
            print(f"⚠️  Transporteur existe déjà: {data['username']}")
    
    print(f"\n🎉 {created_count} transporteurs créés!")
    print(f"📊 Total transporteurs: {User.objects.filter(role='TRANSPORTEUR').count()}")

if __name__ == "__main__":
    create_transporteurs()
