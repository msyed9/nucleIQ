"""LMS API v1 URLs."""

from django.urls import path, include

app_name = 'lms'

urlpatterns = [
    path('', include('lms.urls')),
]
