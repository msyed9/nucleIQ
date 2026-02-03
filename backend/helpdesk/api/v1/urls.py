"""Helpdesk API v1 URLs."""

from django.urls import path, include

app_name = 'helpdesk'

urlpatterns = [
    path('', include('helpdesk.urls')),
]
