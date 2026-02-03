"""Transport API v1 URLs."""

from django.urls import path, include

app_name = 'transport'

urlpatterns = [
    path('', include('transport.urls')),
]
