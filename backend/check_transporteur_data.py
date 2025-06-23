#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import Collecte
from users.models import User

print("=== Checking Collectes and Transporteurs ===")

# Check if there are any transporteurs
transporteurs = User.objects.filter(role='TRANSPORTEUR')
print(f"Number of transporteurs: {transporteurs.count()}")
for t in transporteurs:
    print(f"  - {t.username} (ID: {t.id}) - {t.first_name} {t.last_name}")

print("\n=== All Collectes ===")
collectes = Collecte.objects.all()
for c in collectes:
    print(f"Collecte {c.reference} (ID: {c.id}):")
    print(f"  - Transporteur: {c.transporteur.username if c.transporteur else 'None'} (ID: {c.transporteur.id if c.transporteur else 'None'})")
    print(f"  - Formulaire origine: {c.formulaire_origine.reference if c.formulaire_origine else 'None'}")
    print(f"  - Statut: {c.statut}")
    print(f"  - Date: {c.date_collecte}")
    print()

print("=== Current User (Pierre) ===")
try:
    pierre = User.objects.get(username='pierre_transporteur')
    print(f"Pierre ID: {pierre.id}")
    print(f"Pierre Role: {pierre.role}")
    
    pierre_collectes = Collecte.objects.filter(transporteur=pierre)
    print(f"Collectes assigned to Pierre: {pierre_collectes.count()}")
    for c in pierre_collectes:
        print(f"  - {c.reference}")
except User.DoesNotExist:
    print("Pierre not found!")
