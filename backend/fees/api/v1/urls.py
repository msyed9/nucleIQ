"""Fees API v1 URLs."""

from django.urls import path, include

app_name = 'fees'

urlpatterns = [
    path('', include('fees.urls')),
]
