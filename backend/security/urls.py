"""
Security URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GatePassViewSet, GateLogViewSet, CampusVisitorViewSet, CampusVisitorLogViewSet

router = DefaultRouter()
router.register(r'gate-passes', GatePassViewSet, basename='gatepass')
router.register(r'gate-logs', GateLogViewSet, basename='gatelog')
router.register(r'visitors', CampusVisitorViewSet, basename='campusvisitor')
router.register(r'visitor-logs', CampusVisitorLogViewSet, basename='campusvisitorlog')

urlpatterns = [
    path('', include(router.urls)),
]
