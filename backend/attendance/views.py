"""
Attendance API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import date
import uuid

from core.permissions import IsTenantUser
from .models import AttendanceRecord, AttendanceConfiguration, AttendanceMonthlyAggregate, QRCodeToken
from .serializers import (
    AttendanceRecordSerializer,
    AttendanceConfigurationSerializer,
    AttendanceMonthlyAggregateSerializer,
    QRCodeTokenSerializer
)
from .services import AttendanceCalculationService


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance Records."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AttendanceRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['record_type', 'student', 'staff', 'date', 'status', 'method']
    
    def get_queryset(self):
        return AttendanceRecord.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'staff', 'academic_year')
    
    def perform_create(self, serializer):
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=self.request.user.tenant,
            is_active=True
        ).first()
        
        serializer.save(
            tenant=self.request.user.tenant,
            marked_by=self.request.user,
            academic_year=academic_year
        )
    
    @action(detail=False, methods=['post'])
    def mark_bulk(self, request):
        """Mark attendance for multiple students/staff."""
        date_val = request.data.get('date')
        attendance_data = request.data.get('attendance', [])
        
        if not date_val or not attendance_data:
            return Response(
                {'error': 'Date and attendance data required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).first()
        
        if not academic_year:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        for item in attendance_data:
            record_type = item.get('record_type')
            entity_id = item.get('entity_id')
            attendance_status = item.get('status')
            
            if record_type and entity_id and attendance_status:
                if record_type == 'STUDENT':
                    AttendanceRecord.objects.update_or_create(
                        tenant=request.user.tenant,
                        student_id=entity_id,
                        date=date_val,
                        defaults={
                            'status': attendance_status,
                            'method': 'MANUAL',
                            'record_type': 'STUDENT',
                            'academic_year': academic_year,
                            'marked_by': request.user
                        }
                    )
                else:
                    AttendanceRecord.objects.update_or_create(
                        tenant=request.user.tenant,
                        staff_id=entity_id,
                        date=date_val,
                        defaults={
                            'status': attendance_status,
                            'method': 'MANUAL',
                            'record_type': 'STAFF',
                            'academic_year': academic_year,
                            'marked_by': request.user
                        }
                    )
                created_count += 1
        
        return Response({
            'message': f'Marked attendance for {created_count} records',
            'count': created_count
        })
    
    @action(detail=False, methods=['post'])
    def qr_scan(self, request):
        """Mark attendance via QR code scan."""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate token
        qr_token = QRCodeToken.objects.filter(
            token=token,
            is_active=True,
            valid_date=date.today()
        ).first()
        
        if not qr_token:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark attendance
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=qr_token.tenant,
            is_active=True
        ).first()
        
        if qr_token.student:
            record, created = AttendanceRecord.objects.get_or_create(
                tenant=qr_token.tenant,
                student=qr_token.student,
                date=date.today(),
                defaults={
                    'status': 'PRESENT',
                    'method': 'QR_CODE',
                    'record_type': 'STUDENT',
                    'academic_year': academic_year,
                    'check_in_time': timezone.now().time()
                }
            )
        elif qr_token.teacher:
            record, created = AttendanceRecord.objects.get_or_create(
                tenant=qr_token.tenant,
                staff=qr_token.teacher,
                date=date.today(),
                defaults={
                    'status': 'PRESENT',
                    'method': 'QR_CODE',
                    'record_type': 'STAFF',
                    'academic_year': academic_year,
                    'check_in_time': timezone.now().time()
                }
            )
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)


class AttendanceConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance Configuration."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AttendanceConfigurationSerializer
    
    def get_queryset(self):
        return AttendanceConfiguration.objects.filter(tenant=self.request.user.tenant)


class AttendanceMonthlyAggregateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Monthly Aggregates."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AttendanceMonthlyAggregateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['record_type', 'student', 'staff', 'month']
    
    def get_queryset(self):
        return AttendanceMonthlyAggregate.objects.filter(tenant=self.request.user.tenant)
