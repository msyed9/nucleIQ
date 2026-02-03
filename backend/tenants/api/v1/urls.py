"""Tenants API v1 URLs."""

from django.urls import path, include

app_name = 'tenants'

urlpatterns = [
    path('', include('tenants.urls')),
]
