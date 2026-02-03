"""
LMS Module Serializers - Enhanced Version
"""

from rest_framework import serializers
from django.utils import timezone
from django.db.models import Avg
from .models import (
    CourseCategory, Course, CourseModule, Lesson, LessonResource,
    CourseEnrollment, LessonProgress,
    LMSQuiz, LMSQuizQuestion, LMSQuizAttempt,
    CourseDiscussion, DiscussionReply,
    LiveClass, LiveClassAttendance,
    VideoLibrary, CourseReview, CourseCertificate
)


# =============================================================================
# COURSE CATEGORY SERIALIZERS
# =============================================================================

class CourseCategorySerializer(serializers.ModelSerializer):
    """Course category serializer."""
    subcategories = serializers.SerializerMethodField()
    course_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseCategory
        fields = '__all__'
        read_only_fields = ['tenant']
    
    def get_subcategories(self, obj):
        return CourseCategorySerializer(obj.subcategories.filter(is_active=True), many=True).data
    
    def get_course_count(self, obj):
        return obj.courses.filter(status='PUBLISHED').count()


# =============================================================================
# COURSE SERIALIZERS
# =============================================================================

class CourseListSerializer(serializers.ModelSerializer):
    """Compact course serializer for lists."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    total_modules = serializers.ReadOnlyField()
    total_lessons = serializers.ReadOnlyField()
    enrolled_count = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'short_description', 'thumbnail',
            'category_name', 'instructor_name', 'course_type', 'difficulty',
            'estimated_duration_hours', 'is_free', 'price', 'status',
            'total_modules', 'total_lessons', 'enrolled_count', 'average_rating',
            'is_featured', 'created_at'
        ]
    
    def get_average_rating(self, obj):
        return obj.reviews.aggregate(avg=Avg('rating'))['avg'] or 0


class CourseSerializer(serializers.ModelSerializer):
    """Full course serializer."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    grade_name = serializers.CharField(source='grade_level.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    total_modules = serializers.ReadOnlyField()
    total_lessons = serializers.ReadOnlyField()
    total_duration_minutes = serializers.ReadOnlyField()
    enrolled_count = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ['tenant', 'published_at']
    
    def get_average_rating(self, obj):
        return obj.reviews.aggregate(avg=Avg('rating'))['avg'] or 0
    
    def get_review_count(self, obj):
        return obj.reviews.filter(is_published=True).count()


class CourseModuleSerializer(serializers.ModelSerializer):
    """Module serializer."""
    total_lessons = serializers.ReadOnlyField()
    total_duration_minutes = serializers.ReadOnlyField()
    
    class Meta:
        model = CourseModule
        fields = '__all__'
        read_only_fields = ['tenant']


class LessonResourceSerializer(serializers.ModelSerializer):
    """Lesson resource serializer."""
    class Meta:
        model = LessonResource
        fields = '__all__'
        read_only_fields = ['tenant', 'download_count']


class LessonListSerializer(serializers.ModelSerializer):
    """Compact lesson serializer."""
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'lesson_type', 'order', 'duration_minutes',
            'is_preview', 'is_published'
        ]


