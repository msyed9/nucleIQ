"""
Communication Admin Configuration
"""

from django.contrib import admin
from .models import (
    CommunicationProvider, MessageTemplate, Notice,
    MessageLog, BroadcastMessage
)


@admin.register(CommunicationProvider)
class CommunicationProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider_type', 'is_active', 'is_default', 'total_sent', 'total_failed']
    list_filter = ['provider_type', 'is_active', 'is_default']
    search_fields = ['name']
    ordering = ['provider_type', 'name']


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'category', 'is_active']
    list_filter = ['template_type', 'category', 'is_active']
    search_fields = ['name', 'content']
    ordering = ['category', 'name']


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ['title', 'priority', 'target_audience', 'is_published', 'published_at', 'view_count']
    list_filter = ['priority', 'target_audience', 'is_published']
    search_fields = ['title', 'content']
    readonly_fields = ['published_at', 'view_count']
    ordering = ['-published_at', '-created_at']
    filter_horizontal = ['target_classes', 'target_sections']


@admin.register(MessageLog)
class MessageLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_name', 'message_type', 'status', 'sent_at', 'provider']
    list_filter = ['message_type', 'status', 'recipient_type']
    search_fields = ['recipient_name', 'content']
    readonly_fields = ['sent_at', 'delivered_at']
    ordering = ['-created_at']


@admin.register(BroadcastMessage)
class BroadcastMessageAdmin(admin.ModelAdmin):
    list_display = ['title', 'message_type', 'status', 'total_recipients', 'total_sent', 'sent_at']
    list_filter = ['message_type', 'status', 'target_audience']
    search_fields = ['title', 'content']
    readonly_fields = ['sent_at', 'total_recipients', 'total_sent', 'total_delivered', 'total_failed']
    ordering = ['-created_at']
    filter_horizontal = ['target_classes', 'target_sections']
