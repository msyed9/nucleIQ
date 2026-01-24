"""
Notifications Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from .models import (
    Notification, EmailCampaign, EmailLog, SMSMessage,
    WhatsAppMessage, PushNotification, CommunicationTemplate
)
from .serializers import (
    NotificationSerializer, EmailCampaignSerializer, EmailLogSerializer,
    SMSMessageSerializer, WhatsAppMessageSerializer, PushNotificationSerializer,
    CommunicationTemplateSerializer
)
from .services import NotificationService, SMSService, EmailService


class NotificationViewSet(viewsets.ModelViewSet):
    """Notification viewset"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by current user"""
        return Notification.objects.filter(
            tenant=self.request.user.tenant,
            recipient=self.request.user
        )
        
    def perform_create(self, serializer):
        """Set tenant and sender"""
        serializer.save(
            tenant=self.request.user.tenant,
            sender=self.request.user
        )
        
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'notification marked as read'})
        
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive notification"""
        notification = self.get_object()
        notification.archive()
        return Response({'status': 'notification archived'})
        
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'count': count})
        
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notification count"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
        
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics"""
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'unread': queryset.filter(is_read=False).count(),
            'archived': queryset.filter(is_archived=True).count(),
            'by_type': queryset.values('notification_type').annotate(
                count=Count('id')
            )
        }
        return Response(stats)


