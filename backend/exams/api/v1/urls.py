"""Exams API v1 URLs."""

from django.urls import path, include

app_name = 'exams'

urlpatterns = [
    path('', include('exams.urls')),
]
