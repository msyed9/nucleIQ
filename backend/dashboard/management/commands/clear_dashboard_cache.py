from django.core.management.base import BaseCommand, CommandError

from dashboard.analytics_service import AnalyticsService
from tenants.models import Tenant


class Command(BaseCommand):
    help = 'Clear dashboard analytics cache for one tenant or all tenants.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            dest='tenant_id',
            help='Tenant UUID to clear cache for a specific tenant.',
        )
        parser.add_argument(
            '--all-tenants',
            action='store_true',
            dest='all_tenants',
            help='Clear dashboard cache for all tenants.',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        all_tenants = options.get('all_tenants')

        if not tenant_id and not all_tenants:
            raise CommandError('Provide either --tenant-id <uuid> or --all-tenants')

        if tenant_id and all_tenants:
            raise CommandError('Use either --tenant-id or --all-tenants, not both')

        if tenant_id:
            tenant = Tenant.objects.filter(id=tenant_id).first()
            if not tenant:
                raise CommandError(f'Tenant not found: {tenant_id}')

            AnalyticsService(tenant).invalidate_cache()
            self.stdout.write(self.style.SUCCESS(f'Cleared dashboard cache for tenant {tenant.id}'))
            return

        tenants = Tenant.objects.all().only('id')
        cleared = 0
        for tenant in tenants:
            AnalyticsService(tenant).invalidate_cache()
            cleared += 1

        self.stdout.write(self.style.SUCCESS(f'Cleared dashboard cache for {cleared} tenants'))
