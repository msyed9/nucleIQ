from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser
from .models import AcademicYear, GradeLevel, Section, Department, Holiday, TenantSettings
from .serializers import (
    AcademicYearSerializer, 
    GradeLevelSerializer, 
    SectionSerializer, 
    DepartmentSerializer,
    HolidaySerializer,
    TenantSettingsSerializer
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
    permission_classes = [IsAuthenticated, IsTenantUser]
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

