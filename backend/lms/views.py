"""
LMS Module Views - Enhanced Version

Provides comprehensive LMS functionality including:
- Course Management
- Module and Lesson Management
- Enrollment and Progress Tracking
- Quizzes and Assessments
- Discussion Forums
- Live Classes
- Video Library
- Certificates
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
import random

from core.middleware import get_current_tenant
from core.viewsets import (
    TenantModelViewSet, TenantReadOnlyViewSet,
    success_response, error_response, paginated_response
)
from .models import (
    CourseCategory, Course, CourseModule, Lesson, LessonResource,
    CourseEnrollment, LessonProgress,
    LMSQuiz, LMSQuizQuestion, LMSQuizAttempt,
    CourseDiscussion, DiscussionReply,
    LiveClass, LiveClassAttendance,
    VideoLibrary, CourseReview, CourseCertificate
)
from .serializers import (
    CourseCategorySerializer,
    CourseSerializer, CourseListSerializer, CourseWithModulesSerializer,
    CourseModuleSerializer, LessonSerializer, LessonListSerializer,
    LessonResourceSerializer,
    CourseEnrollmentSerializer, EnrollSerializer,
    LessonProgressSerializer, UpdateProgressSerializer, CompleteProgressSerializer,
    LMSQuizSerializer, LMSQuizWithQuestionsSerializer,
    LMSQuizQuestionFullSerializer, LMSQuizAttemptSerializer,
    StartQuizSerializer, SubmitQuizSerializer,
    CourseDiscussionSerializer, CourseDiscussionListSerializer,
    DiscussionReplySerializer, CreateDiscussionSerializer, CreateReplySerializer,
    LiveClassSerializer, LiveClassListSerializer, LiveClassAttendanceSerializer,
    JoinClassSerializer, StartClassSerializer, EndClassSerializer,
    VideoLibrarySerializer,
    CourseReviewSerializer, CreateReviewSerializer,
    CourseCertificateSerializer,
    LMSDashboardSerializer, StudentLMSDashboardSerializer
)


# =============================================================================
# COURSE CATEGORY MANAGEMENT
# =============================================================================

class CourseCategoryViewSet(TenantModelViewSet):
    """
    ViewSet for Course Category management.
    """
    queryset = CourseCategory.objects.all()
    serializer_class = CourseCategorySerializer
    filterset_fields = ['is_active', 'parent']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']


# =============================================================================
# COURSE MANAGEMENT
# =============================================================================

class CourseViewSet(TenantModelViewSet):
    """
    ViewSet for Course management.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filterset_fields = ['category', 'course_type', 'difficulty', 'status', 'is_featured', 'instructor']
    search_fields = ['title', 'short_description', 'description']
    ordering_fields = ['title', 'created_at', 'enrolled_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        if self.action == 'with_curriculum':
            return CourseWithModulesSerializer
        return CourseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Non-admin users only see published courses
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='PUBLISHED')
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get LMS dashboard statistics.
        
        GET /api/lms/courses/dashboard/
        """
        tenant = get_current_tenant()
        
        courses = Course.objects.filter(tenant=tenant)
        enrollments = CourseEnrollment.objects.filter(tenant=tenant)
        live_classes = LiveClass.objects.filter(tenant=tenant)
        
        stats = {
            'total_courses': courses.count(),
            'published_courses': courses.filter(status='PUBLISHED').count(),
            'total_enrollments': enrollments.count(),
            'active_enrollments': enrollments.filter(status='ACTIVE').count(),
            'completed_enrollments': enrollments.filter(status='COMPLETED').count(),
            'total_live_classes': live_classes.count(),
            'upcoming_live_classes': live_classes.filter(
                start_time__gte=timezone.now(),
                status='SCHEDULED'
            ).count(),
            'total_videos': VideoLibrary.objects.filter(tenant=tenant).count(),
            'average_course_rating': CourseReview.objects.filter(
                tenant=tenant
            ).aggregate(avg=Avg('rating'))['avg'] or 0
        }
        
        return success_response(data=stats)
    
    @action(detail=True, methods=['get'])
    def with_curriculum(self, request, pk=None):
        """
        Get course with full curriculum (modules and lessons).
        
        GET /api/lms/courses/{id}/with_curriculum/
        """
        course = self.get_object()
        serializer = CourseWithModulesSerializer(course)
        return success_response(data=serializer.data)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish a course.
        
        POST /api/lms/courses/{id}/publish/
        """
        course = self.get_object()
        
        # Validate course has content
        if course.modules.count() == 0:
            return error_response('Course must have at least one module')
        
        if not Lesson.objects.filter(module__course=course).exists():
            return error_response('Course must have at least one lesson')
        
        course.status = 'PUBLISHED'
        course.published_at = timezone.now()
        course.save()
        
        return success_response(
            data=CourseSerializer(course).data,
            message='Course published successfully'
        )
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive a course.
        
        POST /api/lms/courses/{id}/archive/
        """
        course = self.get_object()
        course.status = 'ARCHIVED'
        course.save()
        
        return success_response(
            data=CourseSerializer(course).data,
            message='Course archived successfully'
        )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplicate a course (creates draft copy).
        
        POST /api/lms/courses/{id}/duplicate/
        """
        original = self.get_object()
        tenant = get_current_tenant()
        
        # Create new course
        new_course = Course.objects.create(
            tenant=tenant,
            title=f"Copy of {original.title}",
            slug=f"{original.slug}-copy-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            short_description=original.short_description,
            description=original.description,
            category=original.category,
            course_type=original.course_type,
            difficulty=original.difficulty,
            estimated_duration_hours=original.estimated_duration_hours,
            grade_level=original.grade_level,
            subject=original.subject,
            instructor=original.instructor,
            passing_percentage=original.passing_percentage,
            status='DRAFT'
        )
        
        # Copy modules and lessons
        for module in original.modules.all():
            new_module = CourseModule.objects.create(
                tenant=tenant,
                course=new_course,
                title=module.title,
                description=module.description,
                order=module.order,
                is_published=module.is_published
            )
            
            for lesson in module.lessons.all():
                Lesson.objects.create(
                    tenant=tenant,
                    module=new_module,
                    title=lesson.title,
                    description=lesson.description,
                    lesson_type=lesson.lesson_type,
                    order=lesson.order,
                    content_text=lesson.content_text,
                    video_url=lesson.video_url,
                    duration_minutes=lesson.duration_minutes,
                    is_preview=lesson.is_preview,
                    is_published=lesson.is_published
                )
        
        return success_response(
            data=CourseSerializer(new_course).data,
            message='Course duplicated successfully'
        )
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        Get course analytics.
        
        GET /api/lms/courses/{id}/analytics/
        """
        course = self.get_object()
        
        enrollments = course.enrollments.all()
        total_enrollments = enrollments.count()
        
        analytics = {
            'course_id': str(course.id),
            'course_title': course.title,
            'total_enrollments': total_enrollments,
            'active_students': enrollments.filter(status='ACTIVE').count(),
            'completion_rate': (
                enrollments.filter(status='COMPLETED').count() / total_enrollments * 100
                if total_enrollments > 0 else 0
            ),
            'average_progress': enrollments.aggregate(
                avg=Avg('progress_percentage')
            )['avg'] or 0,
            'average_score': enrollments.filter(
                final_score__isnull=False
            ).aggregate(avg=Avg('final_score'))['avg'] or 0,
            'average_rating': course.reviews.aggregate(
                avg=Avg('rating')
            )['avg'] or 0,
        }
        
        return success_response(data=analytics)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured courses.
        
        GET /api/lms/courses/featured/
        """
        tenant = get_current_tenant()
        courses = Course.objects.filter(
            tenant=tenant,
            status='PUBLISHED',
            is_featured=True
        )[:10]
        
        serializer = CourseListSerializer(courses, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Get popular courses (by enrollment count).
        
        GET /api/lms/courses/popular/
        """
        tenant = get_current_tenant()
        courses = Course.objects.filter(
            tenant=tenant,
            status='PUBLISHED'
        ).annotate(
            enrollment_count=Count('enrollments', filter=Q(enrollments__status='ACTIVE'))
        ).order_by('-enrollment_count')[:10]
        
        serializer = CourseListSerializer(courses, many=True)
        return success_response(data=serializer.data)


# =============================================================================
# MODULE AND LESSON MANAGEMENT
# =============================================================================

class CourseModuleViewSet(TenantModelViewSet):
    """
    ViewSet for Course Module management.
    """
    queryset = CourseModule.objects.all()
    serializer_class = CourseModuleSerializer
    filterset_fields = ['course', 'is_published']
    ordering = ['course', 'order']
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """
        Reorder modules within a course.
        
        POST /api/lms/modules/{id}/reorder/
        {"new_order": 2}
        """
        module = self.get_object()
        new_order = request.data.get('new_order')
        
        if new_order is None:
            return error_response('new_order is required')
        
        # Shift other modules
        siblings = CourseModule.objects.filter(course=module.course).exclude(id=module.id)
        
        if new_order < module.order:
            siblings.filter(order__gte=new_order, order__lt=module.order).update(
                order=F('order') + 1
            )
        else:
            siblings.filter(order__gt=module.order, order__lte=new_order).update(
                order=F('order') - 1
            )
        
        module.order = new_order
        module.save()
        
        return success_response(message='Module reordered successfully')


class LessonViewSet(TenantModelViewSet):
    """
    ViewSet for Lesson management.
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    filterset_fields = ['module', 'lesson_type', 'is_published', 'is_preview']
    search_fields = ['title', 'description']
    ordering = ['module', 'order']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LessonListSerializer
        return LessonSerializer
    
    @action(detail=True, methods=['get'])
    def content(self, request, pk=None):
        """
        Get lesson content for viewing.
        
        GET /api/lms/lessons/{id}/content/
        """
        lesson = self.get_object()
        
        # Check access
        if not lesson.is_preview:
            # Verify enrollment
            student = self._get_student(request.user)
            if student:
                enrollment = CourseEnrollment.objects.filter(
                    course=lesson.module.course,
                    student=student,
                    status='ACTIVE'
                ).first()
                
                if not enrollment:
                    return error_response('You are not enrolled in this course')
        
        serializer = LessonSerializer(lesson)
        return success_response(data=serializer.data)
    
    def _get_student(self, user):
        from students.models import Student
        try:
            return Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return None


class LessonResourceViewSet(TenantModelViewSet):
    """
    ViewSet for Lesson Resource management.
    """
    queryset = LessonResource.objects.all()
    serializer_class = LessonResourceSerializer
    filterset_fields = ['lesson', 'resource_type', 'is_active']
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """
        Record a resource download.
        
        POST /api/lms/resources/{id}/download/
        """
        resource = self.get_object()
        resource.download_count = F('download_count') + 1
        resource.save()
        resource.refresh_from_db()
        
        return success_response(data={
            'file_url': resource.file.url if resource.file else None,
            'download_count': resource.download_count
        })


# =============================================================================
# ENROLLMENT & PROGRESS
# =============================================================================

class CourseEnrollmentViewSet(TenantModelViewSet):
    """
    ViewSet for Course Enrollment management.
    """
    queryset = CourseEnrollment.objects.all()
    serializer_class = CourseEnrollmentSerializer
    filterset_fields = ['course', 'student', 'status']
    ordering = ['-enrolled_at']
    
    @action(detail=False, methods=['post'])
    def enroll(self, request):
        """
        Enroll current user's student in a course.
        
        POST /api/lms/enrollments/enroll/
        {"course_id": "uuid"}
        """
        serializer = EnrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        course_id = serializer.validated_data['course_id']
        
        try:
            course = Course.objects.get(id=course_id, tenant=tenant, status='PUBLISHED')
        except Course.DoesNotExist:
            return error_response('Course not found or not available')
        
        # Get student for current user
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found for this user')
        
        # Check if already enrolled
        existing = CourseEnrollment.objects.filter(
            course=course,
            student=student
        ).first()
        
        if existing:
            if existing.status == 'ACTIVE':
                return error_response('Already enrolled in this course')
            else:
                # Re-activate enrollment
                existing.status = 'ACTIVE'
                existing.save()
                return success_response(
                    data=CourseEnrollmentSerializer(existing).data,
                    message='Enrollment reactivated'
                )
        
        # Check enrollment limits
        if course.max_enrollments:
            current_count = course.enrollments.filter(status='ACTIVE').count()
            if current_count >= course.max_enrollments:
                return error_response('Course enrollment limit reached')
        
        # Create enrollment
        enrollment = CourseEnrollment.objects.create(
            tenant=tenant,
            course=course,
            student=student,
            status='ACTIVE'
        )
        
        return success_response(
            data=CourseEnrollmentSerializer(enrollment).data,
            message='Successfully enrolled in course'
        )
    
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        """
        Get current user's enrolled courses.
        
        GET /api/lms/enrollments/my_courses/
        """
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found')
        
        enrollments = CourseEnrollment.objects.filter(
            student=student
        ).select_related('course', 'last_lesson')
        
        serializer = CourseEnrollmentSerializer(enrollments, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """
        Get detailed progress for an enrollment.
        
        GET /api/lms/enrollments/{id}/progress/
        """
        enrollment = self.get_object()
        
        lesson_progress = LessonProgress.objects.filter(
            enrollment=enrollment
        ).select_related('lesson')
        
        total_lessons = Lesson.objects.filter(
            module__course=enrollment.course,
            is_published=True
        ).count()
        
        completed_lessons = lesson_progress.filter(status='COMPLETED').count()
        
        return success_response(data={
            'enrollment': CourseEnrollmentSerializer(enrollment).data,
            'completed_lessons': completed_lessons,
            'total_lessons': total_lessons,
            'completed_quizzes': lesson_progress.filter(
                lesson__lesson_type='QUIZ',
                status='COMPLETED'
            ).count(),
            'total_time_spent': lesson_progress.aggregate(
                total=Sum('time_spent_seconds')
            )['total'] or 0,
            'lesson_progress': LessonProgressSerializer(lesson_progress, many=True).data
        })
    
    def _get_student(self, user):
        from students.models import Student
        try:
            return Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return None


class LessonProgressViewSet(TenantModelViewSet):
    """
    ViewSet for Lesson Progress tracking.
    """
    queryset = LessonProgress.objects.all()
    serializer_class = LessonProgressSerializer
    filterset_fields = ['enrollment', 'lesson', 'status']
    
    @action(detail=False, methods=['post'])
    def update_progress(self, request):
        """
        Update progress for a lesson.
        
        POST /api/lms/progress/update_progress/
        {
            "lesson_id": "uuid",
            "progress_percentage": 50,
            "time_spent_seconds": 120,
            "video_position_seconds": 300
        }
        """
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return error_response('lesson_id is required')
        
        serializer = UpdateProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        tenant = get_current_tenant()
        
        try:
            lesson = Lesson.objects.get(id=lesson_id, tenant=tenant)
        except Lesson.DoesNotExist:
            return error_response('Lesson not found')
        
        # Get student and enrollment
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found')
        
        enrollment = CourseEnrollment.objects.filter(
            course=lesson.module.course,
            student=student,
            status='ACTIVE'
        ).first()
        
        if not enrollment:
            return error_response('Not enrolled in this course')
        
        # Update or create progress
        progress, created = LessonProgress.objects.get_or_create(
            tenant=tenant,
            enrollment=enrollment,
            lesson=lesson,
            defaults={'status': 'IN_PROGRESS', 'started_at': timezone.now()}
        )
        
        progress.progress_percentage = data['progress_percentage']
        
        if 'time_spent_seconds' in data:
            progress.time_spent_seconds = F('time_spent_seconds') + data['time_spent_seconds']
        
        if 'video_position_seconds' in data:
            progress.video_position_seconds = data['video_position_seconds']
        
        if 'is_bookmarked' in data:
            progress.is_bookmarked = data['is_bookmarked']
        
        if 'notes' in data:
            progress.notes = data['notes']
        
        if data['progress_percentage'] >= 100:
            progress.status = 'COMPLETED'
            progress.completed_at = timezone.now()
        elif progress.status == 'NOT_STARTED':
            progress.status = 'IN_PROGRESS'
            progress.started_at = timezone.now()
        
        progress.save()
        progress.refresh_from_db()
        
        # Update enrollment progress
        self._update_enrollment_progress(enrollment)
        
        # Update last accessed
        enrollment.last_accessed_at = timezone.now()
        enrollment.last_lesson = lesson
        enrollment.save()
        
        return success_response(
            data=LessonProgressSerializer(progress).data,
            message='Progress updated'
        )
    
    @action(detail=False, methods=['post'])
    def complete(self, request):
        """
        Mark a lesson as complete.
        
        POST /api/lms/progress/complete/
        {"lesson_id": "uuid"}
        """
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return error_response('lesson_id is required')
        
        tenant = get_current_tenant()
        
        try:
            lesson = Lesson.objects.get(id=lesson_id, tenant=tenant)
        except Lesson.DoesNotExist:
            return error_response('Lesson not found')
        
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found')
        
        enrollment = CourseEnrollment.objects.filter(
            course=lesson.module.course,
            student=student,
            status='ACTIVE'
        ).first()
        
        if not enrollment:
            return error_response('Not enrolled in this course')
        
        progress, created = LessonProgress.objects.get_or_create(
            tenant=tenant,
            enrollment=enrollment,
            lesson=lesson,
            defaults={'started_at': timezone.now()}
        )
        
        progress.status = 'COMPLETED'
        progress.progress_percentage = 100
        progress.completed_at = timezone.now()
        
        serializer = CompleteProgressSerializer(data=request.data)
        if serializer.is_valid():
            if 'time_spent_seconds' in serializer.validated_data:
                progress.time_spent_seconds = serializer.validated_data['time_spent_seconds']
            if 'quiz_score' in serializer.validated_data:
                progress.quiz_score = serializer.validated_data['quiz_score']
        
        progress.save()
        
        # Update enrollment progress
        self._update_enrollment_progress(enrollment)
        
        return success_response(
            data=LessonProgressSerializer(progress).data,
            message='Lesson marked as complete'
        )
    
    def _update_enrollment_progress(self, enrollment):
        """Calculate and update overall enrollment progress."""
        total_lessons = Lesson.objects.filter(
            module__course=enrollment.course,
            is_published=True
        ).count()
        
        if total_lessons == 0:
            return
        
        completed = LessonProgress.objects.filter(
            enrollment=enrollment,
            status='COMPLETED'
        ).count()
        
        enrollment.progress_percentage = (completed / total_lessons) * 100
        
        # Check if course is complete
        if completed >= total_lessons:
            enrollment.status = 'COMPLETED'
            enrollment.completed_at = timezone.now()
            
            # Calculate average score
            scores = LessonProgress.objects.filter(
                enrollment=enrollment,
                quiz_score__isnull=False
            ).aggregate(avg=Avg('quiz_score'))
            enrollment.final_score = scores['avg']
        
        enrollment.save()
    
    def _get_student(self, user):
        from students.models import Student
        try:
            return Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return None


# =============================================================================
# QUIZ MANAGEMENT
# =============================================================================

class LMSQuizViewSet(TenantModelViewSet):
    """
    ViewSet for LMS Quiz management.
    """
    queryset = LMSQuiz.objects.all()
    serializer_class = LMSQuizSerializer
    filterset_fields = ['quiz_type', 'is_published']
    search_fields = ['title', 'description']
    
    @action(detail=True, methods=['get'])
    def with_questions(self, request, pk=None):
        """
        Get quiz with all questions (for taking the quiz).
        
        GET /api/lms/quizzes/{id}/with_questions/
        """
        quiz = self.get_object()
        serializer = LMSQuizWithQuestionsSerializer(quiz)
        data = serializer.data
        
        # Randomize questions if enabled
        if quiz.randomize_questions:
            questions = list(data['questions'])
            random.shuffle(questions)
            
            # Limit to question_count if set
            if quiz.question_count:
                questions = questions[:quiz.question_count]
            
            data['questions'] = questions
        
        # Randomize options if enabled
        if quiz.randomize_options:
            for q in data['questions']:
                if q.get('options'):
                    random.shuffle(q['options'])
        
        return success_response(data=data)


class LMSQuizQuestionViewSet(TenantModelViewSet):
    """
    ViewSet for Quiz Question management.
    """
    queryset = LMSQuizQuestion.objects.all()
    serializer_class = LMSQuizQuestionFullSerializer
    filterset_fields = ['quiz', 'question_type', 'is_active']
    ordering = ['quiz', 'order']


class LMSQuizAttemptViewSet(TenantModelViewSet):
    """
    ViewSet for Quiz Attempt management.
    """
    queryset = LMSQuizAttempt.objects.all()
    serializer_class = LMSQuizAttemptSerializer
    filterset_fields = ['quiz', 'enrollment', 'student', 'status']
    ordering = ['-started_at']
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """
        Start a quiz attempt.
        
        POST /api/lms/quiz-attempts/start/
        {"quiz_id": "uuid"}
        """
        serializer = StartQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        quiz_id = serializer.validated_data['quiz_id']
        
        try:
            quiz = LMSQuiz.objects.get(id=quiz_id, tenant=tenant)
        except LMSQuiz.DoesNotExist:
            return error_response('Quiz not found')
        
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found')
        
        # Get the lesson/course for this quiz
        lesson = Lesson.objects.filter(quiz=quiz).first()
        if not lesson:
            return error_response('Quiz is not associated with any lesson')
        
        enrollment = CourseEnrollment.objects.filter(
            course=lesson.module.course,
            student=student,
            status='ACTIVE'
        ).first()
        
        if not enrollment:
            return error_response('Not enrolled in this course')
        
        # Check max attempts
        attempt_count = LMSQuizAttempt.objects.filter(
            quiz=quiz,
            student=student
        ).count()
        
        if attempt_count >= quiz.max_attempts:
            return error_response(f'Maximum attempts ({quiz.max_attempts}) reached')
        
        # Create attempt
        attempt = LMSQuizAttempt.objects.create(
            tenant=tenant,
            quiz=quiz,
            enrollment=enrollment,
            student=student,
            attempt_number=attempt_count + 1,
            total_marks=quiz.questions.filter(is_active=True).aggregate(
                total=Sum('marks')
            )['total'] or 0
        )
        
        return success_response(
            data=LMSQuizAttemptSerializer(attempt).data,
            message='Quiz started'
        )
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit quiz answers.
        
        POST /api/lms/quiz-attempts/{id}/submit/
        {"answers": {"question_id": "answer", ...}}
        """
        attempt = self.get_object()
        
        if attempt.status != 'IN_PROGRESS':
            return error_response('This attempt has already been submitted')
        
        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        answers = serializer.validated_data['answers']
        attempt.answers = answers
        attempt.submitted_at = timezone.now()
        attempt.time_taken_seconds = int(
            (attempt.submitted_at - attempt.started_at).total_seconds()
        )
        
        # Grade the quiz
        obtained_marks = 0
        for question in attempt.quiz.questions.filter(is_active=True):
            q_id = str(question.id)
            if q_id in answers:
                if self._check_answer(question, answers[q_id]):
                    obtained_marks += float(question.marks)
                elif question.negative_marks > 0:
                    obtained_marks -= float(question.negative_marks)
        
        attempt.obtained_marks = max(0, obtained_marks)
        attempt.percentage = (
            attempt.obtained_marks / attempt.total_marks * 100
            if attempt.total_marks > 0 else 0
        )
        
        if attempt.percentage >= attempt.quiz.passing_score:
            attempt.status = 'PASSED'
        else:
            attempt.status = 'FAILED'
        
        attempt.save()
        
        # Update lesson progress
        lesson = Lesson.objects.filter(quiz=attempt.quiz).first()
        if lesson:
            progress, _ = LessonProgress.objects.get_or_create(
                tenant=get_current_tenant(),
                enrollment=attempt.enrollment,
                lesson=lesson
            )
            progress.quiz_score = attempt.percentage
            progress.quiz_attempts = (progress.quiz_attempts or 0) + 1
            if attempt.status == 'PASSED':
                progress.status = 'COMPLETED'
                progress.completed_at = timezone.now()
            progress.save()
        
        return success_response(
            data=LMSQuizAttemptSerializer(attempt).data,
            message='Quiz submitted successfully'
        )
    
    def _check_answer(self, question, given_answer):
        """Check if the given answer is correct."""
        correct = question.correct_answer
        
        if question.question_type == 'MCQ' or question.question_type == 'TRUE_FALSE':
            return str(given_answer).lower() == str(correct).lower()
        elif question.question_type == 'MULTI_SELECT':
            if isinstance(given_answer, list) and isinstance(correct, list):
                return set(given_answer) == set(correct)
        elif question.question_type == 'SHORT_ANSWER':
            return str(given_answer).lower().strip() == str(correct).lower().strip()
        
        return False
    
    def _get_student(self, user):
        from students.models import Student
        try:
            return Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return None


# =============================================================================
# DISCUSSION FORUMS
# =============================================================================

class CourseDiscussionViewSet(TenantModelViewSet):
    """
    ViewSet for Course Discussion management.
    """
    queryset = CourseDiscussion.objects.all()
    serializer_class = CourseDiscussionSerializer
    filterset_fields = ['course', 'lesson', 'discussion_type', 'is_pinned', 'is_answered']
    search_fields = ['title', 'content']
    ordering = ['-is_pinned', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseDiscussionListSerializer
        return CourseDiscussionSerializer
    
    @action(detail=False, methods=['post'])
    def create_discussion(self, request):
        """
        Create a new discussion.
        
        POST /api/lms/discussions/create_discussion/
        """
        serializer = CreateDiscussionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        tenant = get_current_tenant()
        
        try:
            course = Course.objects.get(id=data['course_id'], tenant=tenant)
        except Course.DoesNotExist:
            return error_response('Course not found')
        
        lesson = None
        if 'lesson_id' in data:
            try:
                lesson = Lesson.objects.get(id=data['lesson_id'], tenant=tenant)
            except Lesson.DoesNotExist:
                pass
        
        discussion = CourseDiscussion.objects.create(
            tenant=tenant,
            course=course,
            lesson=lesson,
            title=data['title'],
            content=data['content'],
            discussion_type=data['discussion_type'],
            author_user=request.user,
            author_type='TEACHER' if hasattr(request.user, 'staff') else 'STUDENT'
        )
        
        return success_response(
            data=CourseDiscussionSerializer(discussion).data,
            message='Discussion created'
        )
    
    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """Toggle pin status of a discussion."""
        discussion = self.get_object()
        discussion.is_pinned = not discussion.is_pinned
        discussion.save()
        return success_response(
            data={'is_pinned': discussion.is_pinned},
            message='Pin status updated'
        )
    
    @action(detail=True, methods=['post'])
    def toggle_lock(self, request, pk=None):
        """Toggle lock status of a discussion."""
        discussion = self.get_object()
        discussion.is_locked = not discussion.is_locked
        discussion.save()
        return success_response(
            data={'is_locked': discussion.is_locked},
            message='Lock status updated'
        )


class DiscussionReplyViewSet(TenantModelViewSet):
    """
    ViewSet for Discussion Reply management.
    """
    queryset = DiscussionReply.objects.all()
    serializer_class = DiscussionReplySerializer
    filterset_fields = ['discussion', 'is_accepted_answer']
    ordering = ['-is_accepted_answer', 'created_at']
    
    @action(detail=False, methods=['post'])
    def create_reply(self, request):
        """
        Create a reply to a discussion.
        
        POST /api/lms/replies/create_reply/
        """
        serializer = CreateReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        tenant = get_current_tenant()
        
        try:
            discussion = CourseDiscussion.objects.get(
                id=data['discussion_id'],
                tenant=tenant
            )
        except CourseDiscussion.DoesNotExist:
            return error_response('Discussion not found')
        
        if discussion.is_locked:
            return error_response('This discussion is locked')
        
        parent_reply = None
        if 'parent_reply_id' in data:
            try:
                parent_reply = DiscussionReply.objects.get(
                    id=data['parent_reply_id'],
                    discussion=discussion
                )
            except DiscussionReply.DoesNotExist:
                pass
        
        reply = DiscussionReply.objects.create(
            tenant=tenant,
            discussion=discussion,
            parent_reply=parent_reply,
            content=data['content'],
            author_user=request.user,
            author_type='TEACHER' if hasattr(request.user, 'staff') else 'STUDENT'
        )
        
        return success_response(
            data=DiscussionReplySerializer(reply).data,
            message='Reply posted'
        )
    
    @action(detail=True, methods=['post'])
    def mark_as_answer(self, request, pk=None):
        """Mark a reply as the accepted answer."""
        reply = self.get_object()
        
        # Unmark any existing accepted answer
        DiscussionReply.objects.filter(
            discussion=reply.discussion,
            is_accepted_answer=True
        ).update(is_accepted_answer=False)
        
        reply.is_accepted_answer = True
        reply.save()
        
        # Mark discussion as answered
        reply.discussion.is_answered = True
        reply.discussion.save()
        
        return success_response(message='Reply marked as accepted answer')
    
    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        """Upvote a reply."""
        reply = self.get_object()
        reply.upvotes = F('upvotes') + 1
        reply.save()
        reply.refresh_from_db()
        
        return success_response(data={'upvotes': reply.upvotes})


# =============================================================================
# LIVE CLASSES
# =============================================================================

class LiveClassViewSet(TenantModelViewSet):
    """
    ViewSet for Live Class management.
    """
    queryset = LiveClass.objects.all()
    serializer_class = LiveClassSerializer
    filterset_fields = ['course', 'grade_level', 'section', 'subject', 'teacher', 'status']
    search_fields = ['title', 'description']
    ordering = ['-start_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LiveClassListSerializer
        return LiveClassSerializer
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming live classes.
        
        GET /api/lms/live-classes/upcoming/
        """
        tenant = get_current_tenant()
        classes = LiveClass.objects.filter(
            tenant=tenant,
            start_time__gte=timezone.now(),
            status='SCHEDULED'
        ).order_by('start_time')[:20]
        
        serializer = LiveClassListSerializer(classes, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def live_now(self, request):
        """
        Get classes that are currently live.
        
        GET /api/lms/live-classes/live_now/
        """
        tenant = get_current_tenant()
        classes = LiveClass.objects.filter(
            tenant=tenant,
            status='LIVE'
        )
        
        serializer = LiveClassListSerializer(classes, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        Start a live class.
        
        POST /api/lms/live-classes/{id}/start/
        """
        live_class = self.get_object()
        
        if live_class.status != 'SCHEDULED':
            return error_response('Class is not scheduled or already started')
        
        serializer = StartClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        live_class.status = 'LIVE'
        live_class.actual_start_time = timezone.now()
        
        if 'meeting_link' in data:
            live_class.meeting_link = data['meeting_link']
        if 'meeting_id' in data:
            live_class.meeting_id = data['meeting_id']
        if 'passcode' in data:
            live_class.passcode = data['passcode']
        
        live_class.save()
        
        return success_response(
            data=LiveClassSerializer(live_class).data,
            message='Class started'
        )
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """
        End a live class.
        
        POST /api/lms/live-classes/{id}/end/
        """
        live_class = self.get_object()
        
        if live_class.status != 'LIVE':
            return error_response('Class is not currently live')
        
        serializer = EndClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        live_class.status = 'ENDED'
        live_class.is_completed = True
        live_class.actual_end_time = timezone.now()
        
        if 'recording_link' in data:
            live_class.recording_link = data['recording_link']
        
        # Calculate actual participants
        live_class.actual_participants = live_class.attendance_records.count()
        
        live_class.save()
        
        return success_response(
            data=LiveClassSerializer(live_class).data,
            message='Class ended'
        )
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """
        Record student joining a live class.
        
        POST /api/lms/live-classes/{id}/join/
        """
        live_class = self.get_object()
        
        if live_class.status != 'LIVE':
            return error_response('Class is not currently live')
        
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found')
        
        serializer = JoinClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        attendance, created = LiveClassAttendance.objects.update_or_create(
            tenant=get_current_tenant(),
            live_class=live_class,
            student=student,
            defaults={
                'joined_at': timezone.now(),
                'device_type': data.get('device_type', ''),
                'ip_address': request.META.get('REMOTE_ADDR')
            }
        )
        
        return success_response(
            data={
                'meeting_link': live_class.meeting_link,
                'meeting_id': live_class.meeting_id,
                'passcode': live_class.passcode
            },
            message='Joined class'
        )
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """
        Get attendance for a live class.
        
        GET /api/lms/live-classes/{id}/attendance/
        """
        live_class = self.get_object()
        attendance = live_class.attendance_records.all()
        
        serializer = LiveClassAttendanceSerializer(attendance, many=True)
        return success_response(data=serializer.data)
    
    def _get_student(self, user):
        from students.models import Student
        try:
            return Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return None


# =============================================================================
# VIDEO LIBRARY
# =============================================================================

class VideoLibraryViewSet(TenantModelViewSet):
    """
    ViewSet for Video Library management.
    """
    queryset = VideoLibrary.objects.all()
    serializer_class = VideoLibrarySerializer
    filterset_fields = ['category', 'subject', 'grade_level', 'is_published']
    search_fields = ['title', 'description', 'tags']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=get_current_tenant(),
            uploaded_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def record_view(self, request, pk=None):
        """
        Record a video view.
        
        POST /api/lms/videos/{id}/record_view/
        """
        video = self.get_object()
        video.view_count = F('view_count') + 1
        video.save()
        
        return success_response(message='View recorded')


# =============================================================================
# REVIEWS & CERTIFICATES
# =============================================================================

class CourseReviewViewSet(TenantModelViewSet):
    """
    ViewSet for Course Review management.
    """
    queryset = CourseReview.objects.all()
    serializer_class = CourseReviewSerializer
    filterset_fields = ['course', 'rating', 'is_published']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['post'])
    def submit_review(self, request):
        """
        Submit a course review.
        
        POST /api/lms/reviews/submit_review/
        """
        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        tenant = get_current_tenant()
        
        try:
            course = Course.objects.get(id=data['course_id'], tenant=tenant)
        except Course.DoesNotExist:
            return error_response('Course not found')
        
        student = self._get_student(request.user)
        if not student:
            return error_response('No student profile found')
        
        # Verify enrollment
        enrollment = CourseEnrollment.objects.filter(
            course=course,
            student=student
        ).first()
        
        if not enrollment:
            return error_response('You must be enrolled to review this course')
        
        review, created = CourseReview.objects.update_or_create(
            tenant=tenant,
            course=course,
            student=student,
            defaults={
                'rating': data['rating'],
                'title': data.get('title', ''),
                'review': data.get('review', '')
            }
        )
        
        return success_response(
            data=CourseReviewSerializer(review).data,
            message='Review submitted' if created else 'Review updated'
        )
    
    def _get_student(self, user):
        from students.models import Student
        try:
            return Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return None


class CourseCertificateViewSet(TenantReadOnlyViewSet):
    """
    ViewSet for Course Certificates (read-only).
    """
    queryset = CourseCertificate.objects.all()
    serializer_class = CourseCertificateSerializer
    filterset_fields = ['enrollment__course', 'enrollment__student']
    
    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """
        Verify a certificate.
        
        GET /api/lms/certificates/{certificate_number}/verify/
        """
        # Allow verification by certificate number
        certificate_number = pk
        
        try:
            cert = CourseCertificate.objects.get(certificate_number=certificate_number)
        except CourseCertificate.DoesNotExist:
            return error_response('Certificate not found')
        
        return success_response(data={
            'valid': True,
            'certificate_number': cert.certificate_number,
            'course': cert.enrollment.course.title,
            'student': cert.enrollment.student.get_full_name(),
            'issued_at': cert.issued_at,
            'final_score': cert.final_score,
            'grade': cert.grade
        })
