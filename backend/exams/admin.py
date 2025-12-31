"""
Exams Admin Configuration
"""

from django.contrib import admin
from .models import ExamTerm, Exam, ExamSchedule, Topic, LearningOutcome, QuestionBank


@admin.register(ExamTerm)
class ExamTermAdmin(admin.ModelAdmin):
    list_display = ['name', 'term_type', 'academic_year', 'start_date', 'end_date', 'is_active']
    list_filter = ['term_type', 'is_active', 'academic_year']
    search_fields = ['name', 'description']
    ordering = ['-start_date']


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'exam_term', 'subject', 'grade_level', 'total_marks', 'status']
    list_filter = ['status', 'exam_term', 'subject', 'grade_level']
    search_fields = ['name', 'syllabus']
    filter_horizontal = ['sections']
    ordering = ['-created_at']


@admin.register(ExamSchedule)
class ExamScheduleAdmin(admin.ModelAdmin):
    list_display = ['exam', 'section', 'exam_date', 'start_time', 'end_time', 'room', 'invigilator']
    list_filter = ['exam_date', 'exam__exam_term']
    search_fields = ['exam__name', 'section__name', 'room']
    raw_id_fields = ['exam', 'section', 'invigilator']
    ordering = ['exam_date', 'start_time']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'grade_level', 'order']
    list_filter = ['subject', 'grade_level']
    search_fields = ['name', 'description']
    ordering = ['subject', 'order']


@admin.register(LearningOutcome)
class LearningOutcomeAdmin(admin.ModelAdmin):
    list_display = ['code', 'description', 'subject', 'topic', 'bloom_level']
    list_filter = ['subject', 'bloom_level']
    search_fields = ['code', 'description']
    raw_id_fields = ['topic']
    ordering = ['code']


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ['question_text_short', 'question_type', 'subject', 'topic', 'difficulty', 'marks', 'is_active', 'usage_count']
    list_filter = ['question_type', 'difficulty', 'subject', 'is_active']
    search_fields = ['question_text']
    raw_id_fields = ['topic', 'learning_outcome']
    ordering = ['-created_at']
    
    def question_text_short(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'Question'
