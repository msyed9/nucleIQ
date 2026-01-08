"""
URL Configuration for Students app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet,
    StudentRemarkViewSet,
    StudentDocumentViewSet,
    StudentHealthRecordViewSet,
    StudentEnrollmentViewSet
)
from .idcard_views import IDCardTemplateViewSet

# Create router
router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'remarks', StudentRemarkViewSet, basename='student-remark')
router.register(r'documents', StudentDocumentViewSet, basename='student-document')
router.register(r'health-records', StudentHealthRecordViewSet, basename='health-record')
router.register(r'enrollments', StudentEnrollmentViewSet, basename='student-enrollment')

# ID Cards router - separate to mount at /api/idcards/
idcard_router = DefaultRouter()
idcard_router.register(r'templates', IDCardTemplateViewSet, basename='idcard-template')

urlpatterns = [
    path('', include(router.urls)),
    path('idcards/', include(idcard_router.urls)),  # /api/students/idcards/templates/
]

