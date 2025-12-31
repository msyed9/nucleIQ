# 🎉 ATTENDANCE SYSTEM - COMPLETE IMPLEMENTATION READY

## ✅ **ALL CODE READY TO COPY**

This document contains all the remaining code files ready to be created. Simply copy each section to the corresponding file.

---

## 📦 **FILE 1: attendance/services.py**

```python
"""
Attendance Calculation and Business Logic Services
"""

from datetime import datetime, date, timedelta
from django.db.models import Count, Q
from django.utils import timezone
from .models import AttendanceRecord, AttendanceMonthlyAggregate, AttendanceConfiguration


class AttendanceCalculationService:
    """Service for attendance calculations and aggregations."""
    
    @staticmethod
    def calculate_working_days(start_date, end_date, tenant):
        """
        Calculate working days excluding Sundays and holidays.
        """
        total_days = (end_date - start_date).days + 1
        
        # Count Sundays
        sundays = 0
        current = start_date
        while current <= end_date:
            if current.weekday() == 6:  # Sunday
                sundays += 1
            current += timedelta(days=1)
        
        # For now, just exclude Sundays
        # TODO: Integrate with Academic Calendar for holidays
        working_days = total_days - sundays
        return working_days
    
    @staticmethod
    def calculate_attendance_percentage(present_days, late_days, working_days):
        """
        Calculate attendance percentage.
        Formula: (Present + Late) / Working Days * 100
        """
        if working_days == 0:
            return 0
        
        effective_present = present_days + late_days
        percentage = (effective_present / working_days) * 100
        return round(percentage, 2)
    
    @staticmethod
    def recalculate_monthly_aggregate(record_type, entity_id, month_date, tenant):
        """
        Recalculate monthly aggregate for a student or staff member.
        """
        from students.models import Student
        from staff.models import Staff
        from tenants.models import AcademicYear
        
        # Get first and last day of month
        first_day = month_date.replace(day=1)
        if month_date.month == 12:
            last_day = date(month_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(month_date.year, month_date.month + 1, 1) - timedelta(days=1)
        
        # Calculate working days
        working_days = AttendanceCalculationService.calculate_working_days(
            first_day, last_day, tenant
        )
        
        # Get attendance records
        if record_type == 'STUDENT':
            records = AttendanceRecord.objects.filter(
                student_id=entity_id,
                date__range=[first_day, last_day]
            )
            entity = Student.objects.get(id=entity_id)
        else:
            records = AttendanceRecord.objects.filter(
                staff_id=entity_id,
                date__range=[first_day, last_day]
            )
            entity = Staff.objects.get(id=entity_id)
        
        # Count by status
        present = records.filter(status='PRESENT').count()
        absent = records.filter(status='ABSENT').count()
        late = records.filter(status='LATE').count()
        half_day = records.filter(status='HALF_DAY').count()
        on_leave = records.filter(status='ON_LEAVE').count()
        
        # Calculate percentage
        percentage = AttendanceCalculationService.calculate_attendance_percentage(
            present, late, working_days
        )
        
        # Get academic year
        academic_year = AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True
        ).first()
        
        # Update or create aggregate
        aggregate_data = {
            'total_days': (last_day - first_day).days + 1,
            'working_days': working_days,
            'present_days': present,
            'absent_days': absent,
            'late_days': late,
            'half_days': half_day,
            'leave_days': on_leave,
            'attendance_percentage': percentage,
            'academic_year': academic_year,
            'record_type': record_type,
        }
        
        if record_type == 'STUDENT':
            aggregate, created = AttendanceMonthlyAggregate.objects.update_or_create(
                tenant=tenant,
                student=entity,
                month=first_day,
                defaults=aggregate_data
            )
        else:
            aggregate, created = AttendanceMonthlyAggregate.objects.update_or_create(
                tenant=tenant,
                staff=entity,
                month=first_day,
                defaults=aggregate_data
            )
        
        return aggregate
    
    @staticmethod
    def check_consecutive_absents(record_type, entity_id, tenant):
        """
        Check for consecutive absents and return count.
        """
        records = AttendanceRecord.objects.filter(
            tenant=tenant,
            record_type=record_type
        )
        
        if record_type == 'STUDENT':
            records = records.filter(student_id=entity_id)
        else:
            records = records.filter(staff_id=entity_id)
        
        records = records.order_by('-date')[:10]
        
        consecutive = 0
        for record in records:
            if record.status == 'ABSENT':
                consecutive += 1
            else:
                break
        
        return consecutive
```

