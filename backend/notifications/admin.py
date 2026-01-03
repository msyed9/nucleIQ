"""
Notifications Admin
"""

from django.contrib import admin
from .models import (
    Notification, EmailCampaign, EmailLog, SMSMessage,
    WhatsAppMessage, PushNotification, CommunicationTemplate
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification admin"""
    list_display = [
        'title', 'recipient', 'notification_type', 'priority',
        'is_read', 'created_at'
    ]
    list_filter = ['notification_type', 'priority', 'is_read', 'is_archived', 'created_at']
    search_fields = ['title', 'message', 'recipient__username', 'recipient__email']
    readonly_fields = ['created_at', 'read_at', 'archived_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('tenant', 'recipient', 'sender', 'title', 'message')
        }),
        ('Classification', {
            'fields': ('notification_type', 'priority', 'icon', 'action_url')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'is_archived', 'archived_at', 'expires_at')
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        })
    )


@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    """Email campaign admin"""
    list_display = [
        'name', 'subject', 'recipient_type', 'status',
        'sent_count', 'delivered_count', 'created_at'
    ]
    list_filter = ['status', 'recipient_type', 'created_at']
    search_fields = ['name', 'subject', 'body']
    readonly_fields = [
        'created_at', 'updated_at', 'sent_at', 'total_recipients',
        'sent_count', 'delivered_count', 'failed_count', 'opened_count', 'clicked_count'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Campaign Info', {
            'fields': ('tenant', 'created_by', 'name', 'subject', 'body', 'template')
        }),
        ('Recipients', {
            'fields': ('recipient_type', 'recipient_filters', 'recipient_emails')
        }),
        ('Schedule & Status', {
            'fields': ('status', 'scheduled_at', 'sent_at')
        }),
        ('Statistics', {
            'fields': (
                'total_recipients', 'sent_count', 'delivered_count',
                'failed_count', 'opened_count', 'clicked_count'
            )
        }),
        ('Attachments', {
            'fields': ('attachments',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    """Email log admin"""
    list_display = [
        'recipient_email', 'subject', 'status', 'campaign',
        'sent_at', 'delivered_at'
    ]
    list_filter = ['status', 'provider', 'created_at']
    search_fields = ['recipient_email', 'recipient_name', 'subject', 'message_id']
    readonly_fields = [
        'created_at', 'sent_at', 'delivered_at', 'opened_at',
        'clicked_at', 'bounced_at'
    ]
    date_hierarchy = 'created_at'


@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    """SMS message admin"""
    list_display = [
        'recipient_phone', 'recipient_name', 'message_type',
        'status', 'credits_used', 'sent_at'
    ]
    list_filter = ['message_type', 'status', 'provider', 'created_at']
    search_fields = ['recipient_phone', 'recipient_name', 'message', 'message_id']
    readonly_fields = [
        'created_at', 'sent_at', 'delivered_at', 'message_id',
        'credits_used', 'character_count', 'sms_parts'
    ]
    date_hierarchy = 'created_at'


@admin.register(WhatsAppMessage)
class WhatsAppMessageAdmin(admin.ModelAdmin):
    """WhatsApp message admin"""
    list_display = [
        'recipient_phone', 'recipient_name', 'message_type',
        'status', 'sent_at', 'read_at'
    ]
    list_filter = ['message_type', 'status', 'provider', 'created_at']
    search_fields = ['recipient_phone', 'recipient_name', 'message', 'message_id']
    readonly_fields = [
        'created_at', 'sent_at', 'delivered_at', 'read_at',
        'message_id', 'conversation_id'
    ]
    date_hierarchy = 'created_at'


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    """Push notification admin"""
    list_display = [
        'title', 'recipient', 'platform', 'status',
        'sent_at', 'delivered_at'
    ]
    list_filter = ['platform', 'status', 'provider', 'created_at']
    search_fields = ['title', 'body', 'recipient__username', 'message_id']
    readonly_fields = [
        'created_at', 'sent_at', 'delivered_at', 'clicked_at', 'message_id'
    ]
    date_hierarchy = 'created_at'


@admin.register(CommunicationTemplate)
class CommunicationTemplateAdmin(admin.ModelAdmin):
    """Communication template admin"""
    list_display = [
        'name', 'template_type', 'category', 'is_active',
        'usage_count', 'created_at'
    ]
    list_filter = ['template_type', 'category', 'is_active', 'created_at']
    search_fields = ['name', 'subject', 'body']
    readonly_fields = ['created_at', 'updated_at', 'usage_count']
    
    fieldsets = (
        ('Template Info', {
            'fields': ('tenant', 'created_by', 'name', 'template_type', 'category')
        }),
        ('Content', {
            'fields': ('subject', 'body')
        }),
        ('Variables', {
            'fields': ('variables',)
        }),
        ('Status', {
            'fields': ('is_active', 'usage_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )
