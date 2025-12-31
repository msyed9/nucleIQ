"""
Communication URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommunicationProviderViewSet, MessageTemplateViewSet,
    NoticeViewSet, MessageLogViewSet, BroadcastMessageViewSet
)

router = DefaultRouter()
router.register(r'providers', CommunicationProviderViewSet, basename='communicationprovider')
router.register(r'templates', MessageTemplateViewSet, basename='messagetemplate')
router.register(r'notices', NoticeViewSet, basename='notice')
router.register(r'logs', MessageLogViewSet, basename='messagelog')
router.register(r'broadcasts', BroadcastMessageViewSet, basename='broadcastmessage')

urlpatterns = [
    path('', include(router.urls)),
]
