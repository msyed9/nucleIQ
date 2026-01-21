#!/usr/bin/env python
"""Test the DownloadTemplateView directly"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from tenants.models import Tenant
from data_management.views_enhanced import DownloadTemplateView

User = get_user_model()
factory = RequestFactory()

# Get first user and tenant
user = User.objects.filter(is_staff=True).first()
tenant = Tenant.objects.first()

if user and tenant:
    print(f"Testing with user: {user.email}")
    print(f"Testing with tenant: {tenant.name}")
    
    # Create request
    request = factory.get('/api/data-management/template/students/?format=xlsx')
    request.user = user
    request.META['HTTP_X_TENANT_ID'] = str(tenant.id)
    
    # Call view directly
    view = DownloadTemplateView()
    view.request = request
    
    try:
        response = view.get(request, module='students')
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.get('Content-Type', 'unknown')}")
        if response.status_code == 200:
            print("SUCCESS! Template download works!")
        else:
            print(f"Response content: {response.content[:500] if hasattr(response, 'content') else 'N/A'}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
else:
    print(f"Missing: user={user}, tenant={tenant}")
