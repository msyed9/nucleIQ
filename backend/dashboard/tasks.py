"""
Dashboard Celery Tasks
Scheduled tasks for leaderboard updates and analytics processing
"""

from celery import shared_task
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def update_all_leaderboards(self):
    """
    Update all active leaderboards for all tenants.
    Runs on a schedule (e.g., hourly or daily).
    """
    from tenants.models import Tenant
    from .services import LeaderboardService
    
    logger.info("Starting leaderboard update for all tenants")
    
    tenants = Tenant.objects.filter(is_active=True)
    results = {}
    
    for tenant in tenants:
        try:
            service = LeaderboardService(tenant)
            service.update_all_leaderboards()
            results[str(tenant.id)] = 'success'
            logger.info(f"Updated leaderboards for tenant: {tenant.name}")
        except Exception as e:
            results[str(tenant.id)] = str(e)
            logger.error(f"Failed to update leaderboards for tenant {tenant.name}: {e}")
    
    return results


@shared_task(bind=True)
def update_tenant_leaderboards(self, tenant_id: str):
    """
    Update all leaderboards for a specific tenant.
    Can be triggered manually or after significant data changes.
    """
    from tenants.models import Tenant
    from .services import LeaderboardService
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        service = LeaderboardService(tenant)
        service.update_all_leaderboards()
        
        logger.info(f"Updated leaderboards for tenant: {tenant.name}")
        return {'status': 'success', 'tenant': tenant.name}
    except Tenant.DoesNotExist:
        logger.error(f"Tenant not found: {tenant_id}")
        return {'status': 'error', 'message': 'Tenant not found'}
    except Exception as e:
        logger.error(f"Failed to update leaderboards: {e}")
        return {'status': 'error', 'message': str(e)}


@shared_task(bind=True)
def update_single_leaderboard(self, leaderboard_id: str):
    """
    Update a specific leaderboard.
    """
    from .models import Leaderboard
    from .services import LeaderboardService
    
    try:
        leaderboard = Leaderboard.objects.get(id=leaderboard_id)
        service = LeaderboardService(leaderboard.tenant)
        count = service.update_leaderboard(leaderboard)
        
        logger.info(f"Updated leaderboard {leaderboard.name} with {count} entries")
        return {'status': 'success', 'entries_count': count}
    except Leaderboard.DoesNotExist:
        logger.error(f"Leaderboard not found: {leaderboard_id}")
        return {'status': 'error', 'message': 'Leaderboard not found'}
    except Exception as e:
        logger.error(f"Failed to update leaderboard: {e}")
        return {'status': 'error', 'message': str(e)}


@shared_task(bind=True)
def refresh_widget_cache(self, tenant_id: str, widget_id: str = None):
    """
    Refresh cached widget data for a tenant.
    """
    from tenants.models import Tenant
    from .models import DashboardWidget, WidgetDefinition
    from .services import WidgetDataService
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        service = WidgetDataService(tenant)
        
        if widget_id:
            # Refresh specific widget
            widget_data = service.get_widget_data(widget_id)
            _update_widget_cache(tenant, widget_id, widget_data)
        else:
            # Refresh all widgets for tenant
            widgets = WidgetDefinition.objects.filter(is_active=True)
            for widget in widgets:
                try:
                    widget_data = service.get_widget_data(widget.widget_id)
                    _update_widget_cache(tenant, widget.widget_id, widget_data)
                except Exception as e:
                    logger.error(f"Failed to refresh widget {widget.widget_id}: {e}")
        
        return {'status': 'success'}
    except Tenant.DoesNotExist:
        return {'status': 'error', 'message': 'Tenant not found'}
    except Exception as e:
        logger.error(f"Failed to refresh widget cache: {e}")
        return {'status': 'error', 'message': str(e)}


def _update_widget_cache(tenant, widget_id, data):
    """Helper to update widget cache."""
    from .models import DashboardWidget, WidgetDefinition
    
    try:
        widget_def = WidgetDefinition.objects.get(widget_id=widget_id)
        cache_minutes = widget_def.refresh_interval or 60
        
        with transaction.atomic():
            DashboardWidget.objects.update_or_create(
                tenant=tenant,
                widget=widget_def,
                filters={},
                defaults={
                    'data': data,
                    'cache_valid_until': timezone.now() + timezone.timedelta(minutes=cache_minutes)
                }
            )
    except WidgetDefinition.DoesNotExist:
        pass


