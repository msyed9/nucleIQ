"""
ID Cards URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IDCardTemplateViewSet,
    IDCardGenerationViewSet,
    IDCardRecordViewSet,
    QRAttendanceViewSet
)

app_name = 'idcards'

router = DefaultRouter()
router.register(r'templates', IDCardTemplateViewSet, basename='template')
router.register(r'records', IDCardRecordViewSet, basename='record')
router.register(r'attendance', QRAttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
    
    # Generation endpoints - explicit paths for ViewSet actions
    path('generate/single/', IDCardGenerationViewSet.as_view({'post': 'single'}), name='generate-single'),
    path('generate/bulk/', IDCardGenerationViewSet.as_view({'post': 'bulk'}), name='generate-bulk'),
    path('generate/bulk-status/<uuid:job_id>/', IDCardGenerationViewSet.as_view({'get': 'bulk_status'}), name='bulk-status'),
    
    # QR Scanning
    path('scan/', QRAttendanceViewSet.as_view({'post': 'scan'}), name='qr-scan'),
]
