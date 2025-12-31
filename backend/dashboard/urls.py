"""
URL Configuration for Dashboard app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardViewSet, WidgetViewSet, DashboardLayoutViewSet

# Create router
router = DefaultRouter()
router.register(r'analytics', DashboardViewSet, basename='dashboard')
router.register(r'widgets', WidgetViewSet, basename='widget')
router.register(r'layout', DashboardLayoutViewSet, basename='layout')

urlpatterns = [
    path('', include(router.urls)),
]
