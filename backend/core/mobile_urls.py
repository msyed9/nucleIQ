from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .mobile_views import MobileConfigViewSet

router = DefaultRouter()
router.register(r'config', MobileConfigViewSet, basename='mobile-config')

urlpatterns = [
    path('', include(router.urls)),
]
