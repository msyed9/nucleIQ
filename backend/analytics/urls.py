"""
URL Configuration for Analytics API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Note: Analytics ViewSets can be added here when needed for API access
# The admin dashboard is accessed via /admin/analytics/platform-dashboard/

router = DefaultRouter()

# Placeholder for future analytics API endpoints
# router.register(r'metrics', TenantMetricViewSet, basename='tenant-metric')
# router.register(r'logs', UsageLogViewSet, basename='usage-log')

urlpatterns = [
    path('', include(router.urls)),
]
