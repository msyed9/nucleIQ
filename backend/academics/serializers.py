"""
Academics Serializers
"""

from rest_framework import serializers
from .models import Assignment, Submission
from students.models import Student
from staff.models import Staff


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Assignment with nested relationships.
    """
    
    # Read-only nested fields
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    
    # Computed fields
    submission_count = serializers.SerializerMethodField()
    graded_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    submission_percentage = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id',
            'title',
            'description',
            'assignment_type',
            'academic_year',
            'subject',
            'subject_name',
            'section',
            'section_name',
            'teacher',
            'teacher_name',
            'assigned_date',
            'due_date',
            'max_marks',
            'attachment',
            'status',
            'allow_late_submission',
            'late_penalty_percent',
            'instructions',
            'submission_count',
            'graded_count',
            'pending_count',
            'submission_percentage',
            'is_overdue',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.teacher:
            return obj.teacher.get_full_name()
        return None
    
    def get_submission_count(self, obj):
        """Get total submissions."""
        return obj.get_submission_count()
    
    def get_graded_count(self, obj):
        """Get graded submissions."""
        return obj.get_graded_count()
    
    def get_pending_count(self, obj):
        """Get pending submissions."""
        return obj.get_pending_count()
    
    def get_submission_percentage(self, obj):
        """Get submission percentage."""
        return obj.get_submission_percentage()
    
    def get_is_overdue(self, obj):
        """Check if overdue."""
        return obj.is_overdue()


class AssignmentCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating assignments.
    """
    
    class Meta:
        model = Assignment
        fields = [
            'title',
            'description',
            'assignment_type',
            'academic_year',
            'subject',
            'section',
            'teacher',
            'assigned_date',
            'due_date',
            'max_marks',
            'attachment',
            'status',
            'allow_late_submission',
            'late_penalty_percent',
            'instructions'
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for Submission with nested relationships.
    """
    
    # Read-only nested fields
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    assignment_due_date = serializers.DateTimeField(source='assignment.due_date', read_only=True)
    assignment_max_marks = serializers.DecimalField(
        source='assignment.max_marks',
        max_digits=6,
        decimal_places=2,
        read_only=True
    )
    student_name = serializers.SerializerMethodField()
    graded_by_name = serializers.SerializerMethodField()
    
    # Computed fields
    percentage = serializers.SerializerMethodField()
    grade_letter = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'assignment',
            'assignment_title',
            'assignment_due_date',
            'assignment_max_marks',
            'student',
            'student_name',
            'submission_file',
            'submission_text',
            'submitted_at',
            'status',
            'is_late',
            'marks_obtained',
            'graded_by',
            'graded_by_name',
            'graded_at',
            'remarks',
            'feedback_file',
            'student_notes',
            'percentage',
            'grade_letter',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_late', 'submitted_at']
    
    def get_student_name(self, obj):
        """Get student's full name."""
        return obj.student.get_full_name()
    
    def get_graded_by_name(self, obj):
        """Get grader's full name."""
        if obj.graded_by:
            return obj.graded_by.get_full_name()
        return None
    
    def get_percentage(self, obj):
        """Get percentage score."""
        return obj.get_percentage()
    
    def get_grade_letter(self, obj):
        """Get letter grade."""
        return obj.get_grade_letter()


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating submissions.
    """
    
    class Meta:
        model = Submission
        fields = [
            'assignment',
            'student',
            'submission_file',
            'submission_text',
            'student_notes'
        ]


class SubmissionGradeSerializer(serializers.Serializer):
    """
    Serializer for grading a submission.
    """
    marks_obtained = serializers.DecimalField(max_digits=6, decimal_places=2)
    remarks = serializers.CharField(required=False, allow_blank=True)
    feedback_file = serializers.FileField(required=False, allow_null=True)
    
    def validate_marks_obtained(self, value):
        """Validate marks are within range."""
        if value < 0:
            raise serializers.ValidationError("Marks cannot be negative")
        return value


class StudentSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for student's own submissions (limited fields).
    """
    
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    assignment_due_date = serializers.DateTimeField(source='assignment.due_date', read_only=True)
    assignment_max_marks = serializers.DecimalField(
        source='assignment.max_marks',
        max_digits=6,
        decimal_places=2,
        read_only=True
    )
    subject_name = serializers.CharField(source='assignment.subject.name', read_only=True)
    percentage = serializers.SerializerMethodField()
    grade_letter = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'assignment',
            'assignment_title',
            'assignment_due_date',
            'assignment_max_marks',
            'subject_name',
            'submission_file',
            'submission_text',
            'submitted_at',
            'status',
            'is_late',
            'marks_obtained',
            'graded_at',
            'remarks',
            'feedback_file',
            'student_notes',
            'percentage',
            'grade_letter'
        ]
        read_only_fields = ['id', 'is_late', 'submitted_at', 'marks_obtained', 'graded_at', 'remarks']
    
    def get_percentage(self, obj):
        """Get percentage score."""
        return obj.get_percentage()
    
    def get_grade_letter(self, obj):
        """Get letter grade."""
        return obj.get_grade_letter()


