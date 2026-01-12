"""
ID Cards Admin Interface
"""

from django.contrib import admin
from .models import (
    IDCardTemplate,
    IDCardQRCode,
    IDCardRecord,
    IDCardGenerationJob,
    QRAttendance
)


@admin.register(IDCardTemplate)
class IDCardTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'tenant', 'entity_type', 'orientation',
        'is_default', 'is_system', 'is_active', 'created_at'
    ]
    list_filter = ['entity_type', 'orientation', 'is_default', 'is_system', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'name', 'description', 'entity_type')
        }),
        ('Layout', {
            'fields': ('orientation', 'width', 'height')
        }),
        ('Configuration', {
            'fields': ('config', 'background_type', 'background_value')
        }),
        ('Settings', {
            'fields': ('is_default', 'is_system', 'is_active', 'version', 'parent_template')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(IDCardQRCode)
class IDCardQRCodeAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tenant', 'entity_type', 'entity_id',
        'is_active', 'valid_until', 'scan_count', 'last_scanned'
    ]
    list_filter = ['entity_type', 'is_active', 'valid_until']
    search_fields = ['entity_id', 'qr_hash']
    readonly_fields = ['id', 'qr_hash', 'issued_date', 'scan_count', 'last_scanned']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'entity_type', 'entity_id')
        }),
        ('QR Data', {
            'fields': ('qr_data', 'qr_hash')
        }),
        ('Validity', {
            'fields': ('issued_date', 'valid_until', 'is_active')
        }),
        ('Usage', {
            'fields': ('scan_count', 'last_scanned', 'id_card')
        }),
    )


@admin.register(IDCardRecord)
class IDCardRecordAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tenant', 'entity_type', 'entity_id',
        'template', 'status', 'issued_date', 'printed_count'
    ]
    list_filter = ['entity_type', 'status', 'file_format', 'issued_date']
    search_fields = ['entity_id']
    readonly_fields = ['id', 'issued_date', 'printed_count', 'last_printed']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'entity_type', 'entity_id', 'template')
        }),
        ('File', {
            'fields': ('file_url', 'file_format')
        }),
        ('Status', {
            'fields': ('status', 'issued_date', 'valid_until')
        }),
        ('Printing', {
            'fields': ('printed_count', 'last_printed')
        }),
        ('Bulk Generation', {
            'fields': ('bulk_job',)
        }),
    )


@admin.register(IDCardGenerationJob)
class IDCardGenerationJobAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tenant', 'entity_type', 'status',
        'progress', 'total_cards', 'completed_cards', 'failed_cards',
        'created_at', 'created_by'
    ]
    list_filter = ['entity_type', 'status', 'output_format', 'layout', 'created_at']
    search_fields = ['id', 'celery_task_id']
    readonly_fields = [
        'id', 'progress', 'total_cards', 'completed_cards', 'failed_cards',
        'started_at', 'completed_at', 'celery_task_id', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'entity_type', 'filters', 'template')
        }),
        ('Configuration', {
            'fields': ('output_format', 'layout', 'include_qr')
        }),
        ('Status', {
            'fields': (
                'status', 'progress', 'total_cards', 'completed_cards',
                'failed_cards', 'error_message'
            )
        }),
        ('Results', {
            'fields': ('download_url', 'individual_files')
        }),
        ('Execution', {
            'fields': ('started_at', 'completed_at', 'celery_task_id')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QRAttendance)
class QRAttendanceAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tenant', 'student', 'staff',
        'scan_timestamp', 'attendance_status', 'scan_location',
        'is_duplicate', 'is_valid_scan'
    ]
    list_filter = [
        'attendance_status', 'scan_type', 'is_duplicate',
        'is_valid_scan', 'scan_timestamp'
    ]
    search_fields = ['student__first_name', 'student__last_name', 'staff__first_name', 'staff__last_name']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'scan_timestamp'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'qr_code', 'student', 'staff')
        }),
        ('Scan Details', {
            'fields': (
                'scan_timestamp', 'scan_location', 'scan_device', 'scan_type'
            )
        }),
        ('Attendance', {
            'fields': ('attendance_status', 'linked_attendance')
        }),
        ('Validation', {
            'fields': ('is_duplicate', 'is_valid_scan', 'validation_notes')
        }),
    )
