"""
Security Admin Configuration
"""

from django.contrib import admin
from .models import GatePass, GateLog, CampusVisitor, CampusVisitorLog


class GateLogInline(admin.TabularInline):
    model = GateLog
    extra = 0
    fields = ['scanned_at', 'action', 'guard', 'notes']
    readonly_fields = ['scanned_at']
    can_delete = False


@admin.register(GatePass)
class GatePassAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'pass_type', 'status', 'valid_from', 'valid_until', 'approved_by']
    list_filter = ['pass_type', 'status', 'valid_from']
    search_fields = ['visitor_name', 'student__user__first_name', 'student__user__last_name', 'reason']
    raw_id_fields = ['student', 'approved_by']
    readonly_fields = ['token', 'created_at', 'updated_at']
    ordering = ['-created_at']
    inlines = [GateLogInline]
    
    fieldsets = (
        ('Pass Information', {
            'fields': ('pass_type', 'student', 'visitor_name', 'reason')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until')
        }),
        ('Approval', {
            'fields': ('status', 'approved_by', 'approved_at', 'rejection_reason')
        }),
        ('Security', {
            'fields': ('token',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_name(self, obj):
        if obj.student:
            return obj.student.get_full_name()
        return obj.visitor_name
    get_name.short_description = 'Name'


@admin.register(GateLog)
class GateLogAdmin(admin.ModelAdmin):
    list_display = ['gate_pass', 'action', 'scanned_at', 'guard']
    list_filter = ['action', 'scanned_at']
    search_fields = ['gate_pass__visitor_name', 'notes']
    raw_id_fields = ['gate_pass', 'guard']
    readonly_fields = ['scanned_at', 'created_at']
    ordering = ['-scanned_at']


class VisitorLogInline(admin.TabularInline):
    model = CampusVisitorLog
    extra = 0
    fields = ['timestamp', 'location', 'action', 'logged_by', 'notes']
    readonly_fields = ['timestamp']
    can_delete = False


@admin.register(CampusVisitor)
class CampusVisitorAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'visitor_type', 'person_to_meet', 'check_in_time', 'check_out_time', 'status']
    list_filter = ['visitor_type', 'status', 'check_in_time']
    search_fields = ['name', 'phone', 'email', 'organization', 'purpose']
    raw_id_fields = ['person_to_meet', 'checked_in_by', 'checked_out_by']
    readonly_fields = ['check_in_time', 'created_at', 'updated_at']
    ordering = ['-check_in_time']
    inlines = [VisitorLogInline]
    
    fieldsets = (
        ('Visitor Information', {
            'fields': ('name', 'phone', 'email', 'visitor_type', 'organization')
        }),
        ('Identification', {
            'fields': ('id_proof_type', 'id_proof_number', 'photo', 'signature')
        }),
        ('Visit Details', {
            'fields': ('purpose', 'person_to_meet', 'department_to_visit')
        }),
        ('Check-in/Check-out', {
            'fields': ('check_in_time', 'expected_checkout_time', 'check_out_time', 'status')
        }),
        ('Security', {
            'fields': ('checked_in_by', 'checked_out_by', 'badge_number', 'badge_returned')
        }),
        ('Additional Information', {
            'fields': ('vehicle_number', 'items_carried', 'notes')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CampusVisitorLog)
class CampusVisitorLogAdmin(admin.ModelAdmin):
    list_display = ['visitor', 'timestamp', 'location', 'action', 'logged_by']
    list_filter = ['timestamp', 'location']
    search_fields = ['visitor__name', 'action', 'notes']
    raw_id_fields = ['visitor', 'logged_by']
    readonly_fields = ['timestamp', 'created_at']
    ordering = ['-timestamp']
