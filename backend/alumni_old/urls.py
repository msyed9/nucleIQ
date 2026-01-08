"""
Alumni URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlumniProfileViewSet, JobPostingViewSet, AlumniEventViewSet, DonationCampaignViewSet

router = DefaultRouter()
router.register(r'profiles', AlumniProfileViewSet)
router.register(r'jobs', JobPostingViewSet)
router.register(r'events', AlumniEventViewSet)
router.register(r'campaigns', DonationCampaignViewSet)

urlpatterns = [path('', include(router.urls))]
