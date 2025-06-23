import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.serializers import CollecteSerializer
from waste_management.models import Collecte

print('=== COLLECTE DATA STRUCTURE ===')
collecte = Collecte.objects.first()
if collecte:
    serializer = CollecteSerializer(collecte)
    data = serializer.data
    
    print(f'Reference: {data["reference"]}')
    print(f'Utilisateur ID: {data["utilisateur"]}')
    print(f'Utilisateur Nom: {data.get("utilisateur_nom")}')
    print(f'Utilisateur Info: {data["utilisateur_info"]}')
    print(f'Transporteur ID: {data.get("transporteur")}')
    print(f'Transporteur Nom: {data.get("transporteur_nom")}')
    print(f'Transporteur Info: {data["transporteur_info"]}')
    print(f'Date collecte: {data["date_collecte"]}')
    print(f'Statut: {data["statut"]}')
    print(f'Adresse: {data["adresse"]}')
else:
    print('No collecte found')
