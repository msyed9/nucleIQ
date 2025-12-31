"""
Django Admin for Staff
"""

from django.contrib import admin
from .models import Staff, StaffDocument, StaffAttendance, StaffLeave


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    """Admin interface for Staff."""
    
    list_display = [
        'employee_id', 'get_full_name', 'designation',
        'department', 'status', 'joining_date', 'phone'
    ]
    list_filter = ['designation', 'department', 'employment_type', 'status', 'gender']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'user', 'employee_id', 'first_name', 'middle_name', 'last_name',
                      'date_of_birth', 'gender', 'photo')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'alternate_phone', 'address', 'city', 'state',
                      'postal_code', 'country')
        }),
        ('Employment Details', {
            'fields': ('designation', 'department', 'employment_type', 'joining_date',
                      'leaving_date', 'status')
        }),
        ('Qualifications & Experience', {
            'fields': ('qualifications', 'experience_years', 'previous_experience', 'subjects_taught')
        }),
        ('Salary & Banking', {
            'fields': ('salary', 'bank_account_number', 'bank_name', 'bank_ifsc'),
            'classes': ('collapse',)
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('blood_group', 'aadhar_number', 'pan_number', 'remarks'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['subjects_taught']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Name'


@admin.register(StaffDocument)
class StaffDocumentAdmin(admin.ModelAdmin):
    """Admin interface for Staff Documents."""
    
    list_display = ['staff', 'document_type', 'title', 'uploaded_by', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['staff__first_name', 'staff__last_name', 'title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Document Information', {
            'fields': ('tenant', 'staff', 'document_type', 'title', 'description', 'file')
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(StaffAttendance)
class StaffAttendanceAdmin(admin.ModelAdmin):
    """Admin interface for Staff Attendance."""
    
    list_display = ['staff', 'date', 'status', 'check_in_time', 'check_out_time', 'marked_by']
    list_filter = ['status', 'date']
    search_fields = ['staff__first_name', 'staff__last_name', 'staff__employee_id']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Attendance Information', {
            'fields': ('tenant', 'staff', 'date', 'status', 'check_in_time', 'check_out_time', 'remarks')
        }),
        ('Metadata', {
            'fields': ('marked_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(StaffLeave)
class StaffLeaveAdmin(admin.ModelAdmin):
    """Admin interface for Staff Leave."""
    
    list_display = ['staff', 'leave_type', 'from_date', 'to_date', 'total_days', 'status']
    list_filter = ['leave_type', 'status', 'from_date']
    search_fields = ['staff__first_name', 'staff__last_name']
    readonly_fields = ['total_days', 'created_at', 'updated_at']
    date_hierarchy = 'from_date'
    
    fieldsets = (
        ('Leave Information', {
            'fields': ('tenant', 'staff', 'leave_type', 'from_date', 'to_date', 'total_days', 'reason')
        }),
        ('Approval', {
            'fields': ('status', 'approved_by', 'approval_date', 'approval_remarks')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['approve_leaves', 'reject_leaves']
    
    def approve_leaves(self, request, queryset):
        """Approve selected leave applications."""
        from django.utils import timezone
        
        count = queryset.filter(status='PENDING').update(
            status='APPROVED',
            approved_by=request.user,
            approval_date=timezone.now()
        )
        self.message_user(request, f'{count} leave(s) approved.')
    approve_leaves.short_description = 'Approve selected leaves'
    
    def reject_leaves(self, request, queryset):
        """Reject selected leave applications."""
        from django.utils import timezone
        
        count = queryset.filter(status='PENDING').update(
            status='REJECTED',
            approved_by=request.user,
            approval_date=timezone.now()
        )
        self.message_user(request, f'{count} leave(s) rejected.')
    reject_leaves.short_description = 'Reject selected leaves'
