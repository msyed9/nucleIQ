"""
URL Configuration for Attendance
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceRecordViewSet,
    AttendanceConfigurationViewSet,
    AttendanceMonthlyAggregateViewSet,
    FaceEnrollmentViewSet
)

router = DefaultRouter()
router.register(r'records', AttendanceRecordViewSet, basename='attendance-record')
router.register(r'config', AttendanceConfigurationViewSet, basename='attendance-config')
router.register(r'aggregates', AttendanceMonthlyAggregateViewSet, basename='attendance-aggregate')
router.register(r'face-enrollment', FaceEnrollmentViewSet, basename='face-enrollment')

urlpatterns = [
    path('', include(router.urls)),
]

