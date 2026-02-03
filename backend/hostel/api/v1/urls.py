"""Hostel API v1 URLs."""

from django.urls import path, include

app_name = 'hostel'

urlpatterns = [
    path('', include('hostel.urls')),
]
