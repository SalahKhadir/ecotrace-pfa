#!/usr/bin/env python
"""
Script to recreate the EcoTrace database with test users
This script will:
1. Drop all existing data
2. Run migrations
3. Create test users for each role as shown in LoginPage.jsx
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecotrace_backend.settings')
django.setup()

from django.db import connection
from django.core.management.color import no_style
from django.db import transaction

def recreate_database():
    """Drop all tables and recreate from scratch"""
    print("🗑️  Dropping all tables...")
    
    # Get the database connection
    cursor = connection.cursor()
    
    # Get all table names
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    # Drop all tables
    if tables:
        # Disable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        for table in tables:
            table_name = table[0]
            print(f"   Dropping table: {table_name}")
            cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
        
        # Re-enable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    
    print("✅ Database cleaned successfully!")

def run_migrations():
    """Run Django migrations to recreate tables"""
    print("🔄 Running migrations...")
    
    # Make migrations first
    execute_from_command_line(['manage.py', 'makemigrations'])
    
    # Apply migrations
    execute_from_command_line(['manage.py', 'migrate'])
    
    print("✅ Migrations completed successfully!")

def create_test_users():
    """Create test users for each role as defined in LoginPage.jsx"""
    print("👥 Creating test users...")
    
    User = get_user_model()
    
    # Test users data matching LoginPage.jsx
    test_users = [
        {
            'email': 'particulier@test.com',
            'username': 'particulier_test',
            'password': 'test123',
            'first_name': 'Jean',
            'last_name': 'Martin',
            'role': 'PARTICULIER',
            'is_active': True,
        },
        {
            'email': 'entreprise@test.com',
            'username': 'entreprise_test',
            'password': 'test123',
            'first_name': 'Marie',
            'last_name': 'Dubois',
            'role': 'ENTREPRISE',
            'is_active': True,
            'company_name': 'EcoTech Solutions',
            'company_address': '123 Rue de l\'Innovation, 75001 Paris',
        },
        {
            'email': 'transporteur@test.com',
            'username': 'transporteur_test',
            'password': 'test123',
            'first_name': 'Pierre',
            'last_name': 'Durand',
            'role': 'TRANSPORTEUR',
            'is_active': True,
            'company_name': 'Transport Vert',
        },
        {
            'email': 'technicien@test.com',
            'username': 'technicien_test',
            'password': 'test123',
            'first_name': 'Sophie',
            'last_name': 'Lefebvre',
            'role': 'TECHNICIEN',
            'is_active': True,
        },
        {
            'email': 'admin@test.com',
            'username': 'admin_test',
            'password': 'test123',
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'ADMINISTRATEUR',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'email': 'logistique@test.com',
            'username': 'logistique_test',
            'password': 'test123',
            'first_name': 'Claire',
            'last_name': 'Bernard',
            'role': 'RESPONSABLE_LOGISTIQUE',
            'is_active': True,
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        try:
            # Check if user already exists
            if User.objects.filter(email=user_data['email']).exists():
                print(f"   ⚠️  User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                is_active=user_data.get('is_active', True),
                is_staff=user_data.get('is_staff', False),
                is_superuser=user_data.get('is_superuser', False),
            )
            
            # Add additional fields if they exist
            if 'company_name' in user_data:
                user.company_name = user_data['company_name']
            if 'company_address' in user_data:
                user.company_address = user_data['company_address']
            
            user.save()
            
            created_users.append(user)
            print(f"   ✅ Created user: {user.email} ({user.role})")
            
        except Exception as e:
            print(f"   ❌ Error creating user {user_data['email']}: {str(e)}")
    
    print(f"✅ Created {len(created_users)} test users successfully!")
    return created_users

def display_users_summary():
    """Display a summary of all created users"""
    print("\n" + "="*60)
    print("📋 TEST USERS SUMMARY")
    print("="*60)
    
    User = get_user_model()
    users = User.objects.all().order_by('role')
    
    for user in users:
        print(f"👤 {user.role:<20} | {user.email:<25} | {user.first_name} {user.last_name}")
    
    print("="*60)
    print("🔑 All passwords are: test123")
    print("="*60)

def main():
    """Main function to recreate database and populate with test data"""
    print("🚀 Starting EcoTrace Database Recreation...")
    print("=" * 60)
    
    try:
        # Step 1: Drop all tables
        recreate_database()
        
        # Step 2: Run migrations
        run_migrations()
        
        # Step 3: Create test users
        create_test_users()
        
        # Step 4: Display summary
        display_users_summary()
        
        print("\n✅ Database recreation completed successfully!")
        print("🎉 You can now use the test accounts in the frontend:")
        print("   - particulier@test.com / test123")
        print("   - entreprise@test.com / test123")
        print("   - transporteur@test.com / test123")
        print("   - technicien@test.com / test123")
        print("   - admin@test.com / test123")
        print("   - logistique@test.com / test123")
        
    except Exception as e:
        print(f"❌ Error during database recreation: {str(e)}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
