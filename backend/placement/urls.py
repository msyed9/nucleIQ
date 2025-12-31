from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecruiterViewSet, PlacementDriveViewSet, StudentApplicationViewSet

router = DefaultRouter()
router.register(r'recruiters', RecruiterViewSet)
router.register(r'drives', PlacementDriveViewSet)
router.register(r'applications', StudentApplicationViewSet)

urlpatterns = [path('', include(router.urls))]
