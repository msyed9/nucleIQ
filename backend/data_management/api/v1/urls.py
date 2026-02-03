"""Data Management API v1 URLs."""

from django.urls import path, include

app_name = 'data_management'

urlpatterns = [
    path('', include('data_management.urls')),
]
