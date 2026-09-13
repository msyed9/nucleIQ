"""Staffwork API v2 URLs (currently identical to v1)."""

from django.urls import path, include

app_name = 'staffwork'

urlpatterns = [
    path('', include('staffwork.urls')),
]
