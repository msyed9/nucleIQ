"""
Celery Tasks for Student Notifications

Background tasks for sending notifications to avoid blocking the API.
"""

from celery import shared_task
from django.utils import timezone
from .models import Student
from .notifications import StudentNotificationService


@shared_task(bind=True, max_retries=3)
def sync_siblings_task(self, tenant_id):
    """
    Mass sibling-matching job: reconciles Student.family_id across a whole
    tenant by grouping students that share a father/mother mobile number.

    Triggered automatically after a bulk import (see
    BulkStudentImportService.import_students) and available on-demand via
    StudentViewSet.sync_siblings (POST .../students/sync_siblings/).

    Idempotent - groups already sharing one family_id are skipped, so
    running this repeatedly (e.g. after every import) does no redundant work.

    Args:
        tenant_id: Tenant primary key
    """
    try:
        from tenants.models import Tenant
        from .services import SiblingLinkingService

        tenant = Tenant.objects.get(id=tenant_id)
        stats = SiblingLinkingService.sync_tenant(tenant)

        return {
            'success': True,
            'tenant_id': str(tenant_id),
            **stats
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_admission_confirmation_task(self, student_id: int, tenant_id: int):
    """
    Send admission confirmation notification in background.
    
    Args:
        student_id: Student primary key
        tenant_id: Tenant primary key
    """
    try:
        from tenants.models import Tenant
        
        tenant = Tenant.objects.get(id=tenant_id)
        student = Student.objects.get(id=student_id, tenant=tenant)
        
        service = StudentNotificationService(tenant)
        result = service.send_admission_confirmation(student)
        
        return {
            'success': True,
            'student_id': student_id,
            'result': result
        }
    except Exception as e:
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_absent_alert_task(self, student_id: int, tenant_id: int, date: str, reason: str = None):
    """
    Send absent alert notification in background.
    
    Args:
        student_id: Student primary key
        tenant_id: Tenant primary key
        date: Date of absence
        reason: Optional reason
    """
    try:
        from tenants.models import Tenant
        
        tenant = Tenant.objects.get(id=tenant_id)
        student = Student.objects.get(id=student_id, tenant=tenant)
        
        service = StudentNotificationService(tenant)
        result = service.send_absent_alert(student, date, reason)
        
        return {
            'success': True,
            'student_id': student_id,
            'result': result
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_fee_reminder_task(
    self, 
    student_id: int, 
    tenant_id: int, 
    amount: float, 
    due_date: str,
    invoice_number: str = None
):
    """
    Send fee payment reminder in background.
    
    Args:
        student_id: Student primary key
        tenant_id: Tenant primary key
        amount: Amount due
        due_date: Due date
        invoice_number: Optional invoice number
    """
    try:
        from tenants.models import Tenant
        
        tenant = Tenant.objects.get(id=tenant_id)
        student = Student.objects.get(id=student_id, tenant=tenant)
        
        service = StudentNotificationService(tenant)
        result = service.send_fee_reminder(student, amount, due_date, invoice_number)
        
        return {
            'success': True,
            'student_id': student_id,
            'result': result
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_exam_result_published_task(
    self,
    student_id: int,
    tenant_id: int,
    exam_name: str,
    percentage: float,
    grade: str
):
    """
    Send exam result published notification in background.
    
    Args:
        student_id: Student primary key
        tenant_id: Tenant primary key
        exam_name: Name of exam
        percentage: Percentage scored
        grade: Grade obtained
    """
    try:
        from tenants.models import Tenant
        
        tenant = Tenant.objects.get(id=tenant_id)
        student = Student.objects.get(id=student_id, tenant=tenant)
        
        service = StudentNotificationService(tenant)
        result = service.send_exam_result_published(student, exam_name, percentage, grade)
        
        return {
            'success': True,
            'student_id': student_id,
            'result': result
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_promotion_notification_task(
    self,
    student_id: int,
    tenant_id: int,
    from_class: str,
    to_class: str,
    academic_year: str
):
    """
    Send promotion notification in background.
    
    Args:
        student_id: Student primary key
        tenant_id: Tenant primary key
        from_class: Current class
        to_class: Promoted to class
        academic_year: Academic year
    """
    try:
        from tenants.models import Tenant
        
        tenant = Tenant.objects.get(id=tenant_id)
        student = Student.objects.get(id=student_id, tenant=tenant)
        
        service = StudentNotificationService(tenant)
        result = service.send_promotion_notification(
            student, from_class, to_class, academic_year
        )
        
        return {
            'success': True,
            'student_id': student_id,
            'result': result
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_bulk_notification_task(
    self,
    student_ids: list,
    tenant_id: int,
    sms_message_template: str,
    email_subject_template: str,
    email_content_template: str,
    notification_type: str
):
    """
    Send bulk notifications to multiple students in background.
    
    Args:
        student_ids: List of student primary keys
        tenant_id: Tenant primary key
        sms_message_template: SMS template
        email_subject_template: Email subject template
        email_content_template: Email content template
        notification_type: Type of notification
    """
    try:
        from tenants.models import Tenant
        
        tenant = Tenant.objects.get(id=tenant_id)
        students = Student.objects.filter(
            id__in=student_ids,
            tenant=tenant,
            is_active=True
        )
        
        service = StudentNotificationService(tenant)
        result = service.send_bulk_notification(
            students,
            sms_message_template,
            email_subject_template,
            email_content_template,
            notification_type
        )
        
        return {
            'success': True,
            'result': result
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task
def send_daily_fee_reminders(tenant_id: int):
    """
    Scheduled task to send daily fee reminders for overdue invoices.
    
    Should be scheduled via Celery Beat.
    
    Args:
        tenant_id: Tenant primary key
    """
    try:
        from tenants.models import Tenant
        from fees.models import FeeInvoice
        
        tenant = Tenant.objects.get(id=tenant_id)
        service = StudentNotificationService(tenant)
        
        # Get overdue invoices
        overdue_invoices = FeeInvoice.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL'],
            due_date__lt=timezone.now()
        ).select_related('student')
        
        results = []
        for invoice in overdue_invoices:
            result = service.send_fee_reminder(
                student=invoice.student,
                amount=invoice.total_amount - invoice.paid_amount,
                due_date=invoice.due_date.strftime('%d-%m-%Y'),
                invoice_number=invoice.invoice_number
            )
            results.append({
                'student_id': invoice.student.id,
                'invoice_id': invoice.id,
                'result': result
            })
        
        return {
            'success': True,
            'total_invoices': len(results),
            'results': results
        }
    except Exception as e:
        print(f"Daily fee reminders failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def send_absent_alerts_for_date(tenant_id: int, date_str: str):
    """
    Scheduled task to send absent alerts for a specific date.
    
    Should be run at end of day.
    
    Args:
        tenant_id: Tenant primary key
        date_str: Date in YYYY-MM-DD format
    """
    try:
        from tenants.models import Tenant
        from attendance.models import StudentAttendance
        from datetime import datetime
        
        tenant = Tenant.objects.get(id=tenant_id)
        service = StudentNotificationService(tenant)
        
        # Parse date
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Get absent students
        absent_records = StudentAttendance.objects.filter(
            tenant=tenant,
            date=date,
            status='ABSENT'
        ).select_related('student')
        
        results = []
        for record in absent_records:
            result = service.send_absent_alert(
                student=record.student,
                date=date.strftime('%d-%m-%Y'),
                reason=record.remarks
            )
            results.append({
                'student_id': record.student.id,
                'result': result
            })
        
        return {
            'success': True,
            'date': date_str,
            'total_absent': len(results),
            'results': results
        }
    except Exception as e:
        print(f"Absent alerts failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }
