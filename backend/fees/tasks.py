"""
Celery Tasks for Fee Automation
"""

from celery import shared_task
from datetime import date
from django.utils import timezone
from .services import FeeCalculationService
from .models import FeeDefaulter


@shared_task
def generate_monthly_invoices_task():
    """
    Generate monthly invoices for all tenants.
    Runs on 1st of every month.
    """
    from tenants.models import Tenant, AcademicYear
    
    today = date.today()
    
    for tenant in Tenant.objects.filter(is_active=True):
        academic_year = AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True
        ).first()
        
        if not academic_year:
            continue
        
        count = FeeCalculationService.generate_monthly_invoices(
            tenant, academic_year, today
        )
        
        print(f"Generated {count} invoices for {tenant.name}")
    
    return "Monthly invoices generated"


@shared_task
def update_defaulters_task():
    """
    Update fee defaulters list daily.
    """
    from tenants.models import Tenant
    
    for tenant in Tenant.objects.filter(is_active=True):
        FeeCalculationService.update_defaulters(tenant)
    
    return "Defaulters updated"


@shared_task
def send_fee_reminders_task():
    """
    Send WhatsApp/SMS reminders to fee defaulters.
    """
    from communication.services import SMSService, WhatsAppService
    from communication.models import MessageLog
    from students.models import Student
    
    defaulters = FeeDefaulter.objects.filter(
        access_stopped=False,
        total_due__gt=0
    ).select_related('student', 'tenant')
    
    sent_count = 0
    failed_count = 0
    
    for defaulter in defaulters:
        try:
            student = Student.objects.get(id=defaulter.student_id)
            
            # Get parent details
            parent_name = student.parent_name or student.father_name or "Parent"
            parent_phone = student.parent_phone or student.father_phone
            
            if not parent_phone:
                continue
            
            # Format phone number
            phone = SMSService.format_phone_number(parent_phone)
            
            # Calculate overdue days
            overdue_days = (timezone.now().date() - defaulter.due_date).days if hasattr(defaulter, 'due_date') else 0
            
            # Generate payment link (placeholder - implement actual payment gateway link)
            payment_link = f"https://{defaulter.tenant.subdomain}.nucleiq.com/pay/{student.admission_number}"
            
            # Determine notification type based on preference
            notification_type = getattr(student, 'notification_preference', 'BOTH')  # SMS, WHATSAPP, BOTH
            
            message_sent = False
            
            # Send WhatsApp if enabled
            if notification_type in ['WHATSAPP', 'BOTH']:
                try:
                    result = WhatsAppService.send_overdue_reminder(
                        phone_number=phone,
                        parent_name=parent_name,
                        student_name=student.get_full_name(),
                        amount=float(defaulter.total_due),
                        due_date=str(defaulter.due_date) if hasattr(defaulter, 'due_date') else 'N/A',
                        overdue_days=max(0, overdue_days),
                        late_fee=0.0,  # Calculate late fee if applicable
                        payment_link=payment_link,
                        contact_number=defaulter.tenant.phone or '1800-XXX-XXXX',
                        school_name=defaulter.tenant.name
                    )
                    
                    if result['status'] == 'sent':
                        # Log message
                        MessageLog.objects.create(
                            tenant=defaulter.tenant,
                            message_type='WHATSAPP',
                            recipient=parent_phone,
                            recipient_name=parent_name,
                            subject='Fee Overdue Reminder',
                            content=f"Fee overdue for {student.get_full_name()}",
                            status='SENT',
                            provider_message_id=result.get('message_id'),
                            metadata={'defaulter_id': str(defaulter.id)}
                        )
                        message_sent = True
                        
                except Exception as e:
                    logger.error(f"WhatsApp sending failed for {student.admission_number}: {str(e)}")
            
            # Send SMS if enabled
            if notification_type in ['SMS', 'BOTH']:
                try:
                    sms_message = f"Dear {parent_name}, Fee payment for {student.get_full_name()} is overdue. Amount: Rs.{defaulter.total_due}. Pay now: {payment_link} - {defaulter.tenant.name}"
                    
                    result = SMSService.send_sms(
                        phone_number=phone,
                        message=sms_message[:160]  # SMS limit
                    )
                    
                    if result['status'] == 'sent':
                        # Log message
                        MessageLog.objects.create(
                            tenant=defaulter.tenant,
                            message_type='SMS',
                            recipient=parent_phone,
                            recipient_name=parent_name,
                            subject='Fee Overdue Reminder',
                            content=sms_message,
                            status='SENT',
                            provider_message_id=result.get('message_id'),
                            metadata={'defaulter_id': str(defaulter.id)}
                        )
                        message_sent = True
                        
                except Exception as e:
                    logger.error(f"SMS sending failed for {student.admission_number}: {str(e)}")
            
            # Update defaulter record
            if message_sent:
                defaulter.last_reminder_sent = timezone.now()
                defaulter.reminder_count += 1
                defaulter.save()
                sent_count += 1
            else:
                failed_count += 1
                
        except Student.DoesNotExist:
            logger.error(f"Student not found for defaulter {defaulter.id}")
            failed_count += 1
        except Exception as e:
            logger.error(f"Error processing defaulter {defaulter.id}: {str(e)}")
            failed_count += 1
    
    return f"Sent {sent_count} reminders, {failed_count} failed"