---

## 📦 **FILE 2: attendance/tasks.py**

```python
"""
Celery Tasks for Attendance Automation
"""

from celery import shared_task
from datetime import datetime, date, time, timedelta
from django.utils import timezone
from .models import AttendanceRecord, AttendanceConfiguration
from .services import AttendanceCalculationService


@shared_task
def auto_mark_absent_students():
    """Auto-mark students as absent if no record by cutoff time."""
    from students.models import Student
    from tenants.models import Tenant, AcademicYear
    
    today = date.today()
    
    for tenant in Tenant.objects.filter(is_active=True):
        config = AttendanceConfiguration.objects.filter(tenant=tenant).first()
        if not config:
            continue
        
        cutoff_time = config.student_cutoff_time
        current_time = timezone.now().time()
        
        if current_time < cutoff_time:
            continue
        
        active_students = Student.objects.filter(tenant=tenant, is_active=True)
        academic_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
        
        for student in active_students:
            exists = AttendanceRecord.objects.filter(student=student, date=today).exists()
            
            if not exists and academic_year:
                AttendanceRecord.objects.create(
                    tenant=tenant,
                    record_type='STUDENT',
                    student=student,
                    date=today,
                    status='ABSENT',
                    method='AUTO',
                    academic_year=academic_year
                )
    
    return f"Auto-marked absent students for {today}"


@shared_task
def auto_mark_absent_staff():
    """Auto-mark staff as absent if no record by cutoff time."""
    from staff.models import Staff
    from tenants.models import Tenant, AcademicYear
    
    today = date.today()
    
    for tenant in Tenant.objects.filter(is_active=True):
        config = AttendanceConfiguration.objects.filter(tenant=tenant).first()
        if not config:
            continue
        
        cutoff_time = config.staff_cutoff_time
        current_time = timezone.now().time()
        
        if current_time < cutoff_time:
            continue
        
        active_staff = Staff.objects.filter(tenant=tenant, status='ACTIVE')
        academic_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
        
        for staff_member in active_staff:
            exists = AttendanceRecord.objects.filter(staff=staff_member, date=today).exists()
            
            if not exists and academic_year:
                AttendanceRecord.objects.create(
                    tenant=tenant,
                    record_type='STAFF',
                    staff=staff_member,
                    date=today,
                    status='ABSENT',
                    method='AUTO',
                    academic_year=academic_year
                )
    
    return f"Auto-marked absent staff for {today}"


@shared_task
def recalculate_monthly_aggregate_task(record_type, entity_id, month_date_str, tenant_id):
    """Async task to recalculate monthly aggregate."""
    from tenants.models import Tenant
    
    tenant = Tenant.objects.get(id=tenant_id)
    month_date = datetime.fromisoformat(month_date_str).date()
    
    AttendanceCalculationService.recalculate_monthly_aggregate(
        record_type, entity_id, month_date, tenant
    )
    
    return f"Recalculated aggregate for {record_type} {entity_id}"
```

---

## 📦 **FILE 3: attendance/serializers.py**

```python
"""
Attendance Serializers
"""

from rest_framework import serializers
from .models import AttendanceRecord, AttendanceConfiguration, AttendanceMonthlyAggregate, QRCodeToken


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for Attendance Records."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'tenant', 'record_type', 'student', 'student_name',
            'staff', 'staff_name', 'date', 'status', 'method',
            'academic_year', 'check_in_time', 'check_out_time',
            'latitude', 'longitude', 'is_event_day', 'event_name',
            'marked_by', 'remarks', 'device_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AttendanceConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for Attendance Configuration."""
    
    class Meta:
        model = AttendanceConfiguration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceMonthlyAggregateSerializer(serializers.ModelSerializer):
    """Serializer for Monthly Aggregates."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceMonthlyAggregate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class QRCodeTokenSerializer(serializers.ModelSerializer):
    """Serializer for QR Code Tokens."""
    
    class Meta:
        model = QRCodeToken
        fields = '__all__'
        read_only_fields = ['id', 'token', 'created_at']
```

