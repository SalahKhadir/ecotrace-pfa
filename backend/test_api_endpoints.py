import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from waste_management.models import FormulaireCollecte
import json

# Create a test client and authenticate
client = Client()

# Get a user with RESPONSABLE_LOGISTIQUE role
User = get_user_model()
admin_user = User.objects.filter(role='RESPONSABLE_LOGISTIQUE').first()
if not admin_user:
    admin_user = User.objects.filter(is_superuser=True).first()

if admin_user:
    # Login
    client.force_login(admin_user)
    
    print('=== TESTING API ENDPOINTS ===')
    
    # Test formulaires endpoint
    response = client.get('/api/waste/formulaires/')
    if response.status_code == 200:
        data = response.json()
        formulaires = data.get('results', data)
        print(f'Formulaires API returned {len(formulaires)} items:')
        for f in formulaires:
            print(f'  {f["reference"]}: statut={f["statut"]}, collecte_info={f.get("collecte_info")}')
    else:
        print(f'Formulaires API error: {response.status_code}')
    
    print()
    
    # Test collectes endpoint
    response = client.get('/api/waste/collectes/')
    if response.status_code == 200:
        data = response.json()
        collectes = data.get('results', data)
        print(f'Collectes API returned {len(collectes)} items:')
        for c in collectes:
            print(f'  {c["reference"]}: formulaire_origine={c.get("formulaire_origine")}')
    else:
        print(f'Collectes API error: {response.status_code}')
else:
    print('No admin user found')
