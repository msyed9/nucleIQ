"""ID Cards API v1 URLs."""

from django.urls import path, include

app_name = 'idcards'

urlpatterns = [
    path('', include('idcards.urls')),
]
