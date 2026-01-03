"""
Reports Django Admin Configuration
"""

from django.contrib import admin
from .models import (
    ReportTemplate,
    GeneratedReport,
    ScheduledReport,
    ReportWidget,
    CustomReportQuery
)


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'output_format', 'is_public', 'created_by', 'created_at']
    list_filter = ['category', 'output_format', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'tenant')
        }),
        ('Data Configuration', {
            'fields': ('data_source', 'fields', 'filters', 'grouping', 'aggregations', 'sorting')
        }),
        ('Output Configuration', {
            'fields': ('output_format', 'template_file', 'include_charts', 'chart_config')
        }),
        ('Access Control', {
            'fields': ('is_public', 'created_by')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'status', 'format', 'rows_count', 'generated_by', 'generated_at']
    list_filter = ['status', 'format', 'generated_at']
    search_fields = ['name', 'template__name']
    readonly_fields = ['generated_at', 'completed_at', 'file_size', 'generation_time']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'template', 'tenant', 'status')
        }),
        ('Generation Details', {
            'fields': ('generated_by', 'generated_at', 'completed_at', 'generation_time')
        }),
        ('Parameters', {
            'fields': ('filters_used', 'date_range_start', 'date_range_end')
        }),
        ('Output', {
            'fields': ('format', 'file', 'file_size', 'rows_count')
        }),
        ('Error Handling', {
            'fields': ('error_message',)
        }),
    )


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'frequency', 'is_active', 'next_run', 'last_run']
    list_filter = ['frequency', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['last_run', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'template', 'tenant')
        }),
        ('Schedule Configuration', {
            'fields': ('frequency', 'day_of_week', 'day_of_month', 'time', 'is_active')
        }),
        ('Email Configuration', {
            'fields': ('email_recipients', 'email_subject', 'email_body', 'include_as_attachment')
        }),
        ('Status', {
            'fields': ('last_run', 'next_run')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportWidget)
class ReportWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'width', 'height', 'order', 'is_public']
    list_filter = ['widget_type', 'is_public']
    search_fields = ['name']
    list_editable = ['order']


@admin.register(CustomReportQuery)
class CustomReportQueryAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_model', 'is_shared', 'execution_count', 'created_by', 'created_at']
    list_filter = ['is_shared', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['execution_count', 'last_executed', 'created_at', 'updated_at']