# New Serializers for Homework and Syllabus
from .models import Homework, HomeworkCompletion, Syllabus, Chapter, SyllabusProgress


class HomeworkSerializer(serializers.ModelSerializer):
    """Serializer for Homework."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'academic_year',
            'subject', 'subject_name', 'section', 'section_name',
            'teacher', 'teacher_name', 'assigned_date', 'due_date',
            'priority', 'attachment', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() if obj.teacher else None
    
    def get_is_overdue(self, obj):
        return obj.is_overdue()


class HomeworkCompletionSerializer(serializers.ModelSerializer):
    """Serializer for HomeworkCompletion."""
    
    homework_title = serializers.CharField(source='homework.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HomeworkCompletion
        fields = [
            'id', 'homework', 'homework_title', 'student', 'student_name',
            'is_completed', 'completed_at', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']
    
    def get_student_name(self, obj):
        return obj.student.get_full_name()


class ChapterSerializer(serializers.ModelSerializer):
    """Serializer for Chapter."""
    
    completed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = [
            'id', 'syllabus', 'name', 'description', 'order',
            'estimated_hours', 'topics', 'is_completed',
            'completed_date', 'completed_by', 'completed_by_name'
        ]
        read_only_fields = ['id', 'completed_date']
    
    def get_completed_by_name(self, obj):
        return obj.completed_by.get_full_name() if obj.completed_by else None


class SyllabusSerializer(serializers.ModelSerializer):
    """Serializer for Syllabus."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    chapters = ChapterSerializer(many=True, read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    total_chapters = serializers.SerializerMethodField()
    completed_chapters = serializers.SerializerMethodField()
    
    class Meta:
        model = Syllabus
        fields = [
            'id', 'name', 'description', 'subject', 'subject_name',
            'grade_level', 'grade_level_name', 'academic_year',
            'total_hours', 'chapters', 'completion_percentage',
            'total_chapters', 'completed_chapters', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    def get_total_chapters(self, obj):
        return obj.chapters.filter(is_deleted=False).count()
    
    def get_completed_chapters(self, obj):
        return obj.chapters.filter(is_deleted=False, is_completed=True).count()


class SyllabusProgressSerializer(serializers.ModelSerializer):
    """Serializer for SyllabusProgress."""
    
    chapter_name = serializers.CharField(source='chapter.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SyllabusProgress
        fields = [
            'id', 'syllabus', 'section', 'section_name', 'chapter',
            'chapter_name', 'is_completed', 'completed_date',
            'teacher', 'teacher_name', 'notes'
        ]
        read_only_fields = ['id', 'completed_date']
    
    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() if obj.teacher else None