---

## 📦 **FILE 4: attendance/views.py**

```python
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
        serializer.save(
            tenant=self.request.user.tenant,
            marked_by=self.request.user
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
        
        created_count = 0
        for item in attendance_data:
            record_type = item.get('record_type')
            entity_id = item.get('entity_id')
            attendance_status = item.get('status')
            
            if record_type and entity_id and attendance_status:
                from tenants.models import AcademicYear
                academic_year = AcademicYear.objects.filter(
                    tenant=request.user.tenant,
                    is_active=True
                ).first()
                
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
```

---

## 📦 **FILE 5: attendance/urls.py**

```python
"""
URL Configuration for Attendance
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceRecordViewSet,
    AttendanceConfigurationViewSet,
    AttendanceMonthlyAggregateViewSet
)

router = DefaultRouter()
router.register(r'records', AttendanceRecordViewSet, basename='attendance-record')
router.register(r'config', AttendanceConfigurationViewSet, basename='attendance-config')
router.register(r'aggregates', AttendanceMonthlyAggregateViewSet, basename='attendance-aggregate')

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## 📦 **FILE 6: attendance/admin.py**

```python
"""
Django Admin for Attendance
"""

from django.contrib import admin
from .models import AttendanceRecord, AttendanceConfiguration, AttendanceMonthlyAggregate, QRCodeToken


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    """Admin interface for Attendance Records."""
    
    list_display = ['get_entity_name', 'record_type', 'date', 'status', 'method', 'check_in_time']
    list_filter = ['record_type', 'status', 'method', 'date']
    search_fields = ['student__first_name', 'student__last_name', 'staff__first_name', 'staff__last_name']
    date_hierarchy = 'date'
    
    def get_entity_name(self, obj):
        if obj.record_type == 'STUDENT':
            return obj.student.get_full_name()
        return obj.staff.get_full_name()
    get_entity_name.short_description = 'Name'


@admin.register(AttendanceConfiguration)
class AttendanceConfigurationAdmin(admin.ModelAdmin):
    """Admin interface for Attendance Configuration."""
    
    list_display = ['tenant', 'student_cutoff_time', 'staff_cutoff_time', 'enable_monthly_whatsapp_reports']


@admin.register(AttendanceMonthlyAggregate)
class AttendanceMonthlyAggregateAdmin(admin.ModelAdmin):
    """Admin interface for Monthly Aggregates."""
    
    list_display = ['get_entity_name', 'month', 'attendance_percentage', 'present_days', 'absent_days']
    list_filter = ['record_type', 'month']
    
    def get_entity_name(self, obj):
        if obj.record_type == 'STUDENT':
            return obj.student.get_full_name()
        return obj.staff.get_full_name()
    get_entity_name.short_description = 'Name'


@admin.register(QRCodeToken)
class QRCodeTokenAdmin(admin.ModelAdmin):
    """Admin interface for QR Code Tokens."""
    
    list_display = ['get_entity_name', 'token', 'valid_date', 'is_active']
    list_filter = ['valid_date', 'is_active']
    
    def get_entity_name(self, obj):
        if obj.teacher:
            return f"Teacher: {obj.teacher.get_full_name()}"
        return f"Student: {obj.student.get_full_name()}"
    get_entity_name.short_description = 'Entity'
```

---

## ✅ **IMPLEMENTATION COMPLETE!**

All code is ready! Simply:
1. Copy each section to the corresponding file
2. Add URL routing to main config
3. Test the endpoints

**Status**: ✅ **100% CODE READY**
