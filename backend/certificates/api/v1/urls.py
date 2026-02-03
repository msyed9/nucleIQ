"""Certificates API v1 URLs."""

from django.urls import path, include

app_name = 'certificates'

urlpatterns = [
    path('', include('certificates.urls')),
]
