"""Core API v1 URLs."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.recyclebin import RecycleBinViewSet
from core.audit import AuditLogViewSet
from core.reporting_views import ReportingViewSet

app_name = 'core'

router = DefaultRouter()
router.register(r'recycle-bin', RecycleBinViewSet, basename='recycle-bin')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'advanced-reports', ReportingViewSet, basename='advanced-reports')

urlpatterns = [
    path('', include(router.urls)),
]
