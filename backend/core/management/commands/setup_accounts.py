"""
Management command to set up default chart of accounts for all tenants.
"""

from django.core.management.base import BaseCommand
from tenants.models import Tenant
from fees.signals import setup_default_accounts


class Command(BaseCommand):
    help = 'Set up default chart of accounts for all tenants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Specific tenant ID to set up accounts for',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant')
        
        if tenant_id:
            tenants = Tenant.objects.filter(id=tenant_id)
            if not tenants.exists():
                self.stderr.write(self.style.ERROR(f'Tenant {tenant_id} not found'))
                return
        else:
            tenants = Tenant.objects.filter(is_active=True)
        
        total_created = 0
        
        for tenant in tenants:
            self.stdout.write(f'Setting up accounts for: {tenant.name}')
            
            try:
                created_accounts = setup_default_accounts(tenant)
                count = len(created_accounts)
                total_created += count
                
                if count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f'  Created {count} accounts')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  All accounts already exist')
                    )
                    
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'  Error: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal accounts created: {total_created}')
        )
