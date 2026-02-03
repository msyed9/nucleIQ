"""Academics API v1 URLs."""

from django.urls import path, include

app_name = 'academics'

urlpatterns = [
    path('', include('academics.urls')),
]
