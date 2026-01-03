"""
Reports URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet,
    GeneratedReportViewSet,
    ScheduledReportViewSet,
    ReportWidgetViewSet,
    CustomReportQueryViewSet,
    AnalyticsViewSet
)

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet, basename='report-template')
router.register(r'generated', GeneratedReportViewSet, basename='generated-report')
router.register(r'scheduled', ScheduledReportViewSet, basename='scheduled-report')
router.register(r'widgets', ReportWidgetViewSet, basename='report-widget')
router.register(r'queries', CustomReportQueryViewSet, basename='custom-query')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
