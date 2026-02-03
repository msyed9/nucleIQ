"""Habit Tracker API v1 URLs."""

from django.urls import path, include

app_name = 'habit_tracker'

urlpatterns = [
    path('', include('habit_tracker.urls')),
]
