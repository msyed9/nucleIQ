"""
Django Admin for Attendance
"""

from django.contrib import admin
from .models import AttendanceRecord, AttendanceConfiguration, AttendanceMonthlyAggregate, QRCodeToken


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    """Admin interface for Attendance Records."""
    
    list_display = ['get_entity_name', 'record_type', 'date', 'status', 'method', 'check_in_time']
    list_filter = ['record_type', 'status', 'method', 'date']
    search_fields = ['student__first_name', 'student__last_name', 'staff__first_name', 'staff__last_name']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'record_type', 'student', 'staff', 'date', 'status', 'method', 'academic_year')
        }),
        ('Time Tracking', {
            'fields': ('check_in_time', 'check_out_time')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Event Details', {
            'fields': ('is_event_day', 'event_name'),
            'classes': ('collapse',)
        }),
        ('Additional Info', {
            'fields': ('marked_by', 'device_id', 'remarks'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_entity_name(self, obj):
        if obj.record_type == 'STUDENT':
            return obj.student.get_full_name() if obj.student else 'N/A'
        return obj.staff.get_full_name() if obj.staff else 'N/A'
    get_entity_name.short_description = 'Name'


@admin.register(AttendanceConfiguration)
class AttendanceConfigurationAdmin(admin.ModelAdmin):
    """Admin interface for Attendance Configuration."""
    
    list_display = ['tenant', 'student_cutoff_time', 'staff_cutoff_time', 'enable_monthly_whatsapp_reports']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Student Settings', {
            'fields': ('student_cutoff_time', 'student_late_threshold_minutes')
        }),
        ('Staff Settings', {
            'fields': ('staff_cutoff_time', 'staff_shift_start_time', 'staff_late_buffer_minutes', 'late_marks_for_half_day')
        }),
        ('Alert Settings', {
            'fields': ('consecutive_absents_alert',)
        }),
        ('Reporting', {
            'fields': ('enable_monthly_whatsapp_reports',)
        }),
    )


@admin.register(AttendanceMonthlyAggregate)
class AttendanceMonthlyAggregateAdmin(admin.ModelAdmin):
    """Admin interface for Monthly Aggregates."""
    
    list_display = ['get_entity_name', 'month', 'attendance_percentage', 'present_days', 'absent_days', 'working_days']
    list_filter = ['record_type', 'month']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Entity', {
            'fields': ('tenant', 'record_type', 'student', 'staff', 'academic_year', 'month')
        }),
        ('Statistics', {
            'fields': ('total_days', 'working_days', 'present_days', 'absent_days', 'late_days', 'half_days', 'leave_days', 'attendance_percentage')
        }),
        ('Report', {
            'fields': ('report_pdf', 'report_generated_at', 'whatsapp_sent'),
            'classes': ('collapse',)
        }),
    )
    
    def get_entity_name(self, obj):
        if obj.record_type == 'STUDENT':
            return obj.student.get_full_name() if obj.student else 'N/A'
        return obj.staff.get_full_name() if obj.staff else 'N/A'
    get_entity_name.short_description = 'Name'


@admin.register(QRCodeToken)
class QRCodeTokenAdmin(admin.ModelAdmin):
    """Admin interface for QR Code Tokens."""
    
    list_display = ['get_entity_name', 'token', 'valid_date', 'is_active']
    list_filter = ['valid_date', 'is_active']
    search_fields = ['token', 'teacher__first_name', 'teacher__last_name', 'student__first_name', 'student__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_entity_name(self, obj):
        if obj.teacher:
            return f"Teacher: {obj.teacher.get_full_name()}"
        return f"Student: {obj.student.get_full_name()}" if obj.student else 'N/A'
    get_entity_name.short_description = 'Entity'
