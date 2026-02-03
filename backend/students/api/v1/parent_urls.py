"""Students parent portal API v1 URLs."""

from django.urls import path, include

app_name = 'students-parent'

urlpatterns = [
    path('', include('students.parent_urls')),
]
