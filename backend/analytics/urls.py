"""
URL Configuration for Analytics
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlatformAnalyticsViewSet,
    TenantMetricViewSet,
    UsageLogViewSet,
    TenantHealthAlertViewSet,
    ChurnPredictionViewSet,
    UpsellOpportunityViewSet
)

router = DefaultRouter()
router.register(r'platform', PlatformAnalyticsViewSet, basename='platform-analytics')
router.register(r'metrics', TenantMetricViewSet, basename='tenant-metric')
router.register(r'logs', UsageLogViewSet, basename='usage-log')
router.register(r'alerts', TenantHealthAlertViewSet, basename='health-alert')
router.register(r'churn', ChurnPredictionViewSet, basename='churn-prediction')
router.register(r'upsell', UpsellOpportunityViewSet, basename='upsell-opportunity')

urlpatterns = [
    path('', include(router.urls)),
]
