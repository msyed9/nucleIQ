"""Dashboard API v1 URLs."""

from django.urls import path, include

app_name = 'dashboard'

urlpatterns = [
    path('', include('dashboard.urls')),
]
