"""Attendance API v1 URLs."""

from django.urls import path, include

app_name = 'attendance'

urlpatterns = [
    path('', include('attendance.urls')),
]
