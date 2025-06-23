#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import FormulaireCollecte

# Update COL-2025-004 to EN_COURS since it already has a collecte
formulaire = FormulaireCollecte.objects.get(reference='COL-2025-004')
formulaire.statut = 'EN_COURS'
formulaire.save()

print(f"Updated {formulaire.reference} status to {formulaire.statut}")

print("\n=== Updated Status ===")
formulaires = FormulaireCollecte.objects.all().order_by('id')
for f in formulaires:
    print(f"Formulaire {f.reference} (ID: {f.id}): Status = {f.statut}")
