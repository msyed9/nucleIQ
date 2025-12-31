"""
Academics Admin Configuration
"""

from django.contrib import admin
from .models import Assignment, Submission


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    """
    Admin interface for Assignment.
    """
    
    list_display = [
        'title',
        'subject',
        'section',
        'teacher',
        'assigned_date',
        'due_date',
        'status',
        'max_marks'
    ]
    
    list_filter = [
        'status',
        'assignment_type',
        'academic_year',
        'subject',
        'section__grade_level'
    ]
    
    search_fields = [
        'title',
        'description',
        'teacher__first_name',
        'teacher__last_name'
    ]
    
    ordering = ['-assigned_date']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'assignment_type', 'status')
        }),
        ('Academic Context', {
            'fields': ('academic_year', 'subject', 'section', 'teacher')
        }),
        ('Dates and Deadlines', {
            'fields': ('assigned_date', 'due_date')
        }),
        ('Grading', {
            'fields': ('max_marks',)
        }),
        ('Attachments', {
            'fields': ('attachment',)
        }),
        ('Settings', {
            'fields': ('allow_late_submission', 'late_penalty_percent', 'instructions')
        }),
    )
    
    raw_id_fields = ['subject', 'section', 'teacher']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    """
    Admin interface for Submission.
    """
    
    list_display = [
        'student',
        'assignment',
        'status',
        'submitted_at',
        'is_late',
        'marks_obtained',
        'graded_at'
    ]
    
    list_filter = [
        'status',
        'is_late',
        'assignment__subject',
        'graded_at'
    ]
    
    search_fields = [
        'student__first_name',
        'student__last_name',
        'assignment__title'
    ]
    
    ordering = ['-submitted_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('assignment', 'student', 'status')
        }),
        ('Submission', {
            'fields': ('submission_file', 'submission_text', 'submitted_at', 'is_late', 'student_notes')
        }),
        ('Grading', {
            'fields': ('marks_obtained', 'graded_by', 'graded_at', 'remarks', 'feedback_file')
        }),
    )
    
    raw_id_fields = ['assignment', 'student', 'graded_by']
    readonly_fields = ['submitted_at', 'graded_at', 'is_late']
