"""Staffwork API v1 URLs."""

from django.urls import path, include

app_name = 'staffwork'

urlpatterns = [
    path('', include('staffwork.urls')),
]
