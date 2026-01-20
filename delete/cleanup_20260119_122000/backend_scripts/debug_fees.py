import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from fees.models import FeeCategory
from tenants.models import Tenant
try:
    target_tenant = Tenant.objects.get(subdomain="school")
    print(f"Target Tenant ID: {target_tenant.id}")
    for c in FeeCategory.objects.all():
        print(f"ID: {c.id} | TenantID: {c.tenant_id} | Code: {c.code} | Name: {c.name}")
except Exception as e:
    print(f"Error: {e}")
