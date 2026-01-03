"""
Hostel URLs - Phase 5 Complete
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HostelBuildingViewSet, RoomViewSet, BedViewSet, HostelAllocationViewSet,
    HostelFeeStructureViewSet, HostelFeePaymentViewSet,
    HostelAttendanceViewSet, HostelGatePassViewSet,
    HostelComplaintViewSet, MaintenanceScheduleViewSet,
    MessRegistrationViewSet, MessMenuViewSet, MessAttendanceViewSet
)

router = DefaultRouter()

# Phase 5.1: Infrastructure
router.register(r'buildings', HostelBuildingViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'beds', BedViewSet)

# Phase 5.2: Allocations
router.register(r'allocations', HostelAllocationViewSet)

# Phase 5.3: Fees
router.register(r'fee-structures', HostelFeeStructureViewSet)
router.register(r'fee-payments', HostelFeePaymentViewSet)

# Phase 5.4: Attendance & Gate Pass
router.register(r'attendance', HostelAttendanceViewSet)
router.register(r'gate-passes', HostelGatePassViewSet)

# Phase 5.5: Complaints & Maintenance
router.register(r'complaints', HostelComplaintViewSet)
router.register(r'maintenance', MaintenanceScheduleViewSet)

# Phase 5.6: Mess Management
router.register(r'mess-registrations', MessRegistrationViewSet)
router.register(r'mess-menus', MessMenuViewSet)
router.register(r'mess-attendance', MessAttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

