"""
CRM URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, LeadInteractionViewSet, LeadDocumentViewSet,
    VisitorViewSet, PublicLeadViewSet
)

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'interactions', LeadInteractionViewSet, basename='leadinteraction')
router.register(r'documents', LeadDocumentViewSet, basename='leaddocument')
router.register(r'visitors', VisitorViewSet, basename='visitor')

urlpatterns = [
    path('', include(router.urls)),
    path('public/lead/', PublicLeadViewSet.as_view({'post': 'create'}), name='public-lead'),
]
