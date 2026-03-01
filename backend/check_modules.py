import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant

t = Tenant.objects.first()
if t:
    print("Enabled modules:", t.enabled_modules)
else:
    print("No tenant found")
