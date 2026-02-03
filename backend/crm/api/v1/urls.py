"""CRM API v1 URLs."""

from django.urls import path, include

app_name = 'crm'

urlpatterns = [
    path('', include('crm.urls')),
]
