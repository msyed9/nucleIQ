"""
Timetable Admin Configuration
"""

from django.contrib import admin
from .models import TimetableSlot, TimetableTemplate, TimetablePeriodConfig, SubjectSectionLoad


@admin.register(TimetableSlot)
class TimetableSlotAdmin(admin.ModelAdmin):
    """
    Admin interface for TimetableSlot.
    """
    
    list_display = [
        'section',
        'subject',
        'teacher',
        'day_of_week',
        'start_time',
        'end_time',
        'room',
        'period_number',
        'is_active'
    ]
    
    list_filter = [
        'academic_year',
        'day_of_week',
        'is_active',
        'section__grade_level'
    ]
    
    search_fields = [
        'section__name',
        'subject__name',
        'teacher__first_name',
        'teacher__last_name',
        'room'
    ]
    
    ordering = ['day_of_week', 'start_time', 'section']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('academic_year', 'section', 'subject', 'teacher')
        }),
        ('Schedule', {
            'fields': ('day_of_week', 'start_time', 'end_time', 'period_number')
        }),
        ('Location', {
            'fields': ('room',)
        }),
        ('Additional Information', {
            'fields': ('is_active', 'notes')
        }),
    )
    
    # Note: autocomplete_fields removed because Section and Subject 
    # don't have registered admin classes in the tenants app
    raw_id_fields = ['section', 'subject', 'teacher']


@admin.register(TimetableTemplate)
class TimetableTemplateAdmin(admin.ModelAdmin):
    """
    Admin interface for TimetableTemplate.
    """
    
    list_display = [
        'name',
        'academic_year',
        'is_default',
        'created_at'
    ]
    
    list_filter = [
        'academic_year',
        'is_default'
    ]
    
    search_fields = [
        'name',
        'description'
    ]
    
    ordering = ['-created_at']


@admin.register(TimetablePeriodConfig)
class TimetablePeriodConfigAdmin(admin.ModelAdmin):
    """
    Admin interface for TimetablePeriodConfig.
    """
    
    list_display = [
        'name',
        'academic_year',
        'get_working_days_display',
        'get_period_count',
        'is_active',
        'created_at'
    ]
    
    list_filter = [
        'academic_year',
        'is_active'
    ]
    
    search_fields = [
        'name'
    ]
    
    ordering = ['-is_active', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('academic_year', 'name', 'is_active')
        }),
        ('Schedule Configuration', {
            'fields': ('working_days', 'periods'),
            'description': 'Configure working days and period timings as JSON'
        }),
    )
    
    def get_working_days_display(self, obj):
        """Display working days count."""
        return f"{len(obj.working_days or [])} days"
    get_working_days_display.short_description = 'Working Days'
    
    def get_period_count(self, obj):
        """Display period count."""
        return f"{obj.get_period_count()} periods"
    get_period_count.short_description = 'Periods/Day'


@admin.register(SubjectSectionLoad)
class SubjectSectionLoadAdmin(admin.ModelAdmin):
    """
    Admin interface for SubjectSectionLoad.
    """
    
    list_display = [
        'section',
        'subject',
        'periods_per_week',
        'preferred_teacher',
        'max_periods_per_day',
        'priority',
        'is_active'
    ]
    
    list_filter = [
        'academic_year',
        'is_active',
        'requires_lab',
        'section__grade_level'
    ]
    
    search_fields = [
        'section__name',
        'subject__name',
        'preferred_teacher__first_name',
        'preferred_teacher__last_name'
    ]
    
    ordering = ['section', 'priority', 'subject__name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('academic_year', 'section', 'subject')
        }),
        ('Load Configuration', {
            'fields': ('periods_per_week', 'max_periods_per_day', 'priority')
        }),
        ('Preferences', {
            'fields': ('preferred_teacher', 'room_preference', 'requires_lab')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )
    
    raw_id_fields = ['section', 'subject', 'preferred_teacher']

