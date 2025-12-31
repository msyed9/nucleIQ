"""
HR Admin Configuration
"""

from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveApplication


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'default_quota', 'is_paid', 'requires_approval', 'is_active']
    list_filter = ['is_paid', 'requires_approval', 'is_active', 'carry_forward']
    search_fields = ['name', 'code', 'description']
    ordering = ['name']


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['staff', 'leave_type', 'academic_year', 'total_quota', 'used', 'pending', 'get_available']
    list_filter = ['leave_type', 'academic_year']
    search_fields = ['staff__first_name', 'staff__last_name']
    raw_id_fields = ['staff', 'leave_type', 'academic_year']
    ordering = ['staff__first_name']
    
    def get_available(self, obj):
        return obj.available
    get_available.short_description = 'Available'


@admin.register(LeaveApplication)
class LeaveApplicationAdmin(admin.ModelAdmin):
    list_display = ['staff', 'leave_type', 'start_date', 'end_date', 'total_days', 'status', 'applied_on']
    list_filter = ['status', 'leave_type', 'applied_on']
    search_fields = ['staff__first_name', 'staff__last_name', 'reason']
    raw_id_fields = ['staff', 'leave_type', 'approved_by']
    readonly_fields = ['applied_on', 'approved_on', 'total_days']
    ordering = ['-applied_on']
    
    fieldsets = (
        ('Application Details', {
            'fields': ('staff', 'leave_type', 'start_date', 'end_date', 'total_days', 'reason', 'attachment')
        }),
        ('Status', {
            'fields': ('status', 'applied_on')
        }),
        ('Approval', {
            'fields': ('approved_by', 'approved_on', 'approval_remarks')
        }),
    )
