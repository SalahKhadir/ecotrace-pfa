#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import FormulaireCollecte
from waste_management.serializers import FormulaireCollecteSerializer
import json

print("=== Checking FormulaireCollecte Serializer Output ===")

formulaires = FormulaireCollecte.objects.all()
for f in formulaires:
    serializer = FormulaireCollecteSerializer(f)
    data = serializer.data
    print(f'Formulaire {f.reference} (ID: {f.id}):')
    print(f'  collecte_info in data: {"collecte_info" in data}')
    if 'collecte_info' in data:
        print(f'  collecte_info value: {data["collecte_info"]}')
        print(f'  collecte_info type: {type(data["collecte_info"])}')
    print(f'  Raw data keys: {list(data.keys())}')
    print(f'  Has collecte related? {hasattr(f, "collecte")}')
    if hasattr(f, "collecte"):
        try:
            collecte = f.collecte
            print(f'  Related collecte exists: {collecte}')
        except:
            print(f'  Related collecte: None')
    print("---")
