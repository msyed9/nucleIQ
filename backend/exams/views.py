"""
Exams Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from datetime import datetime, timedelta

from .models import ExamTerm, Exam, ExamSchedule, Topic, LearningOutcome, QuestionBank
from .serializers import (
    ExamTermSerializer, ExamSerializer, ExamScheduleSerializer,
    TopicSerializer, LearningOutcomeSerializer, QuestionBankSerializer,
    PaperGenerationSerializer
)
from core.middleware import get_current_tenant


class ExamTermViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamTerm management."""
    
    serializer_class = ExamTermSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'term_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return ExamTerm.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('academic_year')


class ExamViewSet(viewsets.ModelViewSet):
    """ViewSet for Exam management."""
    
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam_term', 'subject', 'grade_level', 'status']
    search_fields = ['name', 'syllabus']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Exam.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('exam_term', 'subject', 'grade_level').prefetch_related('sections')


class ExamScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamSchedule management with conflict detection."""
    
    serializer_class = ExamScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam', 'section', 'exam_date']
    search_fields = ['exam__name', 'section__name', 'room']
    ordering_fields = ['exam_date', 'start_time']
    ordering = ['exam_date', 'start_time']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return ExamSchedule.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('exam', 'section', 'invigilator')
    
    @action(detail=False, methods=['post'])
    def check_conflicts(self, request):
        """
        Check for scheduling conflicts.
        
        POST /api/exams/schedules/check_conflicts/
        {
            "section_id": "uuid",
            "exam_date": "2025-01-15",
            "start_time": "09:00",
            "end_time": "11:00",
            "room": "101",
            "exclude_schedule_id": "uuid" (optional)
        }
        """
        section_id = request.data.get('section_id')
        exam_date = request.data.get('exam_date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        room = request.data.get('room')
        exclude_id = request.data.get('exclude_schedule_id')
        
        conflicts = {
            'section_conflicts': [],
            'room_conflicts': [],
            'is_available': True
        }
        
        tenant = get_current_tenant()
        
        # Check section conflicts
        if section_id and exam_date and start_time and end_time:
            section_schedules = ExamSchedule.objects.filter(
                tenant=tenant,
                section_id=section_id,
                exam_date=exam_date,
                is_deleted=False
            )
            
            if exclude_id:
                section_schedules = section_schedules.exclude(pk=exclude_id)
            
            for schedule in section_schedules:
                if (datetime.strptime(start_time, '%H:%M').time() < schedule.end_time and
                    datetime.strptime(end_time, '%H:%M').time() > schedule.start_time):
                    conflicts['section_conflicts'].append({
                        'exam': schedule.exam.name,
                        'time': f"{schedule.start_time} - {schedule.end_time}"
                    })
                    conflicts['is_available'] = False
        
        # Check room conflicts
        if room and exam_date and start_time and end_time:
            room_schedules = ExamSchedule.objects.filter(
                tenant=tenant,
                room=room,
                exam_date=exam_date,
                is_deleted=False
            )
            
            if exclude_id:
                room_schedules = room_schedules.exclude(pk=exclude_id)
            
            for schedule in room_schedules:
                if (datetime.strptime(start_time, '%H:%M').time() < schedule.end_time and
                    datetime.strptime(end_time, '%H:%M').time() > schedule.start_time):
                    conflicts['room_conflicts'].append({
                        'exam': schedule.exam.name,
                        'section': str(schedule.section),
                        'time': f"{schedule.start_time} - {schedule.end_time}"
                    })
                    conflicts['is_available'] = False
        
        return Response(conflicts)
    
    @action(detail=False, methods=['post'])
    def generate_schedule(self, request):
        """
        Auto-generate exam schedule avoiding conflicts.
        
        POST /api/exams/schedules/generate_schedule/
        {
            "exam_id": "uuid",
            "start_date": "2025-01-15",
            "start_time": "09:00",
            "duration_minutes": 120,
            "rooms": ["101", "102", "103"]
        }
        """
        exam_id = request.data.get('exam_id')
        start_date = datetime.strptime(request.data.get('start_date'), '%Y-%m-%d').date()
        start_time = datetime.strptime(request.data.get('start_time'), '%H:%M').time()
        duration = request.data.get('duration_minutes', 120)
        rooms = request.data.get('rooms', [])
        
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Exam not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        sections = exam.sections.all()
        created_schedules = []
        current_date = start_date
        room_index = 0
        
        for section in sections:
            # Calculate end time
            end_datetime = datetime.combine(current_date, start_time) + timedelta(minutes=duration)
            end_time = end_datetime.time()
            
            # Find available room
            room = rooms[room_index % len(rooms)] if rooms else f"Room {room_index + 1}"
            
            # Check for conflicts
            conflicts_exist = ExamSchedule.objects.filter(
                tenant=exam.tenant,
                section=section,
                exam_date=current_date,
                is_deleted=False
            ).exists()
            
            if conflicts_exist:
                # Move to next day
                current_date += timedelta(days=1)
            
            # Create schedule
            schedule = ExamSchedule.objects.create(
                tenant=exam.tenant,
                exam=exam,
                section=section,
                exam_date=current_date,
                start_time=start_time,
                end_time=end_time,
                room=room
            )
            
            created_schedules.append(schedule)
            room_index += 1
        
        serializer = self.get_serializer(created_schedules, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TopicViewSet(viewsets.ModelViewSet):
    """ViewSet for Topic management."""
    
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'grade_level']
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Topic.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('subject', 'grade_level')


class LearningOutcomeViewSet(viewsets.ModelViewSet):
    """ViewSet for LearningOutcome management."""
    
    serializer_class = LearningOutcomeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'topic', 'bloom_level']
    search_fields = ['code', 'description']
    ordering_fields = ['code']
    ordering = ['code']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return LearningOutcome.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('subject', 'topic')


class QuestionBankViewSet(viewsets.ModelViewSet):
    """ViewSet for QuestionBank management with paper generation."""
    
    serializer_class = QuestionBankSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'topic', 'difficulty', 'question_type', 'is_active']
    search_fields = ['question_text']
    ordering_fields = ['created_at', 'usage_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return QuestionBank.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('subject', 'topic', 'learning_outcome')
    
    @action(detail=False, methods=['post'])
    def generate_paper(self, request):
        """
        Generate question paper based on criteria.
        
        POST /api/exams/questions/generate_paper/
        {
            "subject_id": "uuid",
            "total_marks": 100,
            "easy_count": 10,
            "medium_count": 10,
            "hard_count": 5,
            "topic_ids": ["uuid1", "uuid2"] (optional)
        }
        """
        serializer = PaperGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        try:
            from tenants.models import Subject
            subject = Subject.objects.get(pk=data['subject_id'])
        except Subject.DoesNotExist:
            return Response(
                {'error': 'Subject not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        difficulty_distribution = {
            'EASY': data.get('easy_count', 0),
            'MEDIUM': data.get('medium_count', 0),
            'HARD': data.get('hard_count', 0)
        }
        
        topic_ids = data.get('topic_ids')
        
        questions = QuestionBank.generate_paper(
            subject=subject,
            total_marks=data['total_marks'],
            difficulty_distribution=difficulty_distribution,
            topic_ids=topic_ids
        )
        
        # Update usage count
        for question in questions:
            question.usage_count += 1
            question.save(update_fields=['usage_count'])
        
        result_serializer = self.get_serializer(questions, many=True)
        
        return Response({
            'questions': result_serializer.data,
            'total_questions': len(questions),
            'total_marks': sum(q.marks for q in questions)
        })
