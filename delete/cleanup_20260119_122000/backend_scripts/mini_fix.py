import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from tenants.models import Tenant
from fees.models import FeeCategory

def fix():
    tenant = Tenant.objects.get(subdomain='school')
    print(f"Target Tenant ID: {tenant.id}")
    
    # Try to find existing
    existing = FeeCategory.objects.filter(tenant=tenant, code='TUIT').first()
    if existing:
        print(f"Found existing category: {existing.id} | {existing.name}")
    else:
        print("Creating fee category...")
        try:
            FeeCategory.objects.create(tenant=tenant, code='TUIT', name='Tuition Fee')
            print("Created successfully")
        except Exception as e:
            print(f"FAILED to create: {e}")

if __name__ == "__main__":
    fix()
