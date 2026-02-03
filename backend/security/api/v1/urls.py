"""Security API v1 URLs."""

from django.urls import path, include

app_name = 'security'

urlpatterns = [
    path('', include('security.urls')),
]
