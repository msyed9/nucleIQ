"""
Exams Admin Configuration
"""

from django.contrib import admin
from .models import (
    ExamTerm, Exam, ExamSchedule, Topic, LearningOutcome, QuestionBank,
    GradeConfiguration, GradeScale, ExamResult, OnlineExam, OnlineExamSession,
    OnlineExamAnswer
)


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


class GradeScaleInline(admin.TabularInline):
    model = GradeScale
    extra = 1
    fields = ['grade', 'min_percentage', 'max_percentage', 'grade_point', 'remarks']


@admin.register(GradeConfiguration)
class GradeConfigurationAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'is_default', 'created_at']
    list_filter = ['is_default', 'academic_year']
    search_fields = ['name', 'description']
    ordering = ['-is_default', 'name']
    inlines = [GradeScaleInline]


@admin.register(GradeScale)
class GradeScaleAdmin(admin.ModelAdmin):
    list_display = ['grade', 'configuration', 'min_percentage', 'max_percentage', 'grade_point', 'remarks']
    list_filter = ['configuration']
    ordering = ['configuration', '-min_percentage']


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'section', 'marks_obtained', 'percentage', 'grade', 'is_pass', 'status']
    list_filter = ['status', 'is_pass', 'is_absent', 'exam__exam_term', 'section']
    search_fields = ['student__first_name', 'student__last_name', 'student__roll_number']
    raw_id_fields = ['exam', 'student', 'section', 'entered_by']
    readonly_fields = ['percentage', 'grade', 'grade_point', 'is_pass', 'published_at']
    ordering = ['exam', 'section', 'student']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('exam', 'student', 'section')
        }),
        ('Marks', {
            'fields': ('marks_obtained', 'is_absent', 'percentage', 'grade', 'grade_point', 'is_pass')
        }),
        ('Status', {
            'fields': ('status', 'remarks', 'entered_by', 'published_at')
        }),
    )


@admin.register(OnlineExam)
class OnlineExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'grade_level', 'status', 'start_datetime', 'duration_minutes', 'total_marks']
    list_filter = ['status', 'subject', 'grade_level', 'proctoring_level']
    search_fields = ['name', 'instructions']
    filter_horizontal = ['sections', 'questions']
    raw_id_fields = ['exam', 'subject', 'grade_level']
    ordering = ['-start_datetime']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'exam', 'subject', 'grade_level', 'sections')
        }),
        ('Questions', {
            'fields': ('questions', 'total_marks', 'passing_marks')
        }),
        ('Schedule', {
            'fields': ('start_datetime', 'end_datetime', 'duration_minutes')
        }),
        ('Settings', {
            'fields': ('status', 'shuffle_questions', 'shuffle_options', 'show_results_immediately', 'allow_review')
        }),
        ('Proctoring', {
            'fields': ('proctoring_level', 'max_tab_switches', 'auto_submit_on_time_end')
        }),
        ('Instructions', {
            'fields': ('instructions',)
        }),
    )


class OnlineExamAnswerInline(admin.TabularInline):
    model = OnlineExamAnswer
    extra = 0
    fields = ['question', 'selected_option', 'is_correct', 'marks_awarded', 'is_marked_for_review']
    readonly_fields = ['is_correct', 'marks_awarded']
    can_delete = False


@admin.register(OnlineExamSession)
class OnlineExamSessionAdmin(admin.ModelAdmin):
    list_display = ['student', 'online_exam', 'status', 'started_at', 'submitted_at', 'score', 'percentage', 'is_pass']
    list_filter = ['status', 'is_pass', 'online_exam']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'student__roll_number']
    raw_id_fields = ['online_exam', 'student']
    readonly_fields = ['started_at', 'submitted_at', 'score', 'percentage', 'is_pass', 'tab_switch_count']
    ordering = ['-started_at']
    inlines = [OnlineExamAnswerInline]
    
    fieldsets = (
        ('Exam Information', {
            'fields': ('online_exam', 'student', 'status')
        }),
        ('Timing', {
            'fields': ('started_at', 'submitted_at', 'time_remaining_seconds')
        }),
        ('Results', {
            'fields': ('score', 'percentage', 'is_pass')
        }),
        ('Proctoring', {
            'fields': ('tab_switch_count', 'ip_address', 'user_agent', 'proctoring_violations')
        }),
    )


@admin.register(OnlineExamAnswer)
class OnlineExamAnswerAdmin(admin.ModelAdmin):
    list_display = ['session', 'question_short', 'selected_option', 'is_correct', 'marks_awarded', 'is_marked_for_review']
    list_filter = ['is_correct', 'is_marked_for_review', 'session__online_exam']
    search_fields = ['session__student__user__first_name', 'question__question_text']
    raw_id_fields = ['session', 'question']
    readonly_fields = ['is_correct', 'marks_awarded', 'answered_at']
    ordering = ['session', 'question']
    
    def question_short(self, obj):
        return obj.question.question_text[:50] + '...' if len(obj.question.question_text) > 50 else obj.question.question_text
    question_short.short_description = 'Question'
