"""
Helpdesk Admin Configuration
"""

from django.contrib import admin
from .models import HelpdeskTicket, TicketComment


class TicketCommentInline(admin.TabularInline):
    model = TicketComment
    extra = 0
    fields = ['commented_by', 'content', 'created_at']
    readonly_fields = ['created_at']
    can_delete = False


@admin.register(HelpdeskTicket)
class HelpdeskTicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'category', 'raised_by', 'assigned_to', 'status', 'priority', 'created_at']
    list_filter = ['category', 'status', 'priority', 'created_at']
    search_fields = ['subject', 'description', 'raised_by__email']
    raw_id_fields = ['raised_by', 'assigned_to']
    readonly_fields = ['created_at', 'resolved_at']
    ordering = ['-created_at']
    inlines = [TicketCommentInline]
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('category', 'subject', 'description', 'priority')
        }),
        ('Assignment', {
            'fields': ('raised_by', 'assigned_to', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'commented_by', 'created_at', 'content_preview']
    list_filter = ['created_at']
    search_fields = ['content', 'ticket__subject']
    raw_id_fields = ['ticket', 'commented_by']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
