import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.serializers import FormulaireCollecteSerializer
from waste_management.models import FormulaireCollecte

print('=== API DATA SIMULATION ===')
formulaires = FormulaireCollecte.objects.all()
for f in formulaires:
    serializer = FormulaireCollecteSerializer(f)
    data = serializer.data
    print(f'ID: {f.id}, Statut: {data["statut"]}, Collecte Info: {data["collecte_info"]}')
    
    # Check if this would be filtered for "Planifier Collectes"
    should_show_in_planifier = data['statut'] == 'VALIDE' and not data['collecte_info']
    print(f'  -> Should show in Planifier Collectes: {should_show_in_planifier}')
