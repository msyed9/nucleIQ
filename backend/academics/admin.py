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


# Import new models
from .models import Homework, HomeworkCompletion, Syllabus, Chapter, SyllabusProgress


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    """Admin interface for Homework."""
    
    list_display = [
        'title', 'subject', 'section', 'teacher',
        'assigned_date', 'due_date', 'priority'
    ]
    list_filter = ['priority', 'subject', 'section__grade_level', 'due_date']
    search_fields = ['title', 'description']
    ordering = ['-assigned_date']
    raw_id_fields = ['subject', 'section', 'teacher']


@admin.register(HomeworkCompletion)
class HomeworkCompletionAdmin(admin.ModelAdmin):
    """Admin interface for HomeworkCompletion."""
    
    list_display = ['homework', 'student', 'is_completed', 'completed_at']
    list_filter = ['is_completed', 'homework__subject']
    search_fields = ['student__first_name', 'student__last_name', 'homework__title']
    raw_id_fields = ['homework', 'student']


@admin.register(Syllabus)
class SyllabusAdmin(admin.ModelAdmin):
    """Admin interface for Syllabus."""
    
    list_display = ['name', 'subject', 'grade_level', 'academic_year', 'total_hours']
    list_filter = ['subject', 'grade_level', 'academic_year']
    search_fields = ['name', 'description']
    raw_id_fields = ['subject', 'grade_level', 'academic_year']


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    """Admin interface for Chapter."""
    
    list_display = ['name', 'syllabus', 'order', 'estimated_hours', 'is_completed']
    list_filter = ['is_completed', 'syllabus__subject']
    search_fields = ['name', 'description']
    ordering = ['syllabus', 'order']
    raw_id_fields = ['syllabus', 'completed_by']


@admin.register(SyllabusProgress)
class SyllabusProgressAdmin(admin.ModelAdmin):
    """Admin interface for SyllabusProgress."""
    
    list_display = ['syllabus', 'section', 'chapter', 'is_completed', 'completed_date']
    list_filter = ['is_completed', 'syllabus__subject', 'section__grade_level']
    search_fields = ['chapter__name', 'section__name']
    raw_id_fields = ['syllabus', 'section', 'chapter', 'teacher']

