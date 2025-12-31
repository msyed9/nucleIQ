"""
Transport URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, DriverViewSet, RouteViewSet, StopViewSet, StudentTransportViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'routes', RouteViewSet)
router.register(r'stops', StopViewSet)
router.register(r'allocations', StudentTransportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
