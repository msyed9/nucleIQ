"""Reports API v1 URLs."""

from django.urls import path, include

app_name = 'reports'

urlpatterns = [
    path('', include('reports.urls')),
]
