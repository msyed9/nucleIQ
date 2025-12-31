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
    Send WhatsApp reminders to fee defaulters.
    """
    defaulters = FeeDefaulter.objects.filter(
        access_stopped=False,
        total_due__gt=0
    )
    
    for defaulter in defaulters:
        # TODO: Integrate with WhatsApp API
        # Send reminder with "Pay Now" link
        
        defaulter.last_reminder_sent = timezone.now()
        defaulter.reminder_count += 1
        defaulter.save()
    
    return f"Sent {defaulters.count()} reminders"
