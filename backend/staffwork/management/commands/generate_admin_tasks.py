"""
Generate admin task instances from active templates.

Usage:
    python manage.py generate_admin_tasks                # today, all active tenants
    python manage.py generate_admin_tasks --date 2026-09-13
    python manage.py generate_admin_tasks --tenant <uuid>
    python manage.py generate_admin_tasks --mark-overdue # also flag past-due tasks
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_date

from tenants.models import Tenant
from staffwork.services import TaskGenerationService


class Command(BaseCommand):
    help = 'Generate admin task instances from active templates for a given date.'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Target date (YYYY-MM-DD). Defaults to today.')
        parser.add_argument('--tenant', type=str, help='Limit to a single tenant id.')
        parser.add_argument('--mark-overdue', action='store_true',
                            help='Also mark past-due tasks OVERDUE.')

    def handle(self, *args, **options):
        target_date = parse_date(options['date']) if options.get('date') else timezone.localdate()

        tenants = Tenant.objects.filter(is_active=True)
        if options.get('tenant'):
            tenants = tenants.filter(id=options['tenant'])

        total_created = 0
        total_overdue = 0
        for tenant in tenants:
            created = TaskGenerationService.generate(tenant, target_date)
            total_created += created
            self.stdout.write(
                self.style.SUCCESS(f'  {tenant}: created {created} task(s) for {target_date}')
            )
            if options.get('mark_overdue'):
                total_overdue += TaskGenerationService.mark_overdue(tenant)

        self.stdout.write(self.style.SUCCESS(f'Done. {total_created} task(s) created.'))
        if options.get('mark_overdue'):
            self.stdout.write(self.style.WARNING(f'{total_overdue} task(s) marked overdue.'))
