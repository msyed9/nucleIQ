"""
Exams Serializers
"""

from rest_framework import serializers
from .models import ExamTerm, Exam, ExamSchedule, Topic, LearningOutcome, QuestionBank


class ExamTermSerializer(serializers.ModelSerializer):
    """Serializer for ExamTerm."""
    
    class Meta:
        model = ExamTerm
        fields = [
            'id', 'name', 'term_type', 'academic_year', 'start_date', 'end_date',
            'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for Exam."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    term_name = serializers.CharField(source='exam_term.name', read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'exam_term', 'term_name', 'subject', 'subject_name',
            'grade_level', 'grade_level_name', 'sections', 'total_marks',
            'passing_marks', 'duration_minutes', 'instructions', 'status',
            'syllabus', 'question_paper', 'answer_key', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExamScheduleSerializer(serializers.ModelSerializer):
    """Serializer for ExamSchedule."""
    
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    invigilator_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'exam', 'exam_name', 'section', 'section_name', 'exam_date',
            'start_time', 'end_time', 'room', 'invigilator', 'invigilator_name',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_invigilator_name(self, obj):
        return obj.invigilator.get_full_name() if obj.invigilator else None


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'subject', 'subject_name', 'grade_level',
            'description', 'order', 'question_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_question_count(self, obj):
        return obj.questions.filter(is_deleted=False, is_active=True).count()


class LearningOutcomeSerializer(serializers.ModelSerializer):
    """Serializer for LearningOutcome."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    
    class Meta:
        model = LearningOutcome
        fields = [
            'id', 'code', 'description', 'subject', 'subject_name',
            'topic', 'topic_name', 'bloom_level', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuestionBankSerializer(serializers.ModelSerializer):
    """Serializer for QuestionBank."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    learning_outcome_code = serializers.CharField(source='learning_outcome.code', read_only=True)
    
    class Meta:
        model = QuestionBank
        fields = [
            'id', 'question_text', 'question_type', 'subject', 'subject_name',
            'topic', 'topic_name', 'difficulty', 'marks', 'learning_outcome',
            'learning_outcome_code', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'explanation', 'image', 'is_active', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class PaperGenerationSerializer(serializers.Serializer):
    """Serializer for question paper generation request."""
    
    subject_id = serializers.UUIDField()
    total_marks = serializers.DecimalField(max_digits=6, decimal_places=2)
    easy_count = serializers.IntegerField(min_value=0, default=0)
    medium_count = serializers.IntegerField(min_value=0, default=0)
    hard_count = serializers.IntegerField(min_value=0, default=0)
    topic_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
