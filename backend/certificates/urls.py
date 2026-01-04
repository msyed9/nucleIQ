"""
Certificates URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CertificateTemplateViewSet, CertificateRequestViewSet,
    GeneratedCertificateViewSet
)

router = DefaultRouter()
router.register(r'templates', CertificateTemplateViewSet, basename='certificatetemplate')
router.register(r'requests', CertificateRequestViewSet, basename='certificaterequest')
router.register(r'generated', GeneratedCertificateViewSet, basename='generatedcertificate')

urlpatterns = [
    path('', include(router.urls)),
]
