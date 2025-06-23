import requests
import json

# Test the API directly
response = requests.get('http://localhost:8000/api/waste/collectes/')
if response.status_code == 200:
    data = response.json()
    print('=== COLLECTES API RESPONSE ===')
    print(json.dumps(data, indent=2, default=str))
else:
    print(f'Error: {response.status_code} - {response.text}')
