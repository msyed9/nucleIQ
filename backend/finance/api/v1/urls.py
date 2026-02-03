"""Finance API v1 URLs."""

from django.urls import path, include

app_name = 'finance'

urlpatterns = [
    path('', include('finance.urls')),
]
