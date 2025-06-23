#!/usr/bin/env python
import requests
import json

# Test the actual API endpoint
url = 'http://localhost:8000/api/waste/formulaires/'

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n=== API Response Data ===")
        print(f"Number of formulaires: {len(data)}")
        
        for formulaire in data:
            ref = formulaire.get('reference', 'Unknown')
            collecte_info = formulaire.get('collecte_info')
            print(f"\nFormulaire {ref}:")
            print(f"  collecte_info: {collecte_info}")
            print(f"  collecte_info type: {type(collecte_info)}")
            print(f"  Has collecte_info key: {'collecte_info' in formulaire}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error making request: {e}")
