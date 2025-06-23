#!/usr/bin/env python
"""
Test script pour la planification de collectes
"""
import os
import sys
import django

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from users.models import User
from waste_management.models import FormulaireCollecte, Collecte

def test_planification_flow():
    """Test complet du flux de planification"""
    
    print("🔍 Test du flux de planification de collectes\n")
    
    # 1. Vérifier les transporteurs
    transporteurs = User.objects.filter(role='TRANSPORTEUR', is_active=True)
    print(f"📦 Transporteurs disponibles: {transporteurs.count()}")
    for t in transporteurs:
        print(f"   - {t.get_full_name()} ({t.company_name})")
    
    # 2. Vérifier les formulaires validés
    formulaires_valides = FormulaireCollecte.objects.filter(statut='VALIDE')
    print(f"\n📋 Formulaires validés: {formulaires_valides.count()}")
    for f in formulaires_valides:
        print(f"   - {f.reference} - {f.utilisateur.get_full_name()} ({f.type_dechets})")
    
    # 3. Vérifier les collectes existantes
    collectes = Collecte.objects.all()
    print(f"\n🚛 Collectes existantes: {collectes.count()}")
    for c in collectes:
        transporteur = c.transporteur.get_full_name() if c.transporteur else "Non assigné"
        print(f"   - {c.reference} - {transporteur} ({c.statut})")
    
    # 4. Simuler la création d'une collecte
    if formulaires_valides.exists() and transporteurs.exists():
        formulaire = formulaires_valides.first()
        transporteur = transporteurs.first()
        
        print(f"\n💡 Test de création de collecte:")
        print(f"   Formulaire: {formulaire.reference}")
        print(f"   Transporteur: {transporteur.get_full_name()}")
        print(f"   Date: {formulaire.date_souhaitee}")
        print("   ✅ Prêt pour la planification!")
    else:
        print("\n⚠️  Pas assez de données pour tester la planification")
        if not formulaires_valides.exists():
            print("     - Aucun formulaire validé")
        if not transporteurs.exists():
            print("     - Aucun transporteur disponible")

if __name__ == "__main__":
    test_planification_flow()
