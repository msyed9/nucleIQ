"""HR API v1 URLs."""

from django.urls import path, include

app_name = 'hr'

urlpatterns = [
    path('', include('hr.urls')),
]
