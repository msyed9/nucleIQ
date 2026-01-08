"""
Notifications URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('notifications', views.NotificationViewSet, basename='notification')
router.register('email-campaigns', views.EmailCampaignViewSet, basename='email-campaign')
router.register('email-logs', views.EmailLogViewSet, basename='email-log')
router.register('sms-messages', views.SMSMessageViewSet, basename='sms-message')
router.register('whatsapp-messages', views.WhatsAppMessageViewSet, basename='whatsapp-message')
router.register('push-notifications', views.PushNotificationViewSet, basename='push-notification')
router.register('templates', views.CommunicationTemplateViewSet, basename='template')

urlpatterns = router.urls
