"""Library API v1 URLs."""

from django.urls import path, include

app_name = 'library'

urlpatterns = [
    path('', include('library.urls')),
]
