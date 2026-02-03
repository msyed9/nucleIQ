"""CMS API v1 URLs."""

from django.urls import path, include

app_name = 'cms'

urlpatterns = [
    path('', include('cms.urls')),
]
