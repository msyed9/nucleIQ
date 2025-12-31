"""
HR URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveApplicationViewSet

router = DefaultRouter()
router.register(r'leave-types', LeaveTypeViewSet, basename='leavetype')
router.register(r'leave-balances', LeaveBalanceViewSet, basename='leavebalance')
router.register(r'leave-applications', LeaveApplicationViewSet, basename='leaveapplication')

urlpatterns = [
    path('', include(router.urls)),
]
