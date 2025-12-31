"""
URL Configuration for Staff
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StaffViewSet,
    StaffDocumentViewSet,
    StaffAttendanceViewSet,
    StaffLeaveViewSet
)

router = DefaultRouter()
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'documents', StaffDocumentViewSet, basename='staff-document')
router.register(r'attendance', StaffAttendanceViewSet, basename='staff-attendance')
router.register(r'leaves', StaffLeaveViewSet, basename='staff-leave')

urlpatterns = [
    path('', include(router.urls)),
]
