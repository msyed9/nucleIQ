from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LiveClassViewSet

router = DefaultRouter()
router.register(r'live', LiveClassViewSet)

urlpatterns = [path('', include(router.urls))]
