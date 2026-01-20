"""
Dashboard URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet,
    WidgetViewSet,
    DashboardLayoutViewSet,
    RoleDefaultLayoutViewSet,
    ParentDashboardConfigViewSet,
    LeaderboardViewSet,
    WidgetDataViewSet
)

router = DefaultRouter()
router.register(r'analytics', DashboardViewSet, basename='dashboard-analytics')
router.register(r'widgets', WidgetViewSet, basename='widgets')
router.register(r'layout', DashboardLayoutViewSet, basename='dashboard-layout')
router.register(r'role-layouts', RoleDefaultLayoutViewSet, basename='role-layouts')
router.register(r'parent-config', ParentDashboardConfigViewSet, basename='parent-config')
router.register(r'leaderboards', LeaderboardViewSet, basename='leaderboards')
router.register(r'widget-data', WidgetDataViewSet, basename='widget-data')

urlpatterns = [
    path('', include(router.urls)),
]
