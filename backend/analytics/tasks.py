"""
Celery tasks for analytics aggregation
"""

from celery import shared_task
from datetime import date, timedelta
from django.utils import timezone
from .services import TenantHealthService, ChurnPredictionService
from tenants.models import Tenant
import logging

logger = logging.getLogger(__name__)


@shared_task
def aggregate_daily_metrics():
    """
    Daily task to aggregate metrics for all tenants.
    Run at midnight every day.
    """
    logger.info("Starting daily metrics aggregation...")
    
    today = date.today()
    tenants = Tenant.objects.filter(is_active=True)
    
    for tenant in tenants:
        try:
            service = TenantHealthService(tenant)
            health_score = service.calculate_health_score(today)
            logger.info(f"Calculated health score for {tenant.name}: {health_score}")
        except Exception as e:
            logger.error(f"Error calculating metrics for {tenant.name}: {e}")
    
    logger.info("Daily metrics aggregation completed")


@shared_task
def predict_churn_daily():
    """
    Daily task to predict churn for all tenants.
    """
    logger.info("Starting churn prediction...")
    
    tenants = Tenant.objects.filter(is_active=True)
    service = ChurnPredictionService()
    
    for tenant in tenants:
        try:
            prediction = service.predict_churn(tenant)
            if prediction and prediction.risk_level in ['HIGH', 'MEDIUM']:
                logger.warning(
                    f"Churn risk for {tenant.name}: "
                    f"{prediction.churn_probability}% ({prediction.risk_level})"
                )
        except Exception as e:
            logger.error(f"Error predicting churn for {tenant.name}: {e}")
    
    logger.info("Churn prediction completed")


@shared_task
def backfill_historical_metrics(days=30):
    """
    Backfill tenant metrics for the past N days.
    Intended to run weekly via Celery Beat.
    """
    logger.info(f"Starting historical metrics backfill for last {days} days...")

    today = date.today()
    start_date = today - timedelta(days=days)
    tenants = Tenant.objects.filter(is_active=True)

    for tenant in tenants:
        service = TenantHealthService(tenant)
        for offset in range(days + 1):
            target_date = start_date + timedelta(days=offset)
            try:
                service.calculate_health_score(target_date)
            except Exception as e:
                logger.error(
                    f"Error backfilling metrics for {tenant.name} on {target_date}: {e}"
                )

    logger.info("Historical metrics backfill completed")


@shared_task
def check_upsell_opportunities():
    """
    Check for upsell opportunities across all tenants.
    """
    logger.info("Checking upsell opportunities...")
    
    from .models import UpsellOpportunity
    from billing.models import Subscription
    
    tenants = Tenant.objects.filter(is_active=True)
    
    for tenant in tenants:
        try:
            subscription = Subscription.objects.filter(tenant=tenant, status='active').first()
            if not subscription:
                continue
            
            # Check student limit
            from students.models import Student
            student_count = Student.objects.filter(tenant=tenant).count()
            student_limit = subscription.plan.student_limit
            
            if student_limit and student_count >= student_limit * 0.9:
                usage_pct = (student_count / student_limit) * 100
                
                UpsellOpportunity.objects.get_or_create(
                    tenant=tenant,
                    opportunity_type='LIMIT_APPROACHING',
                    is_contacted=False,
                    defaults={
                        'title': 'Student Limit Approaching',
                        'description': f'Tenant is at {usage_pct:.1f}% of student limit',
                        'current_usage': student_count,
                        'limit': student_limit,
                        'usage_percentage': usage_pct,
                        'suggested_plan': 'Upgrade to next tier',
                    }
                )
        except Exception as e:
            logger.error(f"Error checking upsell for {tenant.name}: {e}")
    
    logger.info("Upsell check completed")


@shared_task
def backfill_historical_metrics(days=30):
    """
    Backfill historical metrics for all tenants.
    Useful when UsageLog data exists but metrics are missing.
    """
    try:
        days = int(days)
    except (TypeError, ValueError):
        days = 30

    days = max(1, min(days, 365))

    logger.info(f"Starting historical metrics backfill for last {days} days...")

    today = date.today()
    start_date = today - timedelta(days=days - 1)
    tenants = Tenant.objects.filter(is_active=True)

    for tenant in tenants:
        service = TenantHealthService(tenant)
        for i in range(days):
            target_date = start_date + timedelta(days=i)
            try:
                service.calculate_health_score(target_date)
            except Exception as e:
                logger.error(
                    f"Error backfilling metrics for {tenant.name} on {target_date}: {e}"
                )

    logger.info("Historical metrics backfill completed")
