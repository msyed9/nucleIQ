"""Analytics API v1 URLs."""

from django.urls import path, include

app_name = 'analytics'

urlpatterns = [
    path('', include('analytics.urls')),
]
