import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from students.models import Student
from django.test import Client
from rest_framework.authtoken.models import Token
from users.models import User

s = Student.objects.first()
if not s:
    print("No student found.")
    sys.exit()

user = User.objects.filter(is_superuser=True).first()
if not user:
    print("No superuser found.")
    sys.exit()

client = Client()
client.force_login(user)
if hasattr(user, 'tenant_id'):
    client.defaults['HTTP_X_TENANT_ID'] = str(user.tenant_id)

response = client.get(f'/api/v1/students/{s.id}/profile_360/')
print("Status:", response.status_code)
if response.status_code == 200:
    data = response.json()
    print("KEYS:", list(data.keys()))
    print("fee_details:", data.get('fee_details'))
    print("financial_summary:", data.get('financial_summary'))
else:
    print("ERROR:", response.content)
