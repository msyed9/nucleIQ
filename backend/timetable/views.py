"""
Timetable Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import TimetableSlot, TimetableTemplate, TimetablePeriodConfig, SubjectSectionLoad
from .serializers import (
    TimetableSlotSerializer,
    TimetableSlotCreateSerializer,
    TimetableTemplateSerializer,
    TeacherScheduleSerializer,
    SectionScheduleSerializer,
    AvailabilityCheckSerializer,
    BulkSlotCreateSerializer,
    TimetablePeriodConfigSerializer,
    SubjectSectionLoadSerializer,
    SubjectSectionLoadCreateSerializer,
    BulkSubjectLoadCreateSerializer,
    TimetableGenerateSerializer,
    SlotSwapSerializer,
    CopyDaySerializer
)
from .validators import TimetableValidator
from .services import TimetableGeneratorService, TimetableSwapService, TimetableCopyService
from core.middleware import get_current_tenant
from core.permissions import IsTenantUser
from users.decorators import HasModulePermission as ModulePermission
from tenants.models import AcademicYear, Section


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
    permission_classes = [IsAuthenticated, IsTenantUser, ModulePermission]
    required_module = 'timetable_module'
    required_actions = {
        'list': 'read',
        'retrieve': 'read',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete',
        'check_availability': 'read',
        'teacher_schedule': 'read',
        'section_schedule': 'read',
        'bulk_create': 'create',
        'weekly_view': 'read'
    }
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
        queryset = TimetableSlot.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related(
            'academic_year',
            'section',
            'section__grade_level',
            'subject',
            'teacher'
        )
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        
        # Default to active academic year if not explicitly provided or bypassed with 'all'
        if not academic_year and academic_year != 'all':
            try:
                from tenants.models import AcademicYear
                active_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                if active_year:
                    academic_year = str(active_year.id)
            except Exception:
                pass
                
        if academic_year and academic_year != 'all':
            queryset = queryset.filter(academic_year_id=academic_year)
            
        return queryset
    
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
    permission_classes = [IsAuthenticated, IsTenantUser, ModulePermission]
    required_module = 'timetable_module'
    required_actions = {
        'list': 'read',
        'retrieve': 'read',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete'
    }
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
        queryset = TimetableTemplate.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('academic_year')
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        
        # Default to active academic year if not explicitly provided or bypassed with 'all'
        if not academic_year and academic_year != 'all':
            try:
                from tenants.models import AcademicYear
                active_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                if active_year:
                    academic_year = str(active_year.id)
            except Exception:
                pass
                
        if academic_year and academic_year != 'all':
            queryset = queryset.filter(academic_year_id=academic_year)
            
        return queryset


class TimetablePeriodConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing timetable period configurations.
    
    Allows tenants to configure their daily schedule structure
    including working days, period timings, and breaks.
    """
    
    serializer_class = TimetablePeriodConfigSerializer
    permission_classes = [IsAuthenticated, IsTenantUser, ModulePermission]
    required_module = 'timetable_module'
    required_actions = {
        'list': 'read',
        'retrieve': 'read',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete'
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['academic_year', 'is_active']
    search_fields = ['name']
    ordering = ['-is_active', '-created_at']
    
    def get_queryset(self):
        """Filter queryset by tenant."""
        tenant = get_current_tenant()
        queryset = TimetablePeriodConfig.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('academic_year')
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        
        # Default to active academic year if not explicitly provided or bypassed with 'all'
        if not academic_year and academic_year != 'all':
            try:
                from tenants.models import AcademicYear
                active_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                if active_year:
                    academic_year = str(active_year.id)
            except Exception:
                pass
                
        if academic_year and academic_year != 'all':
            queryset = queryset.filter(academic_year_id=academic_year)
            
        return queryset
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        tenant = get_current_tenant()
        serializer.save(tenant=tenant)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get the active period configuration for a given academic year.
        
        GET /api/timetable/configs/active/?academic_year=uuid
        """
        academic_year_id = request.query_params.get('academic_year')
        tenant = get_current_tenant()
        
        queryset = self.get_queryset().filter(is_active=True)
        
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        
        config = queryset.first()
        
        if not config:
            return Response(
                {'error': 'No active configuration found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(self.get_serializer(config).data)


class SubjectSectionLoadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subject-section loads.
    
    Subject loads define how many periods per week each subject
    needs for each section. This is used by the auto-generation algorithm.
    """
    
    serializer_class = SubjectSectionLoadSerializer
    permission_classes = [IsAuthenticated, IsTenantUser, ModulePermission]
    required_module = 'timetable_module'
    required_actions = {
        'list': 'read',
        'retrieve': 'read',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete',
        'bulk_create': 'create',
        'copy_from_section': 'create'
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'section', 'subject', 'is_active', 'requires_lab']
    search_fields = ['section__name', 'subject__name']
    ordering_fields = ['section__name', 'subject__name', 'periods_per_week', 'priority']
    ordering = ['section', 'priority', 'subject__name']
    
    def get_queryset(self):
        """Filter queryset by tenant."""
        tenant = get_current_tenant()
        queryset = SubjectSectionLoad.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('section', 'subject', 'preferred_teacher', 'academic_year')
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        
        # Default to active academic year if not explicitly provided or bypassed with 'all'
        if not academic_year and academic_year != 'all':
            try:
                from tenants.models import AcademicYear
                active_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                if active_year:
                    academic_year = str(active_year.id)
            except Exception:
                pass
                
        if academic_year and academic_year != 'all':
            queryset = queryset.filter(academic_year_id=academic_year)
            
        return queryset
    
    def get_serializer_class(self):
        """Use create serializer for create/update actions."""
        if self.action in ['create', 'update', 'partial_update', 'bulk_create']:
            return SubjectSectionLoadCreateSerializer
        return SubjectSectionLoadSerializer
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        tenant = get_current_tenant()
        serializer.save(tenant=tenant)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple subject loads at once.
        
        POST /api/timetable/loads/bulk_create/
        {
            "loads": [
                {
                    "academic_year": "uuid",
                    "section": "uuid",
                    "subject": "uuid",
                    "periods_per_week": 5
                },
                ...
            ]
        }
        """
        serializer = BulkSubjectLoadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        created = []
        errors = []
        
        for load_data in serializer.validated_data['loads']:
            try:
                load = SubjectSectionLoad.objects.create(
                    tenant=tenant,
                    **load_data
                )
                created.append(SubjectSectionLoadSerializer(load).data)
            except Exception as e:
                errors.append({
                    'data': str(load_data),
                    'error': str(e)
                })
        
        return Response({
            'created_count': len(created),
            'error_count': len(errors),
            'created': created,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def copy_from_section(self, request):
        """
        Copy subject loads from one section to another.
        
        POST /api/timetable/loads/copy_from_section/
        {
            "source_section_id": "uuid",
            "target_section_id": "uuid",
            "academic_year": "uuid"
        }
        """
        source_section_id = request.data.get('source_section_id')
        target_section_id = request.data.get('target_section_id')
        academic_year_id = request.data.get('academic_year')
        
        if not all([source_section_id, target_section_id, academic_year_id]):
            return Response(
                {'error': 'source_section_id, target_section_id, and academic_year are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = get_current_tenant()
        
        # Get source loads
        source_loads = SubjectSectionLoad.objects.filter(
            tenant=tenant,
            section_id=source_section_id,
            academic_year_id=academic_year_id,
            is_active=True,
            is_deleted=False
        )
        
        if not source_loads.exists():
            return Response(
                {'error': 'No loads found for source section'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        created = []
        skipped = []
        
        for source in source_loads:
            # Check if target already has this subject
            exists = SubjectSectionLoad.objects.filter(
                tenant=tenant,
                section_id=target_section_id,
                subject=source.subject,
                academic_year_id=academic_year_id,
                is_deleted=False
            ).exists()
            
            if exists:
                skipped.append(source.subject.name)
                continue
            
            new_load = SubjectSectionLoad.objects.create(
                tenant=tenant,
                academic_year_id=academic_year_id,
                section_id=target_section_id,
                subject=source.subject,
                periods_per_week=source.periods_per_week,
                preferred_teacher=source.preferred_teacher,
                room_preference=source.room_preference,
                max_periods_per_day=source.max_periods_per_day,
                requires_lab=source.requires_lab,
                priority=source.priority,
                is_active=True
            )
            created.append(SubjectSectionLoadSerializer(new_load).data)
        
        return Response({
            'copied_count': len(created),
            'skipped_count': len(skipped),
            'skipped_subjects': skipped,
            'created': created
        })


class TimetableGenerationViewSet(viewsets.ViewSet):
    """
    ViewSet for timetable generation operations.
    
    Provides endpoints for:
    - Generating timetables automatically
    - Previewing generation without saving
    - Checking generation readiness
    - Swapping slots
    - Copying day schedules
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser, ModulePermission]
    required_module = 'timetable_module'
    required_actions = {
        'generate': 'create',
        'preview': 'read',
        'status': 'read',
        'swap': 'update',
        'copy_day': 'create'
    }
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate timetable for sections.
        
        POST /api/timetable/generation/generate/
        {
            "section_ids": ["uuid1", "uuid2"],  // optional
            "clear_existing": false
        }
        """
        serializer = TimetableGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
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
        
        # Run generation
        generator = TimetableGeneratorService(tenant, academic_year)
        result = generator.generate(
            section_ids=[str(s) for s in data.get('section_ids', [])] if data.get('section_ids') else None,
            clear_existing=data.get('clear_existing', False),
            preview_only=False
        )
        
        return Response(
            result.to_dict(),
            status=status.HTTP_200_OK if result.success else status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Preview timetable generation without saving.
        
        POST /api/timetable/generation/preview/
        {
            "section_ids": ["uuid1", "uuid2"]  // optional
        }
        """
        serializer = TimetableGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
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
        
        # Run generation in preview mode
        generator = TimetableGeneratorService(tenant, academic_year)
        result = generator.generate(
            section_ids=[str(s) for s in data.get('section_ids', [])] if data.get('section_ids') else None,
            clear_existing=False,
            preview_only=True
        )
        
        return Response(result.to_dict())
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Check generation readiness.
        
        GET /api/timetable/generation/status/
        
        Returns:
        - has_config: Whether a period config exists
        - has_loads: Whether subject loads are defined
        - sections_with_loads: Number of sections with loads
        - total_loads: Total number of subject loads
        """
        tenant = get_current_tenant()
        
        # Get active academic year
        try:
            academic_year = AcademicYear.objects.get(
                tenant=tenant,
                is_active=True
            )
        except AcademicYear.DoesNotExist:
            return Response({
                'ready': False,
                'error': 'No active academic year',
                'has_config': False,
                'has_loads': False
            })
        
        # Check for config
        has_config = TimetablePeriodConfig.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            is_active=True,
            is_deleted=False
        ).exists()
        
        # Check for loads
        loads = SubjectSectionLoad.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            is_active=True,
            is_deleted=False
        )
        
        total_loads = loads.count()
        sections_with_loads = loads.values('section').distinct().count()
        
        return Response({
            'ready': has_config and total_loads > 0,
            'academic_year': str(academic_year.id),
            'academic_year_name': academic_year.name,
            'has_config': has_config,
            'has_loads': total_loads > 0,
            'sections_with_loads': sections_with_loads,
            'total_loads': total_loads
        })
    
    @action(detail=False, methods=['post'])
    def swap(self, request):
        """
        Swap two timetable slots.
        
        POST /api/timetable/generation/swap/
        {
            "slot1_id": "uuid",
            "slot2_id": "uuid"
        }
        """
        serializer = SlotSwapSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
        result = TimetableSwapService.swap_slots(
            slot1_id=str(data['slot1_id']),
            slot2_id=str(data['slot2_id']),
            tenant=tenant
        )
        
        return Response(
            result,
            status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['post'])
    def copy_day(self, request):
        """
        Copy a day's timetable from one section/day to another.
        
        POST /api/timetable/generation/copy_day/
        {
            "source_section_id": "uuid",
            "source_day": "MONDAY",
            "target_section_id": "uuid",
            "target_day": "TUESDAY",
            "overwrite": false
        }
        """
        serializer = CopyDaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
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
        
        result = TimetableCopyService.copy_day(
            source_section_id=str(data['source_section_id']),
            source_day=data['source_day'],
            target_section_id=str(data['target_section_id']),
            target_day=data['target_day'],
            academic_year=academic_year,
            tenant=tenant,
            overwrite=data.get('overwrite', False)
        )
        
        return Response(
            result,
            status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def validate(self, request):
        """
        Validate a section's timetable and return issues.
        
        GET /api/timetable/generation/validate/?section_id=uuid
        
        Returns:
            {
                "errors": [...],
                "warnings": [...],
                "info": [...],
                "summary": {...}
            }
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
        
        # Get section info
        try:
            section = Section.objects.get(id=section_id, tenant=tenant)
        except Section.DoesNotExist:
            return Response(
                {'error': 'Section not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all slots for the section
        slots = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            section_id=section_id,
            is_active=True,
            is_deleted=False
        ).select_related('subject', 'teacher')
        
        # Get subject loads for comparison
        subject_loads = SubjectSectionLoad.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            section_id=section_id,
            is_active=True,
            is_deleted=False
        ).select_related('subject')
        
        # Get period config
        period_config = TimetablePeriodConfig.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            is_active=True
        ).first()
        
        working_days = period_config.working_days if period_config else [
            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
        ]
        
        errors = []
        warnings = []
        info = []
        
        # 1. Check for missing teacher assignments
        slots_without_teacher = slots.filter(teacher__isnull=True)
        if slots_without_teacher.exists():
            errors.append({
                'category': 'Teacher Assignments',
                'message': f'{slots_without_teacher.count()} slots have no teacher assigned',
                'affected_items': [
                    f'{s.subject.name} on {s.day_of_week} P{s.period_number}'
                    for s in slots_without_teacher
                ]
            })
        
        # 2. Check for missing room assignments
        slots_without_room = slots.filter(room='') | slots.filter(room__isnull=True)
        if slots_without_room.exists():
            warnings.append({
                'category': 'Room Assignments',
                'message': f'{slots_without_room.count()} slots have no room assigned',
                'affected_items': [
                    f'{s.subject.name} on {s.day_of_week} P{s.period_number}'
                    for s in slots_without_room
                ]
            })
        
        # 3. Check teacher daily overload (> 6 periods/day)
        from collections import defaultdict
        teacher_daily_load = defaultdict(lambda: defaultdict(int))
        for slot in slots:
            if slot.teacher_id:
                teacher_daily_load[slot.teacher_id][slot.day_of_week] += 1
        
        overloaded_teachers = []
        for teacher_id, days in teacher_daily_load.items():
            for day, count in days.items():
                if count > 6:
                    teacher = slots.filter(teacher_id=teacher_id).first().teacher
                    overloaded_teachers.append(
                        f'{teacher.get_full_name() if teacher else "Unknown"}: {count} periods on {day}'
                    )
        
        if overloaded_teachers:
            warnings.append({
                'category': 'Teacher Workload',
                'message': 'Some teachers have more than 6 periods in a day',
                'affected_items': overloaded_teachers
            })
        
        # 4. Check subject load fulfillment
        actual_counts = defaultdict(int)
        for slot in slots:
            actual_counts[slot.subject_id] += 1
        
        missing_periods = []
        extra_periods = []
        
        for load in subject_loads:
            actual = actual_counts.get(load.subject_id, 0)
            expected = load.periods_per_week
            
            if actual < expected:
                missing_periods.append(
                    f'{load.subject.name}: {actual}/{expected} periods (missing {expected - actual})'
                )
            elif actual > expected:
                extra_periods.append(
                    f'{load.subject.name}: {actual}/{expected} periods (extra {actual - expected})'
                )
        
        if missing_periods:
            errors.append({
                'category': 'Subject Load',
                'message': 'Some subjects are under-scheduled',
                'affected_items': missing_periods
            })
        
        if extra_periods:
            warnings.append({
                'category': 'Subject Load',
                'message': 'Some subjects are over-scheduled',
                'affected_items': extra_periods
            })
        
        # 5. Check for empty working days
        days_with_slots = set(slot.day_of_week for slot in slots)
        empty_days = [day for day in working_days if day not in days_with_slots]
        
        if empty_days:
            warnings.append({
                'category': 'Schedule Gaps',
                'message': f'{len(empty_days)} working days have no classes scheduled',
                'affected_items': empty_days
            })
        
        # 6. Summary info
        info.append({
            'category': 'Summary',
            'message': f'Total scheduled: {slots.count()} periods across {len(days_with_slots)} days',
            'details': f'{len(set(s.subject_id for s in slots))} subjects, {len(set(s.teacher_id for s in slots if s.teacher_id))} teachers'
        })
        
        # Determine overall status
        if errors:
            status_text = 'issues_found'
        elif warnings:
            status_text = 'warnings'
        else:
            status_text = 'ok'
        
        return Response({
            'section_id': section_id,
            'section_name': str(section),
            'status': status_text,
            'errors': errors,
            'warnings': warnings,
            'info': info,
            'summary': {
                'total_slots': slots.count(),
                'total_errors': len(errors),
                'total_warnings': len(warnings),
                'total_info': len(info)
            }
        })
