"""Communication API v1 URLs."""

from django.urls import path, include

app_name = 'communication'

urlpatterns = [
    path('', include('communication.urls')),
]
