"""Placement API v1 URLs."""

from django.urls import path, include

app_name = 'placement'

urlpatterns = [
    path('', include('placement.urls')),
]
