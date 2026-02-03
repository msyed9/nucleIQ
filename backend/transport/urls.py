"""
Transport Module URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, DriverViewSet, DriverAttendanceViewSet,
    RouteViewSet, StopViewSet, StudentTransportViewSet,
    VehicleTrackingViewSet, TripLogViewSet,
    VehicleMaintenanceViewSet, FuelLogViewSet,
    TransportNotificationViewSet, TransportNotificationSettingViewSet
)

router = DefaultRouter()
router.register('vehicles', VehicleViewSet, basename='vehicle')
router.register('drivers', DriverViewSet, basename='driver')
router.register('driver-attendance', DriverAttendanceViewSet, basename='driver-attendance')
router.register('routes', RouteViewSet, basename='route')
router.register('stops', StopViewSet, basename='stop')
router.register('allocations', StudentTransportViewSet, basename='student-transport')
router.register('tracking', VehicleTrackingViewSet, basename='vehicle-tracking')
router.register('trips', TripLogViewSet, basename='trip')
router.register('maintenance', VehicleMaintenanceViewSet, basename='maintenance')
router.register('fuel', FuelLogViewSet, basename='fuel')
router.register('notifications', TransportNotificationViewSet, basename='transport-notification')
router.register('notification-settings', TransportNotificationSettingViewSet, basename='transport-notification-settings')

urlpatterns = [
    path('', include(router.urls)),
]
