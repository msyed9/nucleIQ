"""Billing API v1 URLs."""

from django.urls import path, include

app_name = 'billing'

urlpatterns = [
    path('', include('billing.urls')),
]
