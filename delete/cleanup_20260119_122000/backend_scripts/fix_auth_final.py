import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from users.models import User
from tenants.models import Tenant

def fix_auth():
    print("--- Fixing Authentication Details ---")
    
    # 1. Ensure Tenant exists for school
    tenant, created = Tenant.objects.get_or_create(
        subdomain='school',
        defaults={'name': 'School Tenant', 'admin_email': 'mohsinsd@gmail.com'}
    )
    if created:
        print(f"Created tenant 'school'")
    else:
        print(f"Tenant 'school' already exists")

    # 2. Platform Admin setup
    admin = User.objects.filter(email='admin@nucleiq.com').first()
    if not admin:
        admin = User(email='admin@nucleiq.com', first_name='Platform', last_name='Admin')
        print(f"Creating new platform admin: admin@nucleiq.com")
    
    admin.is_staff = True
    admin.is_superuser = True
    admin.is_active = True
    admin.is_platform_admin = True
    admin.tenant = None
    admin.set_password('admin123')
    admin.save()
    print(f"Platform Admin 'admin@nucleiq.com' updated with password 'admin123'")

    # 3. School Tenant Admin setup
    mohsin = User.objects.filter(email='mohsinsd@gmail.com').first()
    if not mohsin:
        mohsin = User(email='mohsinsd@gmail.com', first_name='Mohsin', last_name='Admin')
        print(f"Creating new school admin: mohsinsd@gmail.com")
    
    mohsin.is_staff = True
    mohsin.is_superuser = True # Adding superuser for debugging ease
    mohsin.is_active = True
    mohsin.is_platform_admin = False
    mohsin.tenant = tenant
    mohsin.set_password('admin123')
    mohsin.save()
    print(f"School Admin 'mohsinsd@gmail.com' updated with password 'admin123' in tenant 'school'")

    print("\nVerification:")
    for u in User.objects.filter(email__in=['admin@nucleiq.com', 'mohsinsd@gmail.com']):
        print(f"User: {u.email} | Staff: {u.is_staff} | Superuser: {u.is_superuser} | PlatformAdmin: {u.is_platform_admin} | Tenant: {u.tenant}")

if __name__ == "__main__":
    fix_auth()
