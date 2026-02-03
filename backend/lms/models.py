"""
LMS (Learning Management System) Models - Enhanced Version

Features:
- Course Management with Modules and Lessons
- Video Library with Progress Tracking
- Quiz Integration
- Discussion Forums
- Resource Downloads
- Certificates
- Live Classes
"""

import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from core.models import TenantAwareModel


# =============================================================================
# COURSE MANAGEMENT
# =============================================================================

class CourseCategory(TenantAwareModel):
    """
    Categories for organizing courses.
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text=_("Icon class name"))
    color = models.CharField(max_length=20, blank=True, help_text=_("Hex color code"))
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='subcategories'
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'lms_course_categories'
        ordering = ['order', 'name']
        verbose_name_plural = 'Course Categories'
        unique_together = ['tenant', 'slug']

    def __str__(self):
        return self.name


class Course(TenantAwareModel):
    """
    A complete course with modules and lessons.
    """
    DIFFICULTY_LEVELS = [
        ('BEGINNER', _('Beginner')),
        ('INTERMEDIATE', _('Intermediate')),
        ('ADVANCED', _('Advanced')),
        ('EXPERT', _('Expert')),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', _('Draft')),
        ('PUBLISHED', _('Published')),
        ('ARCHIVED', _('Archived')),
    ]
    
    COURSE_TYPES = [
        ('SELF_PACED', _('Self-Paced')),
        ('INSTRUCTOR_LED', _('Instructor-Led')),
        ('HYBRID', _('Hybrid')),
    ]
    
    # Basic Info
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    
    # Categorization
    category = models.ForeignKey(
        CourseCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='courses'
    )
    tags = models.JSONField(default=list, blank=True, help_text=_("List of tags"))
    
    # Course Details
    course_type = models.CharField(max_length=20, choices=COURSE_TYPES, default='SELF_PACED')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default='BEGINNER')
    estimated_duration_hours = models.PositiveIntegerField(default=0)
    
    # Academic Connection
    grade_level = models.ForeignKey(
        'tenants.GradeLevel', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='courses'
    )
    subject = models.ForeignKey(
        'tenants.Subject', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='courses'
    )
    
    # Instructor
    instructor = models.ForeignKey(
        'staff.Staff', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='courses_teaching'
    )
    co_instructors = models.ManyToManyField(
        'staff.Staff',
        blank=True,
        related_name='courses_co_teaching'
    )
    
    # Media
    thumbnail = models.ImageField(upload_to='lms/courses/thumbnails/', null=True, blank=True)
    promo_video_url = models.URLField(max_length=500, blank=True)
    
    # Course Settings
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    requires_enrollment = models.BooleanField(default=True)
    max_enrollments = models.PositiveIntegerField(null=True, blank=True, help_text=_("Leave blank for unlimited"))
    enrollment_start_date = models.DateField(null=True, blank=True)
    enrollment_end_date = models.DateField(null=True, blank=True)
    
    # Completion
    passing_percentage = models.PositiveIntegerField(default=70)
    certificate_enabled = models.BooleanField(default=False)
    certificate_template = models.ForeignKey(
        'certificates.CertificateTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Publishing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Visibility
    is_featured = models.BooleanField(default=False)
    visibility = models.CharField(
        max_length=20,
        choices=[
            ('PUBLIC', _('Public')),
            ('ENROLLED', _('Enrolled Users Only')),
            ('PRIVATE', _('Private')),
        ],
        default='ENROLLED'
    )
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'lms_courses'
        ordering = ['-created_at']
        unique_together = ['tenant', 'slug']

    def __str__(self):
        return self.title
    
    @property
    def total_modules(self):
        return self.modules.count()
    
    @property
    def total_lessons(self):
        return Lesson.objects.filter(module__course=self).count()
    
    @property
    def total_duration_minutes(self):
        return Lesson.objects.filter(module__course=self).aggregate(
            total=models.Sum('duration_minutes')
        )['total'] or 0
    
    @property
    def enrolled_count(self):
        return self.enrollments.filter(status='ACTIVE').count()


class CourseModule(TenantAwareModel):
    """
    A module/chapter within a course.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    # Optional unlock conditions
    unlock_after_days = models.PositiveIntegerField(default=0, help_text=_("Days after enrollment"))
    requires_previous_module = models.BooleanField(default=True)
    
    is_published = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'lms_course_modules'
        ordering = ['course', 'order']
        unique_together = ['course', 'order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    @property
    def total_lessons(self):
        return self.lessons.count()
    
    @property
    def total_duration_minutes(self):
        return self.lessons.aggregate(total=models.Sum('duration_minutes'))['total'] or 0


class Lesson(TenantAwareModel):
    """
    Individual lesson within a module.
    """
    LESSON_TYPES = [
        ('VIDEO', _('Video')),
        ('TEXT', _('Text/Article')),
        ('PDF', _('PDF Document')),
        ('AUDIO', _('Audio')),
        ('QUIZ', _('Quiz')),
        ('ASSIGNMENT', _('Assignment')),
        ('LIVE_SESSION', _('Live Session')),
        ('EXTERNAL_LINK', _('External Link')),
        ('INTERACTIVE', _('Interactive Content')),
    ]
    
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPES)
    order = models.PositiveIntegerField(default=0)
    
    # Content based on type
    content_text = models.TextField(blank=True, help_text=_("For text/article lessons"))
    video_url = models.URLField(max_length=500, blank=True)
    video_file = models.FileField(upload_to='lms/lessons/videos/', null=True, blank=True)
    video_provider = models.CharField(max_length=20, blank=True, help_text=_("youtube, vimeo, etc"))
    audio_file = models.FileField(upload_to='lms/lessons/audio/', null=True, blank=True)
    pdf_file = models.FileField(upload_to='lms/lessons/pdfs/', null=True, blank=True)
    external_url = models.URLField(max_length=500, blank=True)
    
    # For quiz type lessons
    quiz = models.ForeignKey('LMSQuiz', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Duration
    duration_minutes = models.PositiveIntegerField(default=0)
    
    # Access control
    is_preview = models.BooleanField(default=False, help_text=_("Available before enrollment"))
    requires_completion = models.BooleanField(default=True, help_text=_("Must complete before next lesson"))
    
    # Publishing
    is_published = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'lms_lessons'
        ordering = ['module', 'order']
        unique_together = ['module', 'order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class LessonResource(TenantAwareModel):
    """
    Downloadable resources attached to lessons.
    """
    RESOURCE_TYPES = [
        ('PDF', _('PDF Document')),
        ('DOC', _('Word Document')),
        ('EXCEL', _('Excel File')),
        ('PPT', _('Presentation')),
        ('IMAGE', _('Image')),
        ('CODE', _('Code File')),
        ('ARCHIVE', _('Archive (ZIP)')),
        ('OTHER', _('Other')),
    ]
    
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    file = models.FileField(upload_to='lms/resources/')
    file_size_bytes = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'lms_lesson_resources'
        ordering = ['lesson', 'title']

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"


# =============================================================================
# ENROLLMENT & PROGRESS
# =============================================================================

class CourseEnrollment(TenantAwareModel):
    """
    Student enrollment in a course.
    """
    STATUS_CHOICES = [
        ('PENDING', _('Pending')),
        ('ACTIVE', _('Active')),
        ('COMPLETED', _('Completed')),
        ('EXPIRED', _('Expired')),
        ('CANCELLED', _('Cancelled')),
    ]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='course_enrollments')
    
    # Enrollment dates
    enrolled_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Progress
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    last_lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Completion
    final_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)
    certificate_issued_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'lms_course_enrollments'
        ordering = ['-enrolled_at']
        unique_together = ['course', 'student']

    def __str__(self):
        return f"{self.student} - {self.course}"


