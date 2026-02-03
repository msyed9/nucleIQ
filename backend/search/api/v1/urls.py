"""Search API v1 URLs."""

from django.urls import path, include

app_name = 'search'

urlpatterns = [
    path('', include('search.urls')),
]
