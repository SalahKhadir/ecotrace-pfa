import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.serializers import CollecteSerializer
from waste_management.models import Collecte

print('=== COLLECTE SERIALIZER OUTPUT ===')
collecte = Collecte.objects.first()
if collecte:
    serializer = CollecteSerializer(collecte)
    data = serializer.data
    
    print(f'formulaire_origine field: {data.get("formulaire_origine")}')
    print(f'Type: {type(data.get("formulaire_origine"))}')
    print()
    print('All fields in serializer:')
    for key, value in data.items():
        if 'formulaire' in key.lower():
            print(f'  {key}: {value}')
