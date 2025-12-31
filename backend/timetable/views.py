"""
Timetable Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import TimetableSlot, TimetableTemplate
from .serializers import (
    TimetableSlotSerializer,
    TimetableSlotCreateSerializer,
    TimetableTemplateSerializer,
    TeacherScheduleSerializer,
    SectionScheduleSerializer,
    AvailabilityCheckSerializer,
    BulkSlotCreateSerializer
)
from .validators import TimetableValidator
from core.middleware import get_current_tenant
from tenants.models import AcademicYear


class TimetableSlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing timetable slots.
    
    Provides CRUD operations and additional actions for:
    - Checking availability
    - Getting teacher schedules
    - Getting section schedules
    - Bulk creation
    """
    
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'section', 'subject', 'teacher', 'day_of_week', 'is_active']
    search_fields = ['subject__name', 'teacher__first_name', 'teacher__last_name', 'room']
    ordering_fields = ['day_of_week', 'start_time', 'period_number']
    ordering = ['day_of_week', 'start_time']
    
    def get_queryset(self):
        """
        Filter queryset by tenant and include related objects.
        """
        tenant = get_current_tenant()
        return TimetableSlot.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related(
            'academic_year',
            'section',
            'section__grade_level',
            'subject',
            'teacher'
        )
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action == 'create':
            return TimetableSlotCreateSerializer
        return TimetableSlotSerializer
    
    @action(detail=False, methods=['post'])
    def check_availability(self, request):
        """
        Check availability for a time slot.
        
        POST /api/timetable/slots/check_availability/
        {
            "academic_year": "uuid",
            "day_of_week": "MONDAY",
            "start_time": "09:00",
            "end_time": "10:00",
            "teacher_id": "uuid",  // optional
            "room": "101",  // optional
            "section_id": "uuid",  // optional
            "exclude_slot_id": "uuid"  // optional, for updates
        }
        """
        serializer = AvailabilityCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
        # Get academic year
        try:
            academic_year = AcademicYear.objects.get(
                id=data['academic_year'],
                tenant=tenant
            )
        except AcademicYear.DoesNotExist:
            return Response(
                {'error': 'Academic year not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        conflicts = TimetableValidator.check_availability(
            tenant=tenant,
            academic_year=academic_year,
            day_of_week=data['day_of_week'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            teacher_id=data.get('teacher_id'),
            room=data.get('room'),
            section_id=data.get('section_id'),
            exclude_slot_id=data.get('exclude_slot_id')
        )
        
        return Response(conflicts)
    
    @action(detail=False, methods=['get'])
    def teacher_schedule(self, request):
        """
        Get schedule for a specific teacher.
        
        GET /api/timetable/slots/teacher_schedule/?teacher_id=uuid&day_of_week=MONDAY
        """
        teacher_id = request.query_params.get('teacher_id')
        day_of_week = request.query_params.get('day_of_week')
        
        if not teacher_id:
            return Response(
                {'error': 'teacher_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = get_current_tenant()
        
        # Get active academic year
        try:
            academic_year = AcademicYear.objects.get(
                tenant=tenant,
                is_active=True
            )
        except AcademicYear.DoesNotExist:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        schedule = TimetableValidator.get_teacher_schedule(
            tenant=tenant,
            academic_year=academic_year,
            teacher_id=teacher_id,
            day_of_week=day_of_week
        )
        
        return Response({
            'teacher_id': teacher_id,
            'academic_year': str(academic_year.id),
            'academic_year_name': academic_year.name,
            'day_of_week': day_of_week,
            'schedule': schedule
        })
    
    @action(detail=False, methods=['get'])
    def section_schedule(self, request):
        """
        Get schedule for a specific section.
        
        GET /api/timetable/slots/section_schedule/?section_id=uuid&day_of_week=MONDAY
        """
        section_id = request.query_params.get('section_id')
        day_of_week = request.query_params.get('day_of_week')
        
        if not section_id:
            return Response(
                {'error': 'section_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = get_current_tenant()
        
        # Get active academic year
        try:
            academic_year = AcademicYear.objects.get(
                tenant=tenant,
                is_active=True
            )
        except AcademicYear.DoesNotExist:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        schedule = TimetableValidator.get_section_schedule(
            tenant=tenant,
            academic_year=academic_year,
            section_id=section_id,
            day_of_week=day_of_week
        )
        
        return Response({
            'section_id': section_id,
            'academic_year': str(academic_year.id),
            'academic_year_name': academic_year.name,
            'day_of_week': day_of_week,
            'schedule': schedule
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple timetable slots at once.
        
        POST /api/timetable/slots/bulk_create/
        {
            "slots": [
                {
                    "academic_year": "uuid",
                    "section": "uuid",
                    "subject": "uuid",
                    "teacher": "uuid",
                    "day_of_week": "MONDAY",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "room": "101",
                    "period_number": 1
                },
                ...
            ]
        }
        """
        serializer = BulkSlotCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        slots_data = serializer.validated_data['slots']
        
        created_slots = []
        errors = []
        
        for idx, slot_data in enumerate(slots_data):
            try:
                # Create the slot
                slot_serializer = TimetableSlotCreateSerializer(data=slot_data)
                if slot_serializer.is_valid():
                    slot = slot_serializer.save()
                    created_slots.append(TimetableSlotSerializer(slot).data)
                else:
                    errors.append({
                        'index': idx,
                        'data': slot_data,
                        'errors': slot_serializer.errors
                    })
            except Exception as e:
                errors.append({
                    'index': idx,
                    'data': slot_data,
                    'error': str(e)
                })
        
        return Response({
            'created': len(created_slots),
            'failed': len(errors),
            'created_slots': created_slots,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_slots else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def weekly_view(self, request):
        """
        Get weekly timetable view for a section.
        
        GET /api/timetable/slots/weekly_view/?section_id=uuid
        """
        section_id = request.query_params.get('section_id')
        
        if not section_id:
            return Response(
                {'error': 'section_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = get_current_tenant()
        
        # Get active academic year
        try:
            academic_year = AcademicYear.objects.get(
                tenant=tenant,
                is_active=True
            )
        except AcademicYear.DoesNotExist:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all slots for the section
        slots = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            section_id=section_id,
            is_active=True,
            is_deleted=False
        ).select_related('subject', 'teacher').order_by('day_of_week', 'start_time')
        
        # Organize by day
        weekly_schedule = {
            'MONDAY': [],
            'TUESDAY': [],
            'WEDNESDAY': [],
            'THURSDAY': [],
            'FRIDAY': [],
            'SATURDAY': [],
            'SUNDAY': []
        }
        
        for slot in slots:
            weekly_schedule[slot.day_of_week].append(
                TimetableSlotSerializer(slot).data
            )
        
        return Response({
            'section_id': section_id,
            'academic_year': str(academic_year.id),
            'academic_year_name': academic_year.name,
            'schedule': weekly_schedule
        })


class TimetableTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing timetable templates.
    """
    
    serializer_class = TimetableTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'is_default']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filter queryset by tenant.
        """
        tenant = get_current_tenant()
        return TimetableTemplate.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('academic_year')
