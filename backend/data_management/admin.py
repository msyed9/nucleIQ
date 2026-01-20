"""
Data Management Admin Configuration
"""

from django.contrib import admin
from .models import ImportJob, ImportFieldMapping


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    """Admin for ImportJob model"""
    
    list_display = [
        'id', 'module', 'status', 'original_filename',
        'total_rows', 'successful_rows', 'failed_rows',
        'created_by', 'created_at'
    ]
    
    list_filter = ['status', 'module', 'created_at', 'tenant']
    search_fields = ['original_filename', 'module']
    readonly_fields = [
        'id', 'tenant', 'module', 'status', 'original_filename', 'file_type',
        'total_rows', 'processed_rows', 'successful_rows', 'failed_rows',
        'duplicate_rows', 'created_record_ids', 'validation_errors',
        'preview_data', 'skip_duplicates', 'update_existing',
        'created_by', 'created_at', 'completed_at'
    ]
    
    ordering = ['-created_at']
    
    fieldsets = (
        ('Job Information', {
            'fields': ('id', 'tenant', 'module', 'status', 'original_filename', 'file_type')
        }),
        ('Progress', {
            'fields': ('total_rows', 'processed_rows', 'successful_rows', 'failed_rows', 'duplicate_rows')
        }),
        ('Options', {
            'fields': ('skip_duplicates', 'update_existing')
        }),
        ('Results', {
            'fields': ('validation_errors', 'created_record_ids'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'completed_at')
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ImportFieldMapping)
class ImportFieldMappingAdmin(admin.ModelAdmin):
    """Admin for ImportFieldMapping model"""
    
    list_display = ['tenant', 'module', 'source_column', 'target_field', 'is_active']
    list_filter = ['tenant', 'module', 'is_active']
    search_fields = ['source_column', 'target_field']
    
    fieldsets = (
        (None, {
            'fields': ('tenant', 'module', 'source_column', 'target_field', 'is_active')
        }),
    )
