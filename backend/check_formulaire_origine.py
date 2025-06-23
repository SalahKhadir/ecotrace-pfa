import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import Collecte, FormulaireCollecte

print('=== CHECKING FORMULAIRE_ORIGINE IDS ===')
collectes = Collecte.objects.all()
for c in collectes:
    print(f'Collecte {c.reference}: formulaire_origine_id = {c.formulaire_origine_id}')

print('\n=== CHECKING WHICH FORMULAIRES ARE ALREADY PLANNED ===')
planned_formulaire_ids = list(Collecte.objects.values_list('formulaire_origine_id', flat=True))
print(f'Planned formulaire IDs: {planned_formulaire_ids}')

print('\n=== FORMULAIRES STATUS ===')
formulaires = FormulaireCollecte.objects.all().order_by('-id')
for f in formulaires:
    is_planned = f.id in planned_formulaire_ids
    should_show_current = f.statut == 'VALIDE' and not f.get_collecte_associee()
    should_show_new = f.statut == 'VALIDE' and f.id not in planned_formulaire_ids
    
    print(f'Formulaire {f.id} ({f.reference}):')
    print(f'  Statut: {f.statut}')
    print(f'  Is planned (in collectes): {is_planned}')
    print(f'  Should show (current logic): {should_show_current}')
    print(f'  Should show (new logic): {should_show_new}')
    print('---')
