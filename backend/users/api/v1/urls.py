"""Users API v1 URLs."""

from django.urls import path, include

app_name = 'users'

urlpatterns = [
    path('', include('users.urls')),
]