class LessonSerializer(serializers.ModelSerializer):
    """Full lesson serializer."""
    resources = LessonResourceSerializer(many=True, read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    course_title = serializers.CharField(source='module.course.title', read_only=True)
    
    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ['tenant']


class CourseWithModulesSerializer(serializers.ModelSerializer):
    """Course serializer with all modules and lessons."""
    modules = serializers.SerializerMethodField()
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    total_modules = serializers.ReadOnlyField()
    total_lessons = serializers.ReadOnlyField()
    
    class Meta:
        model = Course
        fields = '__all__'
    
    def get_modules(self, obj):
        modules = obj.modules.filter(is_published=True).order_by('order')
        result = []
        for module in modules:
            lessons = LessonListSerializer(
                module.lessons.filter(is_published=True).order_by('order'),
                many=True
            ).data
            result.append({
                **CourseModuleSerializer(module).data,
                'lessons': lessons
            })
        return result


# =============================================================================
# ENROLLMENT & PROGRESS SERIALIZERS
# =============================================================================

class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Course enrollment serializer."""
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_thumbnail = serializers.ImageField(source='course.thumbnail', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    last_lesson_title = serializers.CharField(source='last_lesson.title', read_only=True)
    
    class Meta:
        model = CourseEnrollment
        fields = '__all__'
        read_only_fields = ['tenant', 'enrolled_at', 'progress_percentage']


class EnrollSerializer(serializers.Serializer):
    """Serializer for enrollment action."""
    course_id = serializers.UUIDField()


class LessonProgressSerializer(serializers.ModelSerializer):
    """Lesson progress serializer."""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_type = serializers.CharField(source='lesson.lesson_type', read_only=True)
    
    class Meta:
        model = LessonProgress
        fields = '__all__'
        read_only_fields = ['tenant', 'enrollment']


class UpdateProgressSerializer(serializers.Serializer):
    """Serializer for updating lesson progress."""
    progress_percentage = serializers.IntegerField(min_value=0, max_value=100)
    time_spent_seconds = serializers.IntegerField(min_value=0, required=False)
    video_position_seconds = serializers.IntegerField(min_value=0, required=False)
    is_bookmarked = serializers.BooleanField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class CompleteProgressSerializer(serializers.Serializer):
    """Serializer for marking lesson complete."""
    time_spent_seconds = serializers.IntegerField(min_value=0, required=False)
    quiz_score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)


class StudentCourseProgressSerializer(serializers.Serializer):
    """Serializer for student's overall course progress."""
    enrollment = CourseEnrollmentSerializer()
    completed_lessons = serializers.IntegerField()
    total_lessons = serializers.IntegerField()
    completed_quizzes = serializers.IntegerField()
    total_time_spent = serializers.IntegerField()
    lesson_progress = LessonProgressSerializer(many=True)


# =============================================================================
# QUIZ SERIALIZERS
# =============================================================================

class LMSQuizQuestionSerializer(serializers.ModelSerializer):
    """Quiz question serializer (for quiz takers)."""
    class Meta:
        model = LMSQuizQuestion
        fields = [
            'id', 'question_text', 'question_type', 'options',
            'marks', 'hint', 'order'
        ]
        # Don't include correct_answer or explanation in this serializer


class LMSQuizQuestionFullSerializer(serializers.ModelSerializer):
    """Full quiz question serializer (for instructors)."""
    class Meta:
        model = LMSQuizQuestion
        fields = '__all__'
        read_only_fields = ['tenant']


class LMSQuizSerializer(serializers.ModelSerializer):
    """Quiz serializer."""
    question_count_actual = serializers.SerializerMethodField()
    
    class Meta:
        model = LMSQuiz
        fields = '__all__'
        read_only_fields = ['tenant']
    
    def get_question_count_actual(self, obj):
        return obj.questions.filter(is_active=True).count()


class LMSQuizWithQuestionsSerializer(serializers.ModelSerializer):
    """Quiz with questions serializer."""
    questions = LMSQuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = LMSQuiz
        fields = '__all__'


class LMSQuizAttemptSerializer(serializers.ModelSerializer):
    """Quiz attempt serializer."""
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = LMSQuizAttempt
        fields = '__all__'
        read_only_fields = ['tenant', 'started_at', 'total_marks', 'obtained_marks', 'percentage']


class StartQuizSerializer(serializers.Serializer):
    """Serializer for starting a quiz."""
    quiz_id = serializers.UUIDField()


class SubmitQuizSerializer(serializers.Serializer):
    """Serializer for submitting quiz answers."""
    answers = serializers.DictField(
        child=serializers.JSONField(),
        help_text="Question ID to answer mapping"
    )


# =============================================================================
# DISCUSSION SERIALIZERS
# =============================================================================

class DiscussionReplySerializer(serializers.ModelSerializer):
    """Discussion reply serializer."""
    author_name = serializers.CharField(source='author_user.get_full_name', read_only=True)
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = DiscussionReply
        fields = '__all__'
        read_only_fields = ['tenant', 'author_user', 'upvotes']
    
    def get_children(self, obj):
        return DiscussionReplySerializer(
            obj.children.filter(is_hidden=False),
            many=True
        ).data


class CourseDiscussionListSerializer(serializers.ModelSerializer):
    """Compact discussion serializer."""
    author_name = serializers.CharField(source='author_user.get_full_name', read_only=True)
    reply_count = serializers.ReadOnlyField()
    
    class Meta:
        model = CourseDiscussion
        fields = [
            'id', 'title', 'discussion_type', 'author_name', 'author_type',
            'is_pinned', 'is_answered', 'view_count', 'reply_count', 'created_at'
        ]


class CourseDiscussionSerializer(serializers.ModelSerializer):
    """Full discussion serializer."""
    author_name = serializers.CharField(source='author_user.get_full_name', read_only=True)
    reply_count = serializers.ReadOnlyField()
    replies = DiscussionReplySerializer(many=True, read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    
    class Meta:
        model = CourseDiscussion
        fields = '__all__'
        read_only_fields = ['tenant', 'author_user', 'view_count']


class CreateDiscussionSerializer(serializers.Serializer):
    """Serializer for creating a discussion."""
    course_id = serializers.UUIDField()
    lesson_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=300)
    content = serializers.CharField()
    discussion_type = serializers.ChoiceField(
        choices=['GENERAL', 'QUESTION', 'LESSON']
    )


class CreateReplySerializer(serializers.Serializer):
    """Serializer for creating a reply."""
    discussion_id = serializers.UUIDField()
    parent_reply_id = serializers.UUIDField(required=False)
    content = serializers.CharField()


# =============================================================================
# LIVE CLASS SERIALIZERS
# =============================================================================

class LiveClassListSerializer(serializers.ModelSerializer):
    """Compact live class serializer."""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    grade_name = serializers.CharField(source='grade_level.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = LiveClass
        fields = [
            'id', 'title', 'start_time', 'duration_minutes', 'provider',
            'teacher_name', 'grade_name', 'subject_name', 'status', 'is_completed'
        ]


class LiveClassSerializer(serializers.ModelSerializer):
    """Full live class serializer."""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    grade_name = serializers.CharField(source='grade_level.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = LiveClass
        fields = '__all__'
        read_only_fields = ['tenant', 'actual_start_time', 'actual_end_time', 'actual_participants']


class LiveClassAttendanceSerializer(serializers.ModelSerializer):
    """Live class attendance serializer."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    live_class_title = serializers.CharField(source='live_class.title', read_only=True)
    
    class Meta:
        model = LiveClassAttendance
        fields = '__all__'
        read_only_fields = ['tenant']


class JoinClassSerializer(serializers.Serializer):
    """Serializer for joining a live class."""
    device_type = serializers.CharField(required=False)


class StartClassSerializer(serializers.Serializer):
    """Serializer for starting a live class."""
    meeting_link = serializers.URLField(required=False)
    meeting_id = serializers.CharField(required=False)
    passcode = serializers.CharField(required=False)


class EndClassSerializer(serializers.Serializer):
    """Serializer for ending a live class."""
    recording_link = serializers.URLField(required=False)


# =============================================================================
# VIDEO LIBRARY SERIALIZERS
# =============================================================================

class VideoLibrarySerializer(serializers.ModelSerializer):
    """Video library serializer."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    grade_name = serializers.CharField(source='grade_level.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoLibrary
        fields = '__all__'
        read_only_fields = ['tenant', 'view_count', 'uploaded_by']
    
    def get_duration_formatted(self, obj):
        mins, secs = divmod(obj.duration_seconds, 60)
        hours, mins = divmod(mins, 60)
        if hours:
            return f"{hours}:{mins:02d}:{secs:02d}"
        return f"{mins}:{secs:02d}"


# =============================================================================
# REVIEW SERIALIZERS
# =============================================================================

class CourseReviewSerializer(serializers.ModelSerializer):
    """Course review serializer."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = CourseReview
        fields = '__all__'
        read_only_fields = ['tenant', 'student', 'is_helpful_count']


class CreateReviewSerializer(serializers.Serializer):
    """Serializer for creating a review."""
    course_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    review = serializers.CharField(required=False, allow_blank=True)


# =============================================================================
# CERTIFICATE SERIALIZERS
# =============================================================================

class CourseCertificateSerializer(serializers.ModelSerializer):
    """Course certificate serializer."""
    course_title = serializers.CharField(source='enrollment.course.title', read_only=True)
    student_name = serializers.CharField(source='enrollment.student.get_full_name', read_only=True)
    
    class Meta:
        model = CourseCertificate
        fields = '__all__'
        read_only_fields = ['tenant', 'certificate_number', 'issued_at']


# =============================================================================
# DASHBOARD & ANALYTICS SERIALIZERS
# =============================================================================

class LMSDashboardSerializer(serializers.Serializer):
    """LMS dashboard statistics."""
    total_courses = serializers.IntegerField()
    published_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    active_enrollments = serializers.IntegerField()
    completed_enrollments = serializers.IntegerField()
    total_live_classes = serializers.IntegerField()
    upcoming_live_classes = serializers.IntegerField()
    total_videos = serializers.IntegerField()
    average_course_rating = serializers.DecimalField(max_digits=3, decimal_places=2)


class StudentLMSDashboardSerializer(serializers.Serializer):
    """Student-specific LMS dashboard."""
    enrolled_courses = serializers.IntegerField()
    completed_courses = serializers.IntegerField()
    in_progress_courses = serializers.IntegerField()
    average_progress = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_time_spent = serializers.IntegerField()
    certificates_earned = serializers.IntegerField()
    upcoming_live_classes = serializers.IntegerField()


class CourseAnalyticsSerializer(serializers.Serializer):
    """Course analytics report."""
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    total_enrollments = serializers.IntegerField()
    active_students = serializers.IntegerField()
    completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_progress = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    most_watched_lesson = serializers.CharField()
    highest_drop_off_lesson = serializers.CharField()
