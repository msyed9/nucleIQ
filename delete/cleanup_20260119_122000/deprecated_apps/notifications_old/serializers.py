"""
Notifications Serializers
"""

from rest_framework import serializers
from .models import (
    Notification, EmailCampaign, EmailLog, SMSMessage,
    WhatsAppMessage, PushNotification, CommunicationTemplate
)


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer"""
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'tenant', 'recipient', 'sender', 'sender_name',
            'title', 'message', 'notification_type', 'priority',
            'action_url', 'icon', 'is_read', 'read_at',
            'is_archived', 'archived_at', 'created_at', 'expires_at',
            'metadata', 'time_ago'
        ]
        read_only_fields = ['tenant', 'created_at', 'read_at', 'archived_at']
        
    def get_time_ago(self, obj):
        """Get relative time"""
        from django.utils.timesince import timesince
        return timesince(obj.created_at)


class EmailCampaignSerializer(serializers.ModelSerializer):
    """Email campaign serializer"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    delivery_rate = serializers.ReadOnlyField()
    open_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = EmailCampaign
        fields = [
            'id', 'tenant', 'created_by', 'created_by_name', 'name',
            'subject', 'body', 'template', 'recipient_type',
            'recipient_filters', 'recipient_emails', 'status',
            'scheduled_at', 'sent_at', 'total_recipients',
            'sent_count', 'delivered_count', 'failed_count',
            'opened_count', 'clicked_count', 'attachments',
            'delivery_rate', 'open_rate', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'tenant', 'created_by', 'sent_at', 'total_recipients',
            'sent_count', 'delivered_count', 'failed_count',
            'opened_count', 'clicked_count', 'created_at', 'updated_at'
        ]


class EmailLogSerializer(serializers.ModelSerializer):
    """Email log serializer"""
    class Meta:
        model = EmailLog
        fields = [
            'id', 'tenant', 'campaign', 'recipient_email',
            'recipient_name', 'subject', 'body', 'status',
            'sent_at', 'delivered_at', 'opened_at', 'clicked_at',
            'bounced_at', 'error_message', 'provider',
            'message_id', 'metadata', 'created_at'
        ]
        read_only_fields = ['tenant', 'created_at']


class SMSMessageSerializer(serializers.ModelSerializer):
    """SMS message serializer"""
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)
    character_count = serializers.ReadOnlyField()
    sms_parts = serializers.ReadOnlyField()
    
    class Meta:
        model = SMSMessage
        fields = [
            'id', 'tenant', 'sent_by', 'sent_by_name',
            'recipient_phone', 'recipient_name', 'message',
            'message_type', 'status', 'scheduled_at', 'sent_at',
            'delivered_at', 'provider', 'message_id',
            'credits_used', 'error_message', 'metadata',
            'character_count', 'sms_parts', 'created_at'
        ]
        read_only_fields = [
            'tenant', 'sent_by', 'status', 'sent_at',
            'delivered_at', 'message_id', 'credits_used',
            'error_message', 'created_at'
        ]


class WhatsAppMessageSerializer(serializers.ModelSerializer):
    """WhatsApp message serializer"""
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)
    
    class Meta:
        model = WhatsAppMessage
        fields = [
            'id', 'tenant', 'sent_by', 'sent_by_name',
            'recipient_phone', 'recipient_name', 'message_type',
            'message', 'media_url', 'template_name',
            'template_params', 'status', 'scheduled_at', 'sent_at',
            'delivered_at', 'read_at', 'provider', 'message_id',
            'conversation_id', 'error_message', 'metadata',
            'created_at'
        ]
        read_only_fields = [
            'tenant', 'sent_by', 'status', 'sent_at',
            'delivered_at', 'read_at', 'message_id',
            'conversation_id', 'error_message', 'created_at'
        ]


class PushNotificationSerializer(serializers.ModelSerializer):
    """Push notification serializer"""
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    
    class Meta:
        model = PushNotification
        fields = [
            'id', 'tenant', 'sent_by', 'sent_by_name', 'recipient',
            'recipient_name', 'title', 'body', 'icon', 'image',
            'platform', 'action_url', 'data', 'status', 'sent_at',
            'delivered_at', 'clicked_at', 'device_tokens',
            'provider', 'message_id', 'error_message', 'created_at'
        ]
        read_only_fields = [
            'tenant', 'sent_by', 'status', 'sent_at',
            'delivered_at', 'clicked_at', 'message_id',
            'error_message', 'created_at'
        ]


class CommunicationTemplateSerializer(serializers.ModelSerializer):
    """Communication template serializer"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CommunicationTemplate
        fields = [
            'id', 'tenant', 'created_by', 'created_by_name', 'name',
            'template_type', 'category', 'subject', 'body',
            'variables', 'is_active', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'tenant', 'created_by', 'usage_count',
            'created_at', 'updated_at'
        ]
