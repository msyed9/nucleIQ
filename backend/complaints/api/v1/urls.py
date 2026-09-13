"""Complaints API v1 URLs."""

from django.urls import path, include

app_name = 'complaints'

urlpatterns = [
    path('', include('complaints.urls')),
]
