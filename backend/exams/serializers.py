"""
Exams Serializers
"""

from rest_framework import serializers
from .models import (
    ExamTerm, Exam, ExamSchedule, Topic, LearningOutcome, QuestionBank,
    GradeConfiguration, GradeScale, ExamResult, OnlineExam, OnlineExamSession,
    OnlineExamAnswer
)


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


class GradeScaleSerializer(serializers.ModelSerializer):
    """Serializer for GradeScale."""
    
    class Meta:
        model = GradeScale
        fields = [
            'id', 'configuration', 'grade', 'min_percentage', 'max_percentage',
            'grade_point', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GradeConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for GradeConfiguration with nested scales."""
    
    scales = GradeScaleSerializer(many=True, read_only=True)
    
    class Meta:
        model = GradeConfiguration
        fields = [
            'id', 'name', 'academic_year', 'is_default', 'description',
            'scales', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExamResultSerializer(serializers.ModelSerializer):
    """Serializer for ExamResult."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    total_marks = serializers.DecimalField(source='exam.total_marks', max_digits=6, decimal_places=2, read_only=True)
    passing_marks = serializers.DecimalField(source='exam.passing_marks', max_digits=6, decimal_places=2, read_only=True)
    
    class Meta:
        model = ExamResult
        fields = [
            'id', 'exam', 'exam_name', 'student', 'student_name', 'student_roll_number',
            'section', 'section_name', 'marks_obtained', 'total_marks', 'passing_marks',
            'grade', 'grade_point', 'percentage', 'is_pass', 'is_absent',
            'status', 'remarks', 'entered_by', 'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'grade', 'grade_point', 'percentage', 'is_pass', 'created_at', 'updated_at']


class BulkResultEntrySerializer(serializers.Serializer):
    """Serializer for bulk result entry."""
    
    exam_id = serializers.UUIDField()
    section_id = serializers.UUIDField()
    results = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )


class OnlineExamQuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions in online exam (without answers)."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    
    class Meta:
        model = QuestionBank
        fields = [
            'id', 'question_text', 'question_type', 'subject', 'subject_name',
            'topic', 'topic_name', 'difficulty', 'marks', 'option_a', 'option_b',
            'option_c', 'option_d', 'image'
        ]
        # Exclude correct_answer and explanation for security


class OnlineExamSerializer(serializers.ModelSerializer):
    """Serializer for OnlineExam."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    question_count = serializers.SerializerMethodField()
    session_count = serializers.SerializerMethodField()
    
    class Meta:
        model = OnlineExam
        fields = [
            'id', 'name', 'exam', 'subject', 'subject_name', 'grade_level',
            'grade_level_name', 'sections', 'questions', 'total_marks',
            'passing_marks', 'duration_minutes', 'start_datetime', 'end_datetime',
            'instructions', 'status', 'shuffle_questions', 'shuffle_options',
            'show_results_immediately', 'allow_review', 'proctoring_level',
            'max_tab_switches', 'auto_submit_on_time_end', 'question_count',
            'session_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_session_count(self, obj):
        return obj.sessions.count()


class OnlineExamListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing online exams."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = OnlineExam
        fields = [
            'id', 'name', 'subject_name', 'grade_level_name', 'total_marks',
            'duration_minutes', 'start_datetime', 'end_datetime', 'status',
            'question_count'
        ]
    
    def get_question_count(self, obj):
        return obj.questions.count()


class OnlineExamAnswerSerializer(serializers.ModelSerializer):
    """Serializer for OnlineExamAnswer."""
    
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    marks = serializers.DecimalField(source='question.marks', max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = OnlineExamAnswer
        fields = [
            'id', 'session', 'question', 'question_text', 'question_type',
            'answer_text', 'selected_option', 'is_correct', 'marks_awarded',
            'marks', 'answered_at', 'time_spent_seconds', 'is_marked_for_review',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_correct', 'marks_awarded', 'answered_at', 'created_at', 'updated_at']


class OnlineExamSessionSerializer(serializers.ModelSerializer):
    """Serializer for OnlineExamSession."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    exam_name = serializers.CharField(source='online_exam.name', read_only=True)
    answers = OnlineExamAnswerSerializer(many=True, read_only=True)
    total_marks = serializers.DecimalField(source='online_exam.total_marks', max_digits=6, decimal_places=2, read_only=True)
    passing_marks = serializers.DecimalField(source='online_exam.passing_marks', max_digits=6, decimal_places=2, read_only=True)
    
    class Meta:
        model = OnlineExamSession
        fields = [
            'id', 'online_exam', 'exam_name', 'student', 'student_name',
            'student_roll_number', 'started_at', 'submitted_at',
            'time_remaining_seconds', 'status', 'tab_switch_count',
            'ip_address', 'user_agent', 'score', 'percentage', 'is_pass',
            'total_marks', 'passing_marks', 'proctoring_violations',
            'answers', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'started_at', 'submitted_at', 'score', 'percentage',
            'is_pass', 'created_at', 'updated_at'
        ]


class OnlineExamSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing sessions."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_name = serializers.CharField(source='online_exam.name', read_only=True)
    
    class Meta:
        model = OnlineExamSession
        fields = [
            'id', 'exam_name', 'student_name', 'started_at', 'submitted_at',
            'status', 'score', 'percentage', 'is_pass'
        ]


class StartOnlineExamSerializer(serializers.Serializer):
    """Serializer for starting an online exam."""
    
    online_exam_id = serializers.UUIDField()
    ip_address = serializers.IPAddressField(required=False)
    user_agent = serializers.CharField(required=False, allow_blank=True)


class SubmitAnswerSerializer(serializers.Serializer):
    """Serializer for submitting an answer."""
    
    question_id = serializers.UUIDField()
    answer_text = serializers.CharField(required=False, allow_blank=True)
    selected_option = serializers.CharField(required=False, allow_blank=True, max_length=10)
    time_spent_seconds = serializers.IntegerField(required=False, default=0)
    is_marked_for_review = serializers.BooleanField(required=False, default=False)


class SubmitExamSerializer(serializers.Serializer):
    """Serializer for submitting the entire exam."""
    
    session_id = serializers.UUIDField()


class QuestionImportSerializer(serializers.Serializer):
    """Serializer for importing questions from file."""
    
    file = serializers.FileField()
    subject_id = serializers.UUIDField()
    topic_id = serializers.UUIDField(required=False)
    difficulty = serializers.ChoiceField(
        choices=['EASY', 'MEDIUM', 'HARD'],
        required=False
    )
