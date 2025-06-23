import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from waste_management.models import FormulaireCollecte
from users.models import User
from datetime import date, timedelta

# Get a user to create formulaires for
user = User.objects.filter(role='PARTICULIER').first()
if not user:
    print("No PARTICULIER user found")
    exit()

print(f"Creating test formulaires for user: {user.username}")

# Create a formulaire that's VALIDE but not yet planned
formulaire1 = FormulaireCollecte.objects.create(
    utilisateur=user,
    type_dechets='ordinateur',
    description='Ordinateur portable en panne à collecter',
    quantite_estimee='5-10kg',
    mode_collecte='domicile',
    date_souhaitee=date.today() + timedelta(days=7),
    creneau_horaire='matin',
    adresse_collecte='123 Rue de Test, Paris',
    telephone='0123456789',
    instructions_speciales='Sonnez à l\'interphone',
    statut='VALIDE'  # This should appear in "Planifier Collectes"
)

print(f"Created formulaire: {formulaire1.reference} (Status: {formulaire1.statut})")

# Create another one that's still SOUMIS
formulaire2 = FormulaireCollecte.objects.create(
    utilisateur=user,
    type_dechets='smartphone',
    description='Téléphones usagés',
    quantite_estimee='1-5kg',
    mode_collecte='domicile',
    date_souhaitee=date.today() + timedelta(days=5),
    creneau_horaire='apres_midi',
    adresse_collecte='456 Avenue de Test, Lyon',
    telephone='0987654321',
    instructions_speciales='Accès par la cour',
    statut='SOUMIS'  # This should NOT appear in "Planifier Collectes"
)

print(f"Created formulaire: {formulaire2.reference} (Status: {formulaire2.statut})")
print("Test formulaires created successfully!")
