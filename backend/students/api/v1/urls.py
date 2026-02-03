"""Students API v1 URLs."""

from django.urls import path, include

app_name = 'students'

urlpatterns = [
    path('', include('students.urls')),
]