class LessonProgress(TenantAwareModel):
    """
    Track progress for each lesson.
    """
    STATUS_CHOICES = [
        ('NOT_STARTED', _('Not Started')),
        ('IN_PROGRESS', _('In Progress')),
        ('COMPLETED', _('Completed')),
    ]
    
    enrollment = models.ForeignKey(CourseEnrollment, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='student_progress')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    progress_percentage = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)])
    
    # Time tracking
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    
    # For video lessons
    video_position_seconds = models.PositiveIntegerField(default=0)
    
    # For quiz lessons
    quiz_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    quiz_attempts = models.PositiveIntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True)
    is_bookmarked = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'lms_lesson_progress'
        unique_together = ['enrollment', 'lesson']

    def __str__(self):
        return f"{self.enrollment.student} - {self.lesson}"


# =============================================================================
# QUIZZES
# =============================================================================

class LMSQuiz(TenantAwareModel):
    """
    Quiz for course assessment.
    """
    QUIZ_TYPES = [
        ('PRACTICE', _('Practice Quiz')),
        ('GRADED', _('Graded Quiz')),
        ('EXAM', _('Final Exam')),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPES, default='PRACTICE')
    
    # Settings
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    passing_score = models.PositiveIntegerField(default=70)
    max_attempts = models.PositiveIntegerField(default=3)
    randomize_questions = models.BooleanField(default=True)
    randomize_options = models.BooleanField(default=True)
    show_answers_after = models.BooleanField(default=True)
    
    # Question selection
    question_count = models.PositiveIntegerField(null=True, blank=True, help_text=_("Random selection count"))
    
    is_published = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'lms_quizzes'
        verbose_name_plural = 'LMS Quizzes'

    def __str__(self):
        return self.title


