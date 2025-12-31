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
