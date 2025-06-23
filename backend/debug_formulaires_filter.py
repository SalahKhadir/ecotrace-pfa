import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.serializers import FormulaireCollecteSerializer
from waste_management.models import FormulaireCollecte

print('=== FORMULAIRES DATA FOR PLANIFICATION ===')
formulaires = FormulaireCollecte.objects.all()
for f in formulaires:
    serializer = FormulaireCollecteSerializer(f)
    data = serializer.data
    
    print(f'Formulaire {f.id} ({data["reference"]}):')
    print(f'  Statut: {data["statut"]}')
    print(f'  Collecte Info: {data["collecte_info"]}')
    
    # Check if it should appear in "Planifier Collectes"
    should_show = data['statut'] == 'VALIDE' and not data['collecte_info']
    print(f'  -> Should show in Planifier Collectes: {should_show}')
    print('---')
