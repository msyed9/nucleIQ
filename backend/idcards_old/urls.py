"""
URL Configuration for ID Cards
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IDCardTemplateViewSet, IDCardDesignViewSet, IDCardGenerationViewSet

router = DefaultRouter()
router.register(r'templates', IDCardTemplateViewSet, basename='idcard-template')
router.register(r'designs', IDCardDesignViewSet, basename='idcard-design')
router.register(r'generations', IDCardGenerationViewSet, basename='idcard-generation')

urlpatterns = [
    path('', include(router.urls)),
]
