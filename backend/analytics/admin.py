"""
Django Admin for Analytics
"""

from django.contrib import admin
from .models import (
    TenantMetric,
    UsageLog,
    TenantHealthAlert,
    ChurnPrediction,
    UpsellOpportunity
)


@admin.register(TenantMetric)
class TenantMetricAdmin(admin.ModelAdmin):
    """Admin interface for tenant metrics."""
    
    list_display = [
        'tenant', 'date', 'health_score', 'dau', 'total_users',
        'module_count', 'error_rate', 'api_calls'
    ]
    list_filter = ['date', 'health_score']
    search_fields = ['tenant__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Tenant & Date', {
            'fields': ('tenant', 'date')
        }),
        ('User Activity', {
            'fields': ('total_users', 'active_users', 'dau')
        }),
        ('Module Usage', {
            'fields': ('modules_used', 'module_count')
        }),
        ('Resource Usage', {
            'fields': ('storage_used_mb', 'database_rows', 'api_calls')
        }),
        ('Communication', {
            'fields': ('sms_sent', 'emails_sent')
        }),
        ('System Health', {
            'fields': ('error_count', 'error_rate', 'avg_response_time_ms')
        }),
        ('Health Score', {
            'fields': ('health_score',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    """Admin interface for usage logs."""
    
    list_display = [
        'tenant', 'user', 'action_type', 'module', 'is_error',
        'status_code', 'response_time_ms', 'created_at'
    ]
    list_filter = ['action_type', 'is_error', 'created_at']
    search_fields = ['tenant__name', 'user__email', 'endpoint']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('tenant', 'user', 'action_type', 'module', 'feature')
        }),
        ('Request Details', {
            'fields': ('endpoint', 'method', 'status_code', 'response_time_ms')
        }),
        ('Error Info', {
            'fields': ('is_error', 'error_message')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent')
        }),
    )


@admin.register(TenantHealthAlert)
class TenantHealthAlertAdmin(admin.ModelAdmin):
    """Admin interface for health alerts."""
    
    list_display = [
        'tenant', 'alert_type', 'severity', 'title',
        'current_value', 'is_resolved', 'created_at'
    ]
    list_filter = ['alert_type', 'severity', 'is_resolved', 'created_at']
    search_fields = ['tenant__name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Alert Info', {
            'fields': ('tenant', 'alert_type', 'severity')
        }),
        ('Details', {
            'fields': ('title', 'description')
        }),
        ('Metrics', {
            'fields': ('current_value', 'threshold_value')
        }),
        ('Resolution', {
            'fields': ('is_resolved', 'resolved_at', 'resolution_notes')
        }),
    )
    
    actions = ['mark_as_resolved']
    
    def mark_as_resolved(self, request, queryset):
        """Mark selected alerts as resolved."""
        from django.utils import timezone
        count = queryset.update(is_resolved=True, resolved_at=timezone.now())
        self.message_user(request, f'{count} alert(s) marked as resolved.')
    mark_as_resolved.short_description = 'Mark selected alerts as resolved'


@admin.register(ChurnPrediction)
class ChurnPredictionAdmin(admin.ModelAdmin):
    """Admin interface for churn predictions."""
    
    list_display = [
        'tenant', 'prediction_date', 'churn_probability',
        'risk_level', 'created_at'
    ]
    list_filter = ['risk_level', 'prediction_date', 'created_at']
    search_fields = ['tenant__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'prediction_date'
    
    fieldsets = (
        ('Prediction', {
            'fields': ('tenant', 'prediction_date', 'churn_probability', 'risk_level')
        }),
        ('Analysis', {
            'fields': ('factors', 'recommendations')
        }),
    )


@admin.register(UpsellOpportunity)
class UpsellOpportunityAdmin(admin.ModelAdmin):
    """Admin interface for upsell opportunities."""
    
    list_display = [
        'tenant', 'opportunity_type', 'title', 'estimated_value',
        'usage_percentage', 'is_contacted', 'is_converted', 'created_at'
    ]
    list_filter = ['opportunity_type', 'is_contacted', 'is_converted', 'created_at']
    search_fields = ['tenant__name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Opportunity', {
            'fields': ('tenant', 'opportunity_type', 'title', 'description')
        }),
        ('Suggestion', {
            'fields': ('suggested_plan', 'estimated_value')
        }),
        ('Metrics', {
            'fields': ('current_usage', 'limit', 'usage_percentage')
        }),
        ('Status', {
            'fields': ('is_contacted', 'contacted_at', 'is_converted', 'converted_at')
        }),
    )
    
    actions = ['mark_as_contacted', 'mark_as_converted']
    
    def mark_as_contacted(self, request, queryset):
        """Mark selected opportunities as contacted."""
        from django.utils import timezone
        count = queryset.update(is_contacted=True, contacted_at=timezone.now())
        self.message_user(request, f'{count} opportunity(ies) marked as contacted.')
    mark_as_contacted.short_description = 'Mark as contacted'
    
    def mark_as_converted(self, request, queryset):
        """Mark selected opportunities as converted."""
        from django.utils import timezone
        count = queryset.update(is_converted=True, converted_at=timezone.now())
        self.message_user(request, f'{count} opportunity(ies) marked as converted.')
    mark_as_converted.short_description = 'Mark as converted'
