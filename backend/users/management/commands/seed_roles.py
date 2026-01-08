"""
Management command to seed default roles for the RBAC system.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import Role


class Command(BaseCommand):
    help = 'Seeds default roles for the RBAC system'
    
    # Define default roles
    DEFAULT_ROLES = [
        {
            'name': 'Platform Administrator',
            'code': 'platform_admin',
            'description': 'Platform-level administrator with full access to all tenants',
        },
        {
            'name': 'School Administrator',
            'code': 'school_admin',
            'description': 'School-level administrator with full access to tenant features',
        },
        {
            'name': 'Teacher',
            'code': 'teacher',
            'description': 'Teaching staff with access to academic and student management',
        },
        {
            'name': 'Accountant',
            'code': 'accountant',
            'description': 'Financial staff with access to fees and accounting modules',
        },
        {
            'name': 'Librarian',
            'code': 'librarian',
            'description': 'Library staff with access to library management',
        },
        {
            'name': 'Transport Manager',
            'code': 'transport_manager',
            'description': 'Transport staff with access to transport management',
        },
        {
            'name': 'Hostel Warden',
            'code': 'hostel_warden',
            'description': 'Hostel staff with access to hostel management',
        },
        {
            'name': 'Receptionist',
            'code': 'receptionist',
            'description': 'Front desk staff with limited access',
        },
    ]
    
    def handle(self, *args, **options):
        """Seed default roles."""
        from core.middleware import set_current_tenant
        from tenants.models import Tenant
        
        # Get or create a system tenant for global roles (optional)
        # For tenant-specific roles, this command should be run per tenant
        try:
            # Try to get the first active tenant
            tenant = Tenant.objects.filter(is_active=True).first()
            if not tenant:
                self.stdout.write(
                    self.style.WARNING(
                        'No active tenant found. Roles are tenant-specific. '
                        'Please create roles after tenant setup.'
                    )
                )
                return
            
            # Set the tenant context
            set_current_tenant(tenant)
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error setting tenant context: {e}')
            )
            return
        
        with transaction.atomic():
            roles_created = 0
            roles_updated = 0
            
            for role_data in self.DEFAULT_ROLES:
                code = role_data['code']
                
                # Get or create role for this tenant
                role, created = Role.objects.get_or_create(
                    code=code,
                    tenant=tenant,
                    defaults={
                        'name': role_data['name'],
                        'description': role_data['description'],
                        'is_active': True,
                    }
                )
                
                if created:
                    roles_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(f' Created role: {role.name}')
                    )
                else:
                    # Update existing role
                    role.name = role_data['name']
                    role.description = role_data['description']
                    role.save()
                    roles_updated += 1
                    self.stdout.write(
                        self.style.WARNING(f' Updated role: {role.name}')
                    )
            
            self.stdout.write('')
            self.stdout.write(
                self.style.SUCCESS(
                    f' Roles seeded successfully for tenant "{tenant.name}": '
                    f'{roles_created} created, {roles_updated} updated'
                )
            )
