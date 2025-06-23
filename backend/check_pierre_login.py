#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from users.models import User

print("=== Checking Pierre login ===")

# Check if Pierre user exists
pierre_users = User.objects.filter(first_name__icontains='pierre')
print(f"Found {pierre_users.count()} Pierre users:")
for user in pierre_users:
    print(f"  - {user.username} (ID: {user.id}) - {user.first_name} {user.last_name}, role: {user.role}")

# Try to authenticate Pierre
try:
    # Try different possible usernames
    possible_usernames = ['pierre', 'Pierre', 'transporteur_test']
    password = 'password123'  # Common test password
    
    for username in possible_usernames:
        user = authenticate(username=username, password=password)
        if user:
            print(f"\n✅ Successfully authenticated {username}")
            print(f"User ID: {user.id}")
            print(f"Name: {user.first_name} {user.last_name}")
            print(f"Role: {user.role}")
            break
    else:
        print("\n❌ Could not authenticate any Pierre user")
        
        # Show all transporteurs
        transporteurs = User.objects.filter(role='TRANSPORTEUR')
        print(f"\nAll transporteurs in database:")
        for t in transporteurs:
            print(f"  - {t.username} (ID: {t.id}) - {t.first_name} {t.last_name}")
            
except Exception as e:
    print(f"Error during authentication: {e}")

print("\n=== Checking collecte assignments ===")
from waste_management.models import Collecte

collectes = Collecte.objects.select_related('transporteur').all()
print(f"Found {collectes.count()} collectes:")
for collecte in collectes:
    transporteur_info = f"{collecte.transporteur.username} (ID: {collecte.transporteur.id})" if collecte.transporteur else "None"
    print(f"  - {collecte.reference}: {transporteur_info}")
