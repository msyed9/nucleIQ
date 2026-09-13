"""
Celery tasks for the staffwork module.

Scheduling is managed via django_celery_beat (DatabaseScheduler) — register these
in the beat admin, e.g.:
  - staffwork.tasks.generate_daily_admin_tasks   -> daily (crontab hour=0 min=5)
  - staffwork.tasks.mark_admin_tasks_overdue      -> daily (crontab hour=0 min=30)

Both iterate active tenants so a single beat entry covers the whole platform.
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_daily_admin_tasks(self, target_date=None):
    """
    Generate admin-task instances from active templates for every active tenant.
    Daily templates fire every day; weekly on their configured weekday; monthly
    on the 1st (see TaskGenerationService).
    """
    from tenants.models import Tenant
    from .services import TaskGenerationService

    from django.utils.dateparse import parse_date
    resolved_date = parse_date(target_date) if target_date else timezone.localdate()

    total = 0
    try:
        for tenant in Tenant.objects.filter(is_active=True):
            total += TaskGenerationService.generate(tenant, resolved_date)
    except Exception as e:
        logger.exception('generate_daily_admin_tasks failed')
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

    logger.info('generate_daily_admin_tasks: created %s tasks for %s', total, resolved_date)
    return total


@shared_task(bind=True, max_retries=3)
def mark_admin_tasks_overdue(self):
    """Flag past-due pending/in-progress admin tasks as OVERDUE for all tenants."""
    from tenants.models import Tenant
    from .services import TaskGenerationService

    total = 0
    try:
        for tenant in Tenant.objects.filter(is_active=True):
            total += TaskGenerationService.mark_overdue(tenant)
    except Exception as e:
        logger.exception('mark_admin_tasks_overdue failed')
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

    logger.info('mark_admin_tasks_overdue: updated %s tasks', total)
    return total
