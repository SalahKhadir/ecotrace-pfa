import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.serializers import CollecteSerializer
from waste_management.models import Collecte

print('=== COLLECTES API DATA ===')
collectes = Collecte.objects.all()
for c in collectes:
    serializer = CollecteSerializer(c)
    data = serializer.data
    print(f'Collecte: {data["reference"]}')
    print(f'  Statut: {data["statut"]}')
    print(f'  Utilisateur: {data.get("utilisateur", "N/A")}')
    print(f'  Transporteur: {data.get("transporteur", "N/A")}')
    print(f'  Date collecte: {data["date_collecte"]}')
    print(f'  Adresse: {data.get("adresse", "N/A")}')
    print('---')
