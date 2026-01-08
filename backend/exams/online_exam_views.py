"""
Online Exam Views - Handles online examination functionality
"""

import random
import csv
import io
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import (
    OnlineExam, OnlineExamSession, OnlineExamAnswer, QuestionBank, Topic
)
from .serializers import (
    OnlineExamSerializer, OnlineExamListSerializer, OnlineExamSessionSerializer,
    OnlineExamSessionListSerializer, OnlineExamAnswerSerializer,
    OnlineExamQuestionSerializer, StartOnlineExamSerializer,
    SubmitAnswerSerializer, SubmitExamSerializer, QuestionImportSerializer
)
from core.middleware import get_current_tenant
from students.models import Student


class OnlineExamViewSet(viewsets.ModelViewSet):
    """ViewSet for OnlineExam management."""
    
    serializer_class = OnlineExamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'grade_level', 'status']
    search_fields = ['name', 'instructions']
    ordering_fields = ['start_datetime', 'created_at']
    ordering = ['-start_datetime']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return OnlineExam.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('subject', 'grade_level').prefetch_related('sections', 'questions')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OnlineExamListSerializer
        return OnlineExamSerializer
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Get available online exams for current user (student).
        
        GET /api/exams/online-exams/available/
        """
        user = request.user
        
        # Get student from user
        try:
            student = Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all active online exams
        tenant = get_current_tenant()
        now = timezone.now()
        
        available_exams = OnlineExam.objects.filter(
            tenant=tenant,
            is_deleted=False,
            status='ACTIVE',
            start_datetime__lte=now,
            end_datetime__gte=now,
            sections=student.section
        ).exclude(
            # Exclude exams already completed by student
            sessions__student=student,
            sessions__status__in=['SUBMITTED', 'AUTO_SUBMITTED']
        ).distinct()
        
        serializer = OnlineExamListSerializer(available_exams, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        Start an online exam for a student.
        
        POST /api/exams/online-exams/{id}/start/
        {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0..."
        }
        """
        online_exam = self.get_object()
        user = request.user
        
        # Get student from user
        try:
            student = Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if exam is available for student
        if not online_exam.is_available_for_student(student):
            return Response(
                {'error': 'This exam is not available for you'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if student already has a session
        existing_session = OnlineExamSession.objects.filter(
            online_exam=online_exam,
            student=student,
            is_deleted=False
        ).first()
        
        if existing_session:
            if existing_session.status in ['SUBMITTED', 'AUTO_SUBMITTED']:
                return Response(
                    {'error': 'You have already completed this exam'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Return existing session
                serializer = OnlineExamSessionSerializer(existing_session)
                return Response(serializer.data)
        
        # Create new session
        with transaction.atomic():
            session = OnlineExamSession.objects.create(
                tenant=get_current_tenant(),
                online_exam=online_exam,
                student=student,
                ip_address=request.data.get('ip_address'),
                user_agent=request.data.get('user_agent'),
                status='IN_PROGRESS'
            )
            
            # Get questions for this exam
            questions = list(online_exam.questions.all())
            
            # Shuffle questions if enabled
            if online_exam.shuffle_questions:
                random.shuffle(questions)
            
            # Create answer placeholders for all questions
            for question in questions:
                OnlineExamAnswer.objects.create(
                    tenant=get_current_tenant(),
                    session=session,
                    question=question
                )
        
        # Serialize session with questions
        session_serializer = OnlineExamSessionSerializer(session)
        
        # Get questions (without answers)
        questions_data = OnlineExamQuestionSerializer(questions, many=True).data
        
        # Shuffle options if enabled
        if online_exam.shuffle_options:
            for q_data in questions_data:
                if q_data.get('question_type') == 'MCQ':
                    options = [
                        ('A', q_data.get('option_a')),
                        ('B', q_data.get('option_b')),
                        ('C', q_data.get('option_c')),
                        ('D', q_data.get('option_d'))
                    ]
                    random.shuffle(options)
                    for i, (label, text) in enumerate(options):
                        q_data[f'option_{chr(97 + i)}'] = text  # a, b, c, d
        
        return Response({
            'session': session_serializer.data,
            'questions': questions_data,
            'duration_minutes': online_exam.duration_minutes,
            'total_marks': online_exam.total_marks,
            'instructions': online_exam.instructions
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit an online exam.
        
        POST /api/exams/online-exams/{id}/submit/
        {
            "session_id": "uuid"
        }
        """
        online_exam = self.get_object()
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'session_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = OnlineExamSession.objects.get(
                pk=session_id,
                online_exam=online_exam,
                is_deleted=False
            )
        except OnlineExamSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already submitted
        if session.status in ['SUBMITTED', 'AUTO_SUBMITTED']:
            return Response(
                {'error': 'Exam already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Submit the exam
        session.submit()
        
        # Return result if show_results_immediately is enabled
        if online_exam.show_results_immediately:
            serializer = OnlineExamSessionSerializer(session)
            return Response(serializer.data)
        else:
            return Response({
                'message': 'Exam submitted successfully',
                'session_id': str(session.id)
            })
    
    @action(detail=True, methods=['get'])
    def result(self, request, pk=None):
        """
        Get exam result for a student.
        
        GET /api/exams/online-exams/{id}/result/
        """
        online_exam = self.get_object()
        user = request.user
        
        # Get student from user
        try:
            student = Student.objects.get(user=user, is_deleted=False)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get session
        try:
            session = OnlineExamSession.objects.get(
                online_exam=online_exam,
                student=student,
                is_deleted=False
            )
        except OnlineExamSession.DoesNotExist:
            return Response(
                {'error': 'No session found for this exam'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if results are available
        if session.status not in ['SUBMITTED', 'AUTO_SUBMITTED']:
            return Response(
                {'error': 'Exam not yet submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not online_exam.show_results_immediately and session.status == 'SUBMITTED':
            # Check if results have been published
            # For now, we'll allow viewing if submitted
            pass
        
        serializer = OnlineExamSessionSerializer(session)
        return Response(serializer.data)


class OnlineExamSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for OnlineExamSession management."""
    
    serializer_class = OnlineExamSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['online_exam', 'student', 'status']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    ordering_fields = ['started_at', 'submitted_at']
    ordering = ['-started_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return OnlineExamSession.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('online_exam', 'student').prefetch_related('answers')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OnlineExamSessionListSerializer
        return OnlineExamSessionSerializer
    
    @action(detail=True, methods=['post'])
    def save_answer(self, request, pk=None):
        """
        Save/update an answer for a question.
        
        POST /api/exams/sessions/{id}/save_answer/
        {
            "question_id": "uuid",
            "answer_text": "text answer",
            "selected_option": "A",
            "time_spent_seconds": 120,
            "is_marked_for_review": false
        }
        """
        session = self.get_object()
        
        # Check if session is still active
        if session.status in ['SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED']:
            return Response(
                {'error': 'Cannot save answer - exam is already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SubmitAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        question_id = serializer.validated_data['question_id']
        
        # Get or create answer
        try:
            question = QuestionBank.objects.get(pk=question_id, is_deleted=False)
        except QuestionBank.DoesNotExist:
            return Response(
                {'error': 'Question not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify question belongs to this exam
        if not session.online_exam.questions.filter(pk=question_id).exists():
            return Response(
                {'error': 'Question does not belong to this exam'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        answer, created = OnlineExamAnswer.objects.get_or_create(
            session=session,
            question=question,
            defaults={'tenant': get_current_tenant()}
        )
        
        # Update answer
        answer.answer_text = serializer.validated_data.get('answer_text', '')
        answer.selected_option = serializer.validated_data.get('selected_option', '')
        answer.time_spent_seconds = serializer.validated_data.get('time_spent_seconds', 0)
        answer.is_marked_for_review = serializer.validated_data.get('is_marked_for_review', False)
        answer.save()
        
        answer_serializer = OnlineExamAnswerSerializer(answer)
        return Response(answer_serializer.data)
    
    @action(detail=True, methods=['post'])
    def record_tab_switch(self, request, pk=None):
        """
        Record a tab switch violation.
        
        POST /api/exams/sessions/{id}/record_tab_switch/
        """
        session = self.get_object()
        
        if session.status in ['SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED']:
            return Response(
                {'error': 'Session already ended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.tab_switch_count += 1
        
        # Record violation
        violation = {
            'type': 'tab_switch',
            'timestamp': timezone.now().isoformat(),
            'count': session.tab_switch_count
        }
        session.proctoring_violations.append(violation)
        
        # Auto-submit if exceeded max tab switches
        if session.tab_switch_count >= session.online_exam.max_tab_switches:
            session.status = 'AUTO_SUBMITTED'
            session.submit()
            
            return Response({
                'message': 'Exam auto-submitted due to excessive tab switches',
                'tab_switch_count': session.tab_switch_count,
                'auto_submitted': True
            })
        
        session.save(update_fields=['tab_switch_count', 'proctoring_violations'])
        
        return Response({
            'tab_switch_count': session.tab_switch_count,
            'max_allowed': session.online_exam.max_tab_switches,
            'warning': f'Warning: {session.online_exam.max_tab_switches - session.tab_switch_count} tab switches remaining'
        })


class QuestionBankImportViewSet(viewsets.ViewSet):
    """ViewSet for importing questions from CSV/Excel."""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def import_questions(self, request):
        """
        Import questions from CSV file.
        
        POST /api/exams/questions/import/
        
        CSV Format:
        question_text,question_type,difficulty,marks,option_a,option_b,option_c,option_d,correct_answer,explanation
        """
        serializer = QuestionImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        subject_id = serializer.validated_data['subject_id']
        topic_id = serializer.validated_data.get('topic_id')
        default_difficulty = serializer.validated_data.get('difficulty')
        
        # Verify subject exists
        from tenants.models import Subject
        try:
            subject = Subject.objects.get(pk=subject_id, is_deleted=False)
        except Subject.DoesNotExist:
            return Response(
                {'error': 'Subject not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify topic if provided
        topic = None
        if topic_id:
            try:
                topic = Topic.objects.get(pk=topic_id, is_deleted=False)
            except Topic.DoesNotExist:
                return Response(
                    {'error': 'Topic not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Read CSV file
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            errors = []
            tenant = get_current_tenant()
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # Create question
                    question = QuestionBank.objects.create(
                        tenant=tenant,
                        question_text=row['question_text'],
                        question_type=row.get('question_type', 'MCQ'),
                        subject=subject,
                        topic=topic,
                        difficulty=row.get('difficulty', default_difficulty or 'MEDIUM'),
                        marks=row.get('marks', 1),
                        option_a=row.get('option_a', ''),
                        option_b=row.get('option_b', ''),
                        option_c=row.get('option_c', ''),
                        option_d=row.get('option_d', ''),
                        correct_answer=row.get('correct_answer', ''),
                        explanation=row.get('explanation', '')
                    )
                    created_count += 1
                except Exception as e:
                    errors.append({
                        'row': row_num,
                        'error': str(e)
                    })
            
            return Response({
                'message': f'Successfully imported {created_count} questions',
                'created_count': created_count,
                'errors': errors
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to parse CSV file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
