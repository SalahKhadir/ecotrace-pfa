#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django environment
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import Collecte
from waste_management.serializers import CollecteSerializer

print("=== Testing Collecte Serializer Output ===")

# Get all collectes
collectes = Collecte.objects.all().select_related('utilisateur', 'transporteur', 'formulaire_origine')

for collecte in collectes:
    print(f"\n--- Collecte {collecte.id} ({collecte.reference}) ---")
    print(f"Raw transporteur: {collecte.transporteur}")
    print(f"Transporteur ID: {collecte.transporteur.id if collecte.transporteur else None}")
    
    # Serialize the collecte
    serializer = CollecteSerializer(collecte)
    data = serializer.data
    
    print(f"Serialized transporteur: {data.get('transporteur')}")
    print(f"Serialized transporteur_info: {data.get('transporteur_info')}")
    
    # Print full serialized data
    print("Full serialized data:")
    print(json.dumps(data, indent=2, default=str))
    print("-" * 50)
