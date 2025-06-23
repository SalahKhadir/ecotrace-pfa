#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import FormulaireCollecte, Collecte

print("=== Current Status of Formulaires ===")
formulaires = FormulaireCollecte.objects.all().order_by('id')
for f in formulaires:
    print(f"Formulaire {f.reference} (ID: {f.id}): Status = {f.statut}")

print("\n=== Current Collectes ===")
collectes = Collecte.objects.all()
for c in collectes:
    print(f"Collecte {c.reference} (ID: {c.id}): Formulaire origine = {c.formulaire_origine_id if c.formulaire_origine else 'None'}")
