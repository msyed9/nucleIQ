import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from users.models import User

u = User.objects.filter(email='msyed9@yahoo.com').first()
if u:
    print(f"User: {u.email}")
    print(f"is_platform_admin: {u.is_platform_admin}")
    print(f"is_superuser: {u.is_superuser}")
    print(f"tenant_id: {u.tenant_id}")
else:
    print("User not found")
