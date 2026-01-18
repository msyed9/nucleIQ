"""
Academics Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import Assignment, Submission
from .serializers import (
    AssignmentSerializer,
    AssignmentCreateSerializer,
    SubmissionSerializer,
    SubmissionCreateSerializer,
    SubmissionGradeSerializer,
    StudentSubmissionSerializer
)
from core.middleware import get_current_tenant


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing assignments.
    
    Provides CRUD operations and additional actions for:
    - Publishing assignments
    - Getting submissions
    - Statistics
    """
    
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'subject', 'section', 'teacher', 'status', 'assignment_type']
    search_fields = ['title', 'description']
    ordering_fields = ['assigned_date', 'due_date', 'created_at']
    ordering = ['-assigned_date']
    
    def get_queryset(self):
        """
        Filter queryset by tenant and include related objects.
        """
        tenant = get_current_tenant()
        return Assignment.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related(
            'academic_year',
            'subject',
            'section',
            'section__grade_level',
            'teacher'
        )
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return AssignmentCreateSerializer
        return AssignmentSerializer
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish an assignment (change status from DRAFT to PUBLISHED).
        
        POST /api/academics/assignments/{id}/publish/
        """
        assignment = self.get_object()
        
        if assignment.status == 'PUBLISHED':
            return Response(
                {'error': 'Assignment is already published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignment.status = 'PUBLISHED'
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Close an assignment (no more submissions allowed).
        
        POST /api/academics/assignments/{id}/close/
        """
        assignment = self.get_object()
        assignment.status = 'CLOSED'
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """
        Get all submissions for an assignment.
        
        GET /api/academics/assignments/{id}/submissions/
        """
        assignment = self.get_object()
        submissions = assignment.submissions.filter(is_deleted=False)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            submissions = submissions.filter(status=status_filter)
        
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Get statistics for an assignment.
        
        GET /api/academics/assignments/{id}/statistics/
        """
        assignment = self.get_object()
        
        stats = {
            'total_submissions': assignment.get_submission_count(),
            'graded': assignment.get_graded_count(),
            'pending': assignment.get_pending_count(),
            'submission_percentage': assignment.get_submission_percentage(),
            'is_overdue': assignment.is_overdue(),
            'status': assignment.status,
            'max_marks': float(assignment.max_marks)
        }
        
        # Calculate average marks if there are graded submissions
        graded_submissions = assignment.submissions.filter(
            is_deleted=False,
            status='GRADED',
            marks_obtained__isnull=False
        )
        
        if graded_submissions.exists():
            from django.db.models import Avg, Max, Min
            aggregates = graded_submissions.aggregate(
                avg_marks=Avg('marks_obtained'),
                max_marks_obtained=Max('marks_obtained'),
                min_marks_obtained=Min('marks_obtained')
            )
            stats.update({
                'average_marks': float(aggregates['avg_marks'] or 0),
                'highest_marks': float(aggregates['max_marks_obtained'] or 0),
                'lowest_marks': float(aggregates['min_marks_obtained'] or 0),
                'average_percentage': round(
                    (float(aggregates['avg_marks'] or 0) / float(assignment.max_marks)) * 100, 2
                )
            })
        
        return Response(stats)


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing submissions.
    
    Provides CRUD operations and additional actions for:
    - Submitting assignments
    - Grading submissions
    - Student's own submissions
    """
    
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['assignment', 'student', 'status', 'is_late']
    search_fields = ['student__first_name', 'student__last_name', 'assignment__title']
    ordering_fields = ['submitted_at', 'graded_at', 'marks_obtained']
    ordering = ['-submitted_at']
    
    def get_queryset(self):
        """
        Filter queryset by tenant and include related objects.
        """
        tenant = get_current_tenant()
        return Submission.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related(
            'assignment',
            'assignment__subject',
            'student',
            'graded_by'
        )
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return SubmissionCreateSerializer
        elif self.action == 'my_submissions':
            return StudentSubmissionSerializer
        return SubmissionSerializer
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit an assignment (change status from DRAFT to SUBMITTED).
        
        POST /api/academics/submissions/{id}/submit/
        """
        submission = self.get_object()
        
        if submission.status != 'DRAFT':
            return Response(
                {'error': 'Submission has already been submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if assignment allows late submission
        if submission.assignment.is_overdue() and not submission.assignment.allow_late_submission:
            return Response(
                {'error': 'Assignment deadline has passed and late submissions are not allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        submission.submit()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """
        Grade a submission.
        
        POST /api/academics/submissions/{id}/grade/
        {
            "marks_obtained": 85.5,
            "remarks": "Good work!",
            "feedback_file": <file>
        }
        """
        submission = self.get_object()
        
        if submission.status not in ['SUBMITTED', 'GRADED']:
            return Response(
                {'error': 'Can only grade submitted assignments'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SubmissionGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Validate marks against assignment max marks
        marks = serializer.validated_data['marks_obtained']
        if marks > submission.assignment.max_marks:
            return Response(
                {'error': f'Marks cannot exceed {submission.assignment.max_marks}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get graded_by from request user
        # Note: You'll need to get the staff instance from the user
        # For now, using the assignment's teacher
        graded_by = submission.assignment.teacher
        
        submission.grade(
            marks=marks,
            remarks=serializer.validated_data.get('remarks', ''),
            graded_by=graded_by
        )
        
        # Handle feedback file if provided
        if 'feedback_file' in serializer.validated_data:
            submission.feedback_file = serializer.validated_data['feedback_file']
            submission.save()
        
        result_serializer = self.get_serializer(submission)
        return Response(result_serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        """
        Get submissions for the current student.
        
        GET /api/academics/submissions/my_submissions/
        """
        # Note: You'll need to get the student instance from the request user
        # For now, returning all submissions
        # In production, filter by: student=request.user.student
        
        submissions = self.get_queryset()
        
        # Optional filters
        assignment_id = request.query_params.get('assignment')
        if assignment_id:
            submissions = submissions.filter(assignment_id=assignment_id)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            submissions = submissions.filter(status=status_filter)
        
        serializer = StudentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_grading(self, request):
        """
        Get submissions pending grading (for teachers).
        
        GET /api/academics/submissions/pending_grading/
        """
        submissions = self.get_queryset().filter(status='SUBMITTED')
        
        # Optional filter by assignment
        assignment_id = request.query_params.get('assignment')
        if assignment_id:
            submissions = submissions.filter(assignment_id=assignment_id)
        
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)


# New ViewSets for Homework and Syllabus
from .models import Homework, HomeworkCompletion, Syllabus, Chapter, SyllabusProgress
from .serializers import (
    HomeworkSerializer, HomeworkCompletionSerializer,
    SyllabusSerializer, ChapterSerializer, SyllabusProgressSerializer
)


class HomeworkViewSet(viewsets.ModelViewSet):
    """ViewSet for managing homework."""
    
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'subject', 'section', 'teacher', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['assigned_date', 'due_date']
    ordering = ['-assigned_date']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Homework.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('academic_year', 'subject', 'section', 'teacher')
    
    @action(detail=True, methods=['get'])
    def completions(self, request, pk=None):
        """Get completions for a homework."""
        homework = self.get_object()
        completions = homework.completions.filter(is_deleted=False)
        serializer = HomeworkCompletionSerializer(completions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending homework for current date."""
        today = timezone.now().date()
        homework = self.get_queryset().filter(due_date__gte=today)
        serializer = self.get_serializer(homework, many=True)
        return Response(serializer.data)


class HomeworkCompletionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing homework completions."""
    
    serializer_class = HomeworkCompletionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['homework', 'student', 'is_completed']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return HomeworkCompletion.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('homework', 'student')
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark homework as complete."""
        completion = self.get_object()
        completion.mark_complete()
        serializer = self.get_serializer(completion)
        return Response(serializer.data)


class SyllabusViewSet(viewsets.ModelViewSet):
    """ViewSet for managing syllabi."""
    
    serializer_class = SyllabusSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['subject', 'grade_level', 'academic_year']
    search_fields = ['name', 'description']
    ordering = ['subject__name', 'grade_level__order']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Syllabus.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('subject', 'grade_level', 'academic_year').prefetch_related('chapters')
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get progress for a syllabus across sections."""
        syllabus = self.get_object()
        progress = syllabus.progress_records.filter(is_deleted=False)
        
        section_id = request.query_params.get('section')
        if section_id:
            progress = progress.filter(section_id=section_id)
        
        serializer = SyllabusProgressSerializer(progress, many=True)
        return Response(serializer.data)


class ChapterViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chapters."""
    
    serializer_class = ChapterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['syllabus', 'is_completed']
    search_fields = ['name', 'description']
    ordering = ['syllabus', 'order']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Chapter.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('syllabus', 'completed_by')
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark chapter as complete."""
        chapter = self.get_object()
        # Get teacher from request if available
        teacher = None
        chapter.mark_complete(teacher)
        serializer = self.get_serializer(chapter)
        return Response(serializer.data)


class SyllabusProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing syllabus progress."""
    
    serializer_class = SyllabusProgressSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['syllabus', 'section', 'chapter', 'is_completed']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return SyllabusProgress.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('syllabus', 'section', 'chapter', 'teacher')
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark progress as complete."""
        progress = self.get_object()
        progress.is_completed = True
        progress.completed_date = timezone.now().date()
        progress.save()
        serializer = self.get_serializer(progress)
        return Response(serializer.data)

