"""Payroll API v1 URLs."""

from django.urls import path, include

app_name = 'payroll'

urlpatterns = [
    path('', include('payroll.urls')),
]
