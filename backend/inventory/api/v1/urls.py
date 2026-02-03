"""Inventory API v1 URLs."""

from django.urls import path, include

app_name = 'inventory'

urlpatterns = [
    path('', include('inventory.urls')),
]
