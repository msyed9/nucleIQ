"""
Timetable Admin Configuration
"""

from django.contrib import admin
from .models import TimetableSlot, TimetableTemplate


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
