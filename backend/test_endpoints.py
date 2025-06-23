#!/usr/bin/env python
"""
Simple script to test API endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(endpoint, method='GET', data=None, headers=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, data=data, headers=headers)
        
        print(f"\n{method} {endpoint}")
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code < 500:
            try:
                content = response.json()
                if len(str(content)) > 200:
                    print("Response: [Large JSON response - Success]")
                else:
                    print(f"Response: {content}")
            except:
                print(f"Response: {response.text[:100]}...")
        else:
            print("Server Error")
            
    except Exception as e:
        print(f"Error: {e}")

def main():
    """Test key endpoints"""
    print("Testing EcoTrace API Endpoints")
    print("=" * 40)
    
    # Test authentication endpoints
    test_endpoint("/api/auth/login/", "POST", 
                 json.dumps({"email": "test@test.com", "password": "password"}),
                 {"Content-Type": "application/json"})
    
    # Test user management (should require auth)
    test_endpoint("/api/users/manage/")
    
    # Test waste formulaires (should require auth)  
    test_endpoint("/api/waste/formulaires/")
    
    # Test approval endpoint with JSON (should require auth)
    test_endpoint("/api/waste/formulaires/1/approuver/", "POST",
                 json.dumps({"notes": "Test", "priorite": "normale"}),
                 {"Content-Type": "application/json"})

if __name__ == "__main__":
    main()
