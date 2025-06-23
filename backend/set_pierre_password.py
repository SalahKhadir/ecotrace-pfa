#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from users.models import User

print("=== Testing Pierre login with different passwords ===")

username = 'transporteur_test'
possible_passwords = ['password123', 'test123', 'transporteur123', 'pierre123', '123456', 'admin']

for password in possible_passwords:
    user = authenticate(username=username, password=password)
    if user:
        print(f"✅ Success! Username: {username}, Password: {password}")
        print(f"User ID: {user.id}")
        print(f"Name: {user.first_name} {user.last_name}")
        print(f"Role: {user.role}")
        break
else:
    print("❌ None of the common passwords worked")
    
    # Let's check if we can create a test login
    print("\n=== Setting a known password for testing ===")
    user = User.objects.get(username='transporteur_test')
    user.set_password('test123')
    user.save()
    print("✅ Set password 'test123' for transporteur_test")
    
    # Test the new password
    user = authenticate(username='transporteur_test', password='test123')
    if user:
        print("✅ Login now works with username: transporteur_test, password: test123")
