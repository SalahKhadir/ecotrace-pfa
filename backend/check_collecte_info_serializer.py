import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import FormulaireCollecte
from waste_management.serializers import FormulaireCollecteSerializer

print('=== CHECKING COLLECTE_INFO IN SERIALIZER ===')
for f in FormulaireCollecte.objects.filter(statut='VALIDE').order_by('-id'):
    serializer = FormulaireCollecteSerializer(f)
    data = serializer.data
    print(f'Formulaire {f.reference} (ID: {f.id}):')
    print(f'  Statut: {data["statut"]}')
    print(f'  Collecte Info: {data["collecte_info"]}')
    print('---')
