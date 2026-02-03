"""Staff API v1 URLs."""

from django.urls import path, include

app_name = 'staff'

urlpatterns = [
    path('', include('staff.urls')),
]