class EmailCampaignViewSet(viewsets.ModelViewSet):
    """Email campaign viewset"""
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant"""
        return EmailCampaign.objects.filter(tenant=self.request.user.tenant)
        
    def perform_create(self, serializer):
        """Set tenant and created_by"""
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
        
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send email campaign"""
        campaign = self.get_object()
        
        if campaign.status != 'DRAFT':
            return Response(
                {'error': 'Only draft campaigns can be sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update status
        campaign.status = 'SENDING'
        campaign.save()

        # Minimal async sender using a background thread for deprecated app
        import threading

        def _send_campaign_background(campaign_id):
            try:
                campaign_obj = EmailCampaign.objects.get(id=campaign_id)
                email_service = EmailService()
                total = 0
                sent = 0

                recipients = list(campaign_obj.recipient_emails or [])
                # If no manual list provided, we don't resolve recipient types here (deprecated)
                campaign_obj.total_recipients = len(recipients)
                campaign_obj.save(update_fields=['total_recipients'])

                for email in recipients:
                    total += 1
                    try:
                        result = email_service.send_email(
                            to_email=email,
                            subject=campaign_obj.subject,
                            body=campaign_obj.body,
                        )

                        log = EmailLog.objects.create(
                            tenant=campaign_obj.tenant,
                            campaign=campaign_obj,
                            recipient_email=email,
                            subject=campaign_obj.subject,
                            body=campaign_obj.body,
                            status='SENT' if result.get('success') else 'FAILED',
                            sent_at=timezone.now() if result.get('success') else None,
                            error_message=result.get('error', '')
                        )

                        if result.get('success'):
                            sent += 1
                            campaign_obj.sent_count = campaign_obj.sent_count + 1
                            campaign_obj.delivered_count = campaign_obj.delivered_count + 1
                        else:
                            campaign_obj.failed_count = campaign_obj.failed_count + 1

                        campaign_obj.save(update_fields=['sent_count', 'delivered_count', 'failed_count'])

                    except Exception as e:
                        EmailLog.objects.create(
                            tenant=campaign_obj.tenant,
                            campaign=campaign_obj,
                            recipient_email=email,
                            subject=campaign_obj.subject,
                            body=campaign_obj.body,
                            status='FAILED',
                            error_message=str(e)
                        )

                campaign_obj.status = 'SENT' if sent == total else 'SENT' if sent > 0 else 'FAILED'
                campaign_obj.sent_at = timezone.now()
                campaign_obj.save(update_fields=['status', 'sent_at'])
            except Exception:
                import logging
                logging.exception('Failed to send email campaign in background')

        thread = threading.Thread(target=_send_campaign_background, args=(campaign.id,), daemon=True)
        thread.start()

        return Response({'status': 'campaign queued for sending'})
        
    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        """Schedule email campaign"""
        campaign = self.get_object()
        scheduled_at = request.data.get('scheduled_at')
        
        if not scheduled_at:
            return Response(
                {'error': 'scheduled_at is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        campaign.scheduled_at = scheduled_at
        campaign.status = 'SCHEDULED'
        campaign.save()
        
        return Response({'status': 'campaign scheduled'})
        
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel email campaign"""
        campaign = self.get_object()
        
        if campaign.status not in ['DRAFT', 'SCHEDULED']:
            return Response(
                {'error': 'Only draft/scheduled campaigns can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        campaign.status = 'CANCELLED'
        campaign.save()
        
        return Response({'status': 'campaign cancelled'})


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Email log viewset (read-only)"""
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant"""
        return EmailLog.objects.filter(tenant=self.request.user.tenant)


class SMSMessageViewSet(viewsets.ModelViewSet):
    """SMS message viewset"""
    serializer_class = SMSMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant"""
        return SMSMessage.objects.filter(tenant=self.request.user.tenant)
        
    def perform_create(self, serializer):
        """Send SMS and save record"""
        tenant = self.request.user.tenant
        sent_by = self.request.user
        
        # Create SMS record
        sms = serializer.save(tenant=tenant, sent_by=sent_by)
        
        # Send SMS
        sms_service = SMSService()
        result = sms_service.send_sms(
            phone=sms.recipient_phone,
            message=sms.message,
            message_type=sms.message_type
        )
        
        # Update SMS record
        if result['success']:
            sms.status = 'SENT'
            sms.sent_at = timezone.now()
            sms.message_id = result.get('message_id', '')
            sms.credits_used = result.get('credits_used', 0)
        else:
            sms.status = 'FAILED'
            sms.error_message = result.get('error', '')
            
        sms.save()
        
    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Get SMS balance"""
        sms_service = SMSService()
        balance = sms_service.get_balance()
        return Response(balance or {'error': 'Unable to fetch balance'})


class WhatsAppMessageViewSet(viewsets.ModelViewSet):
    """WhatsApp message viewset"""
    serializer_class = WhatsAppMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant"""
        return WhatsAppMessage.objects.filter(tenant=self.request.user.tenant)
        
    def perform_create(self, serializer):
        """Set tenant and sent_by"""
        serializer.save(
            tenant=self.request.user.tenant,
            sent_by=self.request.user
        )


class PushNotificationViewSet(viewsets.ModelViewSet):
    """Push notification viewset"""
    serializer_class = PushNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant"""
        return PushNotification.objects.filter(tenant=self.request.user.tenant)
        
    def perform_create(self, serializer):
        """Set tenant and sent_by"""
        serializer.save(
            tenant=self.request.user.tenant,
            sent_by=self.request.user
        )


class CommunicationTemplateViewSet(viewsets.ModelViewSet):
    """Communication template viewset"""
    serializer_class = CommunicationTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant"""
        return CommunicationTemplate.objects.filter(
            tenant=self.request.user.tenant
        )
        
    def perform_create(self, serializer):
        """Set tenant and created_by"""
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
        
    @action(detail=True, methods=['post'])
    def render(self, request, pk=None):
        """Render template with context"""
        template = self.get_object()
        context = request.data.get('context', {})
        
        rendered = template.render(context)
        return Response({'rendered': rendered})
        
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate template"""
        template = self.get_object()
        
        # Create duplicate
        duplicate = CommunicationTemplate.objects.create(
            tenant=template.tenant,
            created_by=self.request.user,
            name=f"{template.name} (Copy)",
            template_type=template.template_type,
            category=template.category,
            subject=template.subject,
            body=template.body,
            variables=template.variables
        )
        
        serializer = self.get_serializer(duplicate)
        return Response(serializer.data)
