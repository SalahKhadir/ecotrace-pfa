import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.serializers import FormulaireCollecteSerializer
from waste_management.models import FormulaireCollecte

print('=== CURRENT FORMULAIRES STATUS ===')
formulaires = FormulaireCollecte.objects.all().order_by('-id')
for f in formulaires:
    print(f'Formulaire {f.id} ({f.reference}):')
    print(f'  Statut: {f.statut}')
    
    # Check associated collecte
    collecte = f.get_collecte_associee()
    print(f'  Associated collecte: {collecte}')
    
    # Check what the serializer returns
    serializer = FormulaireCollecteSerializer(f)
    data = serializer.data
    print(f'  Serializer collecte_info: {data["collecte_info"]}')
    
    # Check if it should appear in "Planifier Collectes"
    should_show = data['statut'] == 'VALIDE' and not data['collecte_info']
    print(f'  -> Should show in Planifier Collectes: {should_show}')
    print('---')