class LMSQuizQuestion(TenantAwareModel):
    """
    Individual quiz question.
    """
    QUESTION_TYPES = [
        ('MCQ', _('Multiple Choice')),
        ('TRUE_FALSE', _('True/False')),
        ('MULTI_SELECT', _('Multi-Select')),
        ('SHORT_ANSWER', _('Short Answer')),
        ('FILL_BLANK', _('Fill in the Blank')),
    ]
    
    quiz = models.ForeignKey(LMSQuiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='MCQ')
    
    # Options for MCQ/Multi-select
    options = models.JSONField(default=list, help_text=_("List of option objects"))
    correct_answer = models.JSONField(help_text=_("Correct answer(s)"))
    
    # Scoring
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    negative_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Feedback
    explanation = models.TextField(blank=True, help_text=_("Explanation shown after answering"))
    hint = models.TextField(blank=True)
    
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'lms_quiz_questions'
        ordering = ['quiz', 'order']

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}"


class LMSQuizAttempt(TenantAwareModel):
    """
    Student quiz attempt.
    """
    STATUS_CHOICES = [
        ('IN_PROGRESS', _('In Progress')),
        ('SUBMITTED', _('Submitted')),
        ('GRADED', _('Graded')),
        ('PASSED', _('Passed')),
        ('FAILED', _('Failed')),
    ]
    
    quiz = models.ForeignKey(LMSQuiz, on_delete=models.CASCADE, related_name='attempts')
    enrollment = models.ForeignKey(CourseEnrollment, on_delete=models.CASCADE, related_name='quiz_attempts')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='lms_quiz_attempts')
    
    attempt_number = models.PositiveIntegerField(default=1)
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    
    # Results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    total_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    obtained_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Answers
    answers = models.JSONField(default=dict, help_text=_("Question ID to answer mapping"))
    
    class Meta:
        db_table = 'lms_quiz_attempts'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student} - {self.quiz} (Attempt {self.attempt_number})"


# =============================================================================
# DISCUSSION FORUMS
# =============================================================================

class CourseDiscussion(TenantAwareModel):
    """
    Discussion topic/thread in a course.
    """
    DISCUSSION_TYPES = [
        ('GENERAL', _('General Discussion')),
        ('QUESTION', _('Question')),
        ('ANNOUNCEMENT', _('Announcement')),
        ('LESSON', _('Lesson Discussion')),
    ]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='discussions')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name='discussions')
    
    title = models.CharField(max_length=300)
    content = models.TextField()
    discussion_type = models.CharField(max_length=20, choices=DISCUSSION_TYPES, default='GENERAL')
    
    # Author
    author_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='lms_discussions')
    author_type = models.CharField(max_length=20, default='STUDENT')  # STUDENT, TEACHER
    
    # Status
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    is_answered = models.BooleanField(default=False)
    
    # Engagement
    view_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'lms_course_discussions'
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    @property
    def reply_count(self):
        return self.replies.count()


class DiscussionReply(TenantAwareModel):
    """
    Reply to a discussion.
    """
    discussion = models.ForeignKey(CourseDiscussion, on_delete=models.CASCADE, related_name='replies')
    parent_reply = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    
    content = models.TextField()
    
    # Author
    author_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='lms_discussion_replies')
    author_type = models.CharField(max_length=20, default='STUDENT')
    
    # Status
    is_accepted_answer = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    
    # Engagement
    upvotes = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'lms_discussion_replies'
        ordering = ['-is_accepted_answer', 'created_at']

    def __str__(self):
        return f"Reply to: {self.discussion.title}"


# =============================================================================
# LIVE CLASSES
# =============================================================================

