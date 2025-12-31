"""
Hostel URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HostelBuildingViewSet, RoomViewSet, BedViewSet, HostelAllocationViewSet

router = DefaultRouter()
router.register(r'buildings', HostelBuildingViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'beds', BedViewSet)
router.register(r'allocations', HostelAllocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
