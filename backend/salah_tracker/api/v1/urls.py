"""Salah Tracker API v1 URLs."""

from django.urls import path, include

app_name = 'salah_tracker'

urlpatterns = [
    path('', include('salah_tracker.urls')),
]
