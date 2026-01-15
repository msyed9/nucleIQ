"""
Communication Serializers
"""

from rest_framework import serializers
from .models import (
    CommunicationProvider, MessageTemplate, Notice,
    MessageLog, BroadcastMessage, SchoolEvent
)


class SchoolEventSerializer(serializers.ModelSerializer):
    """Serializer for SchoolEvent."""
    
    class Meta:
        model = SchoolEvent
        fields = [
            'id', 'title', 'description', 'event_type',
            'start_date', 'end_date', 'start_time', 'end_time',
            'is_all_day', 'location', 'notify_parents', 'notify_staff',
            'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommunicationProviderSerializer(serializers.ModelSerializer):
    """Serializer for CommunicationProvider."""
    
    class Meta:
        model = CommunicationProvider
        fields = [
            'id', 'name', 'provider_type', 'is_active', 'is_default',
            'config', 'daily_limit', 'monthly_limit',
            'total_sent', 'total_failed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_sent', 'total_failed', 'created_at', 'updated_at']
        extra_kwargs = {
            'config': {'write_only': True}  # Don't expose API keys
        }


class MessageTemplateSerializer(serializers.ModelSerializer):
    """Serializer for MessageTemplate."""
    
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'name', 'template_type', 'category', 'subject',
            'content', 'variables', 'is_active', 'whatsapp_template_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NoticeSerializer(serializers.ModelSerializer):
    """Serializer for Notice."""
    
    published_by_name = serializers.SerializerMethodField()
    target_class_names = serializers.SerializerMethodField()
    target_section_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'priority', 'target_audience',
            'target_classes', 'target_class_names',
            'target_sections', 'target_section_names',
            'attachment', 'published_by', 'published_by_name',
            'published_at', 'is_published', 'valid_from', 'valid_until',
            'send_sms', 'send_email', 'send_whatsapp', 'view_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'published_at', 'view_count', 'created_at', 'updated_at']
    
    def get_published_by_name(self, obj):
        return obj.published_by.get_full_name() if obj.published_by else None
    
    def get_target_class_names(self, obj):
        return [c.name for c in obj.target_classes.all()]
    
    def get_target_section_names(self, obj):
        return [s.name for s in obj.target_sections.all()]


class MessageLogSerializer(serializers.ModelSerializer):
    """Serializer for MessageLog."""
    
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = MessageLog
        fields = [
            'id', 'message_type', 'provider', 'provider_name',
            'template', 'template_name', 'notice',
            'recipient_type', 'recipient_id', 'recipient_name',
            'to_phone', 'to_email', 'subject', 'content',
            'status', 'sent_at', 'delivered_at',
            'provider_message_id', 'error_message', 'cost',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BroadcastMessageSerializer(serializers.ModelSerializer):
    """Serializer for BroadcastMessage."""
    
    sent_by_name = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = BroadcastMessage
        fields = [
            'id', 'title', 'message_type', 'template', 'template_name',
            'subject', 'content', 'target_audience',
            'target_classes', 'target_sections',
            'scheduled_at', 'status', 'sent_by', 'sent_by_name',
            'sent_at', 'total_recipients', 'total_sent',
            'total_delivered', 'total_failed',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sent_at', 'total_recipients', 'total_sent',
            'total_delivered', 'total_failed', 'created_at', 'updated_at'
        ]
    
    def get_sent_by_name(self, obj):
        return obj.sent_by.get_full_name() if obj.sent_by else None


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending individual messages."""
    
    message_type = serializers.ChoiceField(choices=['SMS', 'EMAIL', 'WHATSAPP'])
    recipient_type = serializers.CharField()
    recipient_id = serializers.UUIDField()
    to_phone = serializers.CharField(required=False, allow_blank=True)
    to_email = serializers.EmailField(required=False, allow_blank=True)
    subject = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField()
    template_id = serializers.UUIDField(required=False, allow_null=True)
