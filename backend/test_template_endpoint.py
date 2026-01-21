#!/usr/bin/env python
"""Test the template download endpoint"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()
print(f'Testing with user: {user.email if user else None}')

if user:
    c = Client()
    c.force_login(user)
    response = c.get('/api/data-management/template/students/')
    print(f'Status: {response.status_code}')
    print(f'Content-Type: {response.get("Content-Type", "unknown")}')
    if response.status_code == 200:
        print('SUCCESS: Template endpoint works!')
    else:
        print(f'ERROR: {response.content[:200]}')
else:
    print('ERROR: No user found')
