from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CertificateTemplateViewSet, CertificateRequestViewSet

router = DefaultRouter()
router.register(r'templates', CertificateTemplateViewSet)
router.register(r'requests', CertificateRequestViewSet)

urlpatterns = [path('', include(router.urls))]
