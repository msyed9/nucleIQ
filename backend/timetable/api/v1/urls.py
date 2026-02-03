"""Timetable API v1 URLs."""

from django.urls import path, include

app_name = 'timetable'

urlpatterns = [
    path('', include('timetable.urls')),
]
