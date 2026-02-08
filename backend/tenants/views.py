from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.permissions import IsTenantUser, IsTenantAdmin
from .models import AcademicYear, GradeLevel, Section, Department, Holiday, TenantSettings, TenantBranding, Subject, ClassSubject
from .serializers import (
    AcademicYearSerializer, 
    GradeLevelSerializer, 
    SectionSerializer, 
    DepartmentSerializer,
    HolidaySerializer,
    TenantSettingsSerializer,
    TenantBrandingSerializer,
    SubjectSerializer,
    ClassSubjectSerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta

class AcademicYearViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AcademicYearSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        return AcademicYear.objects.filter(tenant=self.request.user.tenant)

class DepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        return Department.objects.filter(tenant=self.request.user.tenant)

class GradeLevelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = GradeLevelSerializer
    filter_backends = [DjangoFilterBackend]
    
    def get_queryset(self):
        return GradeLevel.objects.filter(tenant=self.request.user.tenant)

class SectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = SectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grade_level']
    
    def get_queryset(self):
        return Section.objects.filter(tenant=self.request.user.tenant)

class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = SubjectSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'display_order', 'created_at']
    ordering = ['display_order', 'name']

    def get_queryset(self):
        return Subject.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ClassSubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = ClassSubjectSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'grade_level', 'subject', 'is_mandatory', 'is_elective', 'teacher']
    search_fields = ['subject__name', 'subject__code', 'grade_level__name', 'teacher__first_name', 'teacher__last_name']
    ordering_fields = ['grade_level', 'subject', 'display_order', 'weekly_periods']
    ordering = ['grade_level', 'display_order']

    def get_queryset(self):
        queryset = ClassSubject.objects.filter(tenant=self.request.user.tenant)
        subject_in = self.request.query_params.get('subject__in')
        if subject_in:
            subject_ids = [item.strip() for item in subject_in.split(',') if item.strip()]
            if subject_ids:
                queryset = queryset.filter(subject_id__in=subject_ids)
        return queryset

    def perform_create(self, serializer):
        academic_year = serializer.validated_data.get('academic_year')
        if not academic_year:
            academic_year = AcademicYear.objects.filter(tenant=self.request.user.tenant, is_active=True).first()
        serializer.save(tenant=self.request.user.tenant, academic_year=academic_year or serializer.validated_data.get('academic_year'))

class HolidayViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = HolidaySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['holiday_type', 'academic_year']
    
    def get_queryset(self):
        return Holiday.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def calendar_view(self, request):
        """Get holidays for calendar view with date range filtering."""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.get_queryset()
        
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                
                # Get holidays that overlap with the date range
                queryset = queryset.filter(
                    start_date__lte=end,
                    end_date__gte=start
                )
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming holidays."""
        from django.utils import timezone
        today = timezone.now().date()
        
        queryset = self.get_queryset().filter(
            start_date__gte=today
        ).order_by('start_date')[:10]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TenantSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TenantSettings.
    Automatically creates settings if they don't exist for the tenant.
    """
    permission_classes = [IsAuthenticated, IsTenantUser, IsTenantAdmin]
    serializer_class = TenantSettingsSerializer
    http_method_names = ['get', 'put', 'patch']  # Only allow read and update, not create/delete
    
    def get_queryset(self):
        return TenantSettings.objects.filter(tenant=self.request.user.tenant)
    
    def get_object(self):
        """
        Get or create tenant settings for the current tenant.
        """
        settings, created = TenantSettings.objects.get_or_create(
            tenant=self.request.user.tenant
        )
        return settings
    
    def list(self, request, *args, **kwargs):
        """
        Override list to return single settings object instead of array.
        """
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """
        Update tenant settings.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update tenant settings.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=False, methods=['patch'], url_path='update')
    def update_settings(self, request):
        """
        Custom action to update settings via /api/tenants/settings/update/
        This allows updating without needing to know the settings ID.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        """
        Get current tenant settings combined with branding data.
        This endpoint provides all tenant configuration including receipt settings.
        """
        settings = self.get_object()
        settings_data = self.get_serializer(settings).data
        
        # Get branding data
        try:
            branding, _ = TenantBranding.objects.get_or_create(
                tenant=request.user.tenant
            )
            branding_serializer = TenantBrandingSerializer(branding)
            branding_data = branding_serializer.data
            
            # Merge branding data into settings
            settings_data.update({
                'school_name': branding_data.get('school_name') or settings_data.get('school_name', ''),
                'school_address': branding_data.get('school_address', ''),
                'school_phone': branding_data.get('school_phone', ''),
                'school_email': branding_data.get('school_email', ''),
                'logo_url': branding_data.get('logo_url', ''),
                'icon_theme': branding_data.get('icon_theme', 'modern_gradient'),
                'icon_set': branding_data.get('icon_set', 'lucide'),
                'receipt_copies': branding_data.get('receipt_copies', 3),
                'receipt_footer_text': branding_data.get('receipt_footer_text', 'This is a computer generated receipt.'),
            })
        except Exception as e:
            # If branding fetch fails, continue with settings only
            pass
        
        return Response(settings_data)
    
    @action(detail=False, methods=['get'], url_path='next_admission_number')
    def next_admission_number(self, request):
        """
        Get the next admission number preview.
        This reads directly from settings to give accurate preview.
        """
        from students.utils import get_next_admission_number_preview
        
        settings = self.get_object()
        
        if not settings.auto_generate_admission_number:
            return Response({
                'auto_generate': False,
                'admission_number': None,
                'message': 'Auto-generation is disabled. Please enter admission number manually.'
            })
        
        preview = get_next_admission_number_preview(request.user.tenant)
        
        return Response({
            'auto_generate': True,
            'admission_number': preview,
            'format': settings.admission_number_format,
            'prefix': settings.admission_number_prefix,
            'current_sequence': settings.admission_number_sequence
        })


class TenantBrandingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TenantBranding.
    Allows tenant admins to customize their branding.
    Supports multipart/form-data for file uploads.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TenantBrandingSerializer
    # Enable multipart form data parsing for file uploads
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['get', 'put', 'patch', 'delete']  # Allow read, update, and delete-image
    
    def get_queryset(self):
        # Platform admins don't have a tenant
        if not self.request.user.tenant:
            return TenantBranding.objects.none()
        return TenantBranding.objects.filter(tenant=self.request.user.tenant)
    
    def get_object(self):
        """
        Get or create tenant branding for the current tenant.
        """
        # Platform admins don't have a tenant
        if not self.request.user.tenant:
            return None
        branding, created = TenantBranding.objects.get_or_create(
            tenant=self.request.user.tenant
        )
        return branding
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """
        Override list to return single branding object instead of array.
        """
        # Platform admins get empty branding
        if not request.user.tenant:
            return Response({
                'primary_color': '#1976d2',
                'secondary_color': '#dc004e',
                'sidebar_color': '#1e1e2d',
                'font_family': 'Inter',
                'icon_theme': 'modern_gradient',
                'icon_set': 'lucide',
            })
        branding = self.get_object()
        serializer = self.get_serializer(branding)
        return Response(serializer.data)

    
    def update(self, request, *args, **kwargs):
        """
        Update tenant branding.
        Supports both JSON and multipart/form-data for file uploads.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update tenant branding.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=False, methods=['patch'], url_path='update')
    def update_branding(self, request):
        """
        Custom action to update branding via /api/tenants/branding/update/
        This allows updating without needing to know the branding ID.
        Supports both JSON and multipart/form-data for file uploads.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'], url_path='delete-image/(?P<field_name>[a-z_]+)')
    def delete_image(self, request, field_name=None):
        """
        Delete a specific image field.
        Allowed field names: small_logo, large_logo, square_logo, 
                            login_banner, dashboard_banner, report_header
        """
        allowed_fields = ['small_logo', 'large_logo', 'square_logo', 
                         'login_banner', 'dashboard_banner', 'report_header']
        
        if field_name not in allowed_fields:
            return Response(
                {'error': f'Invalid field name. Allowed: {", ".join(allowed_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance = self.get_object()
        image_field = getattr(instance, field_name, None)
        
        if image_field:
            # Delete the file from storage
            image_field.delete(save=False)
            # Set field to null
            setattr(instance, field_name, None)
            instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