@shared_task(bind=True)
def calculate_daily_analytics(self):
    """
    Calculate daily analytics for all tenants.
    Should run at end of day to aggregate metrics.
    """
    from tenants.models import Tenant
    from analytics.models import TenantMetric
    from students.models import StudentEnrollment
    from fees.models import FeePayment
    from attendance.models import Attendance
    
    today = timezone.now().date()
    logger.info(f"Calculating daily analytics for {today}")
    
    tenants = Tenant.objects.filter(is_active=True)
    
    for tenant in tenants:
        try:
            # Calculate metrics
            active_students = StudentEnrollment.objects.filter(
                tenant=tenant,
                status='ACTIVE'
            ).count()
            
            today_payments = FeePayment.objects.filter(
                tenant=tenant,
                payment_date=today,
                status='COMPLETED'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Get attendance rate
            attendance_today = Attendance.objects.filter(
                tenant=tenant,
                date=today
            )
            total_att = attendance_today.count()
            present = attendance_today.filter(status='PRESENT').count()
            attendance_rate = (present / total_att * 100) if total_att > 0 else 0
            
            # Store metrics
            TenantMetric.objects.update_or_create(
                tenant=tenant,
                date=today,
                defaults={
                    'active_students': active_students,
                    'daily_collection': today_payments,
                    'attendance_rate': attendance_rate,
                }
            )
            
            logger.info(f"Calculated daily analytics for tenant: {tenant.name}")
        except Exception as e:
            logger.error(f"Failed to calculate analytics for tenant {tenant.name}: {e}")
    
    return {'status': 'success', 'date': str(today)}


@shared_task(bind=True)
def generate_weekly_report(self):
    """
    Generate weekly analytics reports for all tenants.
    """
    from tenants.models import Tenant
    from reports.services import ReportService
    
    today = timezone.now().date()
    week_start = today - timezone.timedelta(days=today.weekday())
    week_end = week_start + timezone.timedelta(days=6)
    
    logger.info(f"Generating weekly reports for {week_start} to {week_end}")
    
    tenants = Tenant.objects.filter(is_active=True)
    
    for tenant in tenants:
        try:
            report_service = ReportService(tenant)
            report = report_service.generate_weekly_summary(week_start, week_end)
            logger.info(f"Generated weekly report for tenant: {tenant.name}")
        except Exception as e:
            logger.error(f"Failed to generate weekly report for tenant {tenant.name}: {e}")
    
    return {'status': 'success', 'week': f"{week_start} to {week_end}"}


@shared_task(bind=True)
def cleanup_old_leaderboard_entries(self, days: int = 90):
    """
    Clean up old leaderboard entries to save database space.
    Keeps entries for the specified number of days.
    """
    from .models import LeaderboardEntry
    
    cutoff_date = timezone.now().date() - timezone.timedelta(days=days)
    
    # Delete old entries
    deleted, _ = LeaderboardEntry.objects.filter(
        period_end__lt=cutoff_date
    ).delete()
    
    logger.info(f"Deleted {deleted} old leaderboard entries older than {cutoff_date}")
    return {'status': 'success', 'deleted_count': deleted}


@shared_task(bind=True)
def sync_dashboard_layouts(self, tenant_id: str = None):
    """
    Sync dashboard layouts with current widget definitions.
    Removes references to deleted/inactive widgets.
    """
    from .models import DashboardLayout, WidgetDefinition
    from tenants.models import Tenant
    
    active_widget_ids = set(
        WidgetDefinition.objects.filter(is_active=True).values_list('widget_id', flat=True)
    )
    
    layouts = DashboardLayout.objects.all()
    if tenant_id:
        try:
            tenant = Tenant.objects.get(id=tenant_id)
            layouts = layouts.filter(user__tenant=tenant)
        except Tenant.DoesNotExist:
            pass
    
    updated_count = 0
    for layout in layouts:
        original_count = len(layout.layout)
        
        # Remove widgets that no longer exist
        layout.layout = [
            w for w in layout.layout
            if w.get('i') in active_widget_ids
        ]
        
        if len(layout.layout) != original_count:
            layout.save(update_fields=['layout', 'updated_at'])
            updated_count += 1
    
    logger.info(f"Synced {updated_count} dashboard layouts")
    return {'status': 'success', 'updated_count': updated_count}
