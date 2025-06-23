#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django environment
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import authenticate
from users.models import User

print("=== Testing new transporteur endpoints ===")

# Get the transporteur user
transporteur = User.objects.get(username='transporteur_test')
print(f"Testing with user: {transporteur.username} (ID: {transporteur.id})")

# Create a test client and simulate login
client = Client()

# First, get JWT token by logging in
login_response = client.post('/api/auth/login/', {
    'username': 'transporteur_test',
    'password': 'test123'
}, content_type='application/json')

if login_response.status_code == 200:
    token_data = login_response.json()
    access_token = token_data['access']
    
    print(f"✅ Login successful, got token")
    
    # Test the new endpoints with the token
    headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
    
    # Test collectes endpoint
    print("\n--- Testing /api/waste/transporteur/collectes/ ---")
    collectes_response = client.get('/api/waste/transporteur/collectes/', **headers)
    print(f"Status: {collectes_response.status_code}")
    if collectes_response.status_code == 200:
        collectes_data = collectes_response.json()
        print(f"Response:")
        print(json.dumps(collectes_data, indent=2, default=str))
    else:
        print(f"Error: {collectes_response.content}")
    
    # Test formulaires endpoint
    print("\n--- Testing /api/waste/transporteur/formulaires/ ---")
    formulaires_response = client.get('/api/waste/transporteur/formulaires/', **headers)
    print(f"Status: {formulaires_response.status_code}")
    if formulaires_response.status_code == 200:
        formulaires_data = formulaires_response.json()
        print(f"Response (showing first formulaire only):")
        if formulaires_data:
            print(json.dumps(formulaires_data[0], indent=2, default=str))
        else:
            print("No formulaires returned")
    else:
        print(f"Error: {formulaires_response.content}")
        
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.content)