class LiveClass(TenantAwareModel):
    """
    Scheduled Virtual Class.
    """
    PROVIDER_CHOICES = [
        ('ZOOM', 'Zoom'),
        ('MEET', 'Google Meet'),
        ('JITSI', 'Jitsi Meet'),
        ('TEAMS', 'Microsoft Teams'),
        ('WEBEX', 'Cisco Webex'),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', _('Scheduled')),
        ('LIVE', _('Live Now')),
        ('ENDED', _('Ended')),
        ('CANCELLED', _('Cancelled')),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Connection to course (optional)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='live_classes')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Scheduling
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=45)
    
    # Target Audience
    grade_level = models.ForeignKey(
        'tenants.GradeLevel', 
        on_delete=models.CASCADE, 
        related_name='live_classes'
    )
    section = models.ForeignKey(
        'tenants.Section', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    subject = models.ForeignKey(
        'tenants.Subject', 
        on_delete=models.CASCADE, 
        related_name='live_classes'
    )
    
    # Teacher
    teacher = models.ForeignKey(
        'staff.Staff', 
        on_delete=models.CASCADE, 
        related_name='hosted_classes'
    )
    
    # Video Details
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='ZOOM')
    meeting_link = models.URLField(max_length=500, blank=True)
    meeting_id = models.CharField(max_length=100, blank=True)
    passcode = models.CharField(max_length=50, blank=True)
    host_key = models.CharField(max_length=50, blank=True)
    
    # Class Control
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    allow_recording = models.BooleanField(default=True)
    allow_chat = models.BooleanField(default=True)
    allow_screen_share = models.BooleanField(default=False)
    waiting_room_enabled = models.BooleanField(default=True)
    
    # Post Class
    is_completed = models.BooleanField(default=False)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    recording_link = models.URLField(max_length=500, blank=True)
    recording_file = models.FileField(upload_to='lms/recordings/', null=True, blank=True)
    
    # Attendance
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    actual_participants = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'lms_live_classes'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} ({self.start_time})"


class LiveClassAttendance(TenantAwareModel):
    """
    Attendance record for live classes.
    """
    live_class = models.ForeignKey(LiveClass, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='live_class_attendance')
    
    joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    
    # Engagement
    chat_messages_count = models.PositiveIntegerField(default=0)
    questions_asked = models.PositiveIntegerField(default=0)
    
    # Device info
    device_type = models.CharField(max_length=50, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'lms_live_class_attendance'
        unique_together = ['live_class', 'student']

    def __str__(self):
        return f"{self.student} - {self.live_class}"


# =============================================================================
# VIDEO LIBRARY
# =============================================================================

class VideoLibrary(TenantAwareModel):
    """
    Centralized video library for the tenant.
    """
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Video source
    video_url = models.URLField(max_length=500, blank=True)
    video_file = models.FileField(upload_to='lms/videos/', null=True, blank=True)
    video_provider = models.CharField(max_length=20, blank=True)
    
    # Metadata
    duration_seconds = models.PositiveIntegerField(default=0)
    thumbnail = models.ImageField(upload_to='lms/videos/thumbnails/', null=True, blank=True)
    
    # Categorization
    category = models.ForeignKey(CourseCategory, on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.ForeignKey('tenants.Subject', on_delete=models.SET_NULL, null=True, blank=True)
    grade_level = models.ForeignKey('tenants.GradeLevel', on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Usage tracking
    view_count = models.PositiveIntegerField(default=0)
    
    # Status
    is_published = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    
    class Meta:
        db_table = 'lms_video_library'
        verbose_name_plural = 'Video Library'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# =============================================================================
# COURSE REVIEWS & RATINGS
# =============================================================================

class CourseReview(TenantAwareModel):
    """
    Student review for a course.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='course_reviews')
    
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    review = models.TextField(blank=True)
    
    # Status
    is_published = models.BooleanField(default=True)
    is_helpful_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'lms_course_reviews'
        unique_together = ['course', 'student']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.course.title} - {self.rating} stars"


# =============================================================================
# CERTIFICATES
# =============================================================================

class CourseCertificate(TenantAwareModel):
    """
    Certificate issued upon course completion.
    """
    enrollment = models.OneToOneField(CourseEnrollment, on_delete=models.CASCADE, related_name='certificate')
    
    certificate_number = models.CharField(max_length=50, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    
    final_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=10, blank=True)
    
    # Generated file
    pdf_file = models.FileField(upload_to='lms/certificates/', null=True, blank=True)
    
    # Verification
    verification_url = models.URLField(max_length=500, blank=True)
    
    class Meta:
        db_table = 'lms_course_certificates'
        ordering = ['-issued_at']

    def __str__(self):
        return f"Certificate: {self.certificate_number}"
    
    def save(self, *args, **kwargs):
        if not self.certificate_number:
            # Generate certificate number
            import uuid
            self.certificate_number = f"CERT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

