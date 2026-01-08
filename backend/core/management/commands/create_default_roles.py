"""
Management command to create default roles including Parent role.
"""
from django.core.management.base import BaseCommand
from users.models import Role, Permission, RolePermission
from tenants.models import Tenant


class Command(BaseCommand):
    help = 'Create default roles including Parent role for all tenants'

    def handle(self, *args, **options):
        # Define default roles with their permissions
        default_roles = [
            {
                'name': 'Parent',
                'code': 'parent',
                'description': 'Parent/Guardian role with access to view their children\'s information',
                'permissions': [
                    'student_module.read',  # View student info
                ]
            },
            {
                'name': 'School Administrator',
                'code': 'school_admin',
                'description': 'Full school management access',
                'permissions': [
                    'student_module.create', 'student_module.read', 'student_module.update', 'student_module.delete',
                    'attendance.create', 'attendance.read', 'attendance.update', 'attendance.delete',
                    'fees.create', 'fees.read', 'fees.update', 'fees.delete',
                    'idcard.create', 'idcard.read', 'idcard.update', 'idcard.delete',
                    'certificate.create', 'certificate.read', 'certificate.update', 'certificate.delete',
                    'report.create', 'report.read', 'report.update', 'report.delete',
                    'user_management.create', 'user_management.read', 'user_management.update',
                ]
            },
            {
                'name': 'Tenant Administrator',
                'code': 'tenant_admin',
                'description': 'Tenant (organization) level administrator',
                'permissions': [
                    'student_module.create', 'student_module.read', 'student_module.update', 'student_module.delete',
                    'attendance.create', 'attendance.read', 'attendance.update', 'attendance.delete',
                    'fees.create', 'fees.read', 'fees.update', 'fees.delete',
                    'idcard.create', 'idcard.read', 'idcard.update', 'idcard.delete',
                    'certificate.create', 'certificate.read', 'certificate.update', 'certificate.delete',
                    'report.create', 'report.read', 'report.update', 'report.delete',
                    'user_management.create', 'user_management.read', 'user_management.update', 'user_management.delete',
                    'settings.read', 'settings.update',
                    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
                ]
            },
        ]
        
        # Get all tenants
        tenants = Tenant.objects.filter(is_active=True)
        
        for tenant in tenants:
            self.stdout.write(f'\nProcessing tenant: {tenant.name}')
            
            for role_data in default_roles:
                role, created = Role.objects.get_or_create(
                    tenant=tenant,
                    code=role_data['code'],
                    defaults={
                        'name': role_data['name'],
                        'description': role_data['description'],
                    }
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'  Created role: {role.name}'))
                else:
                    self.stdout.write(f'  Role exists: {role.name}')
                
                # Assign permissions
                for perm_code in role_data.get('permissions', []):
                    try:
                        permission = Permission.objects.get(code=perm_code)
                        role_perm, perm_created = RolePermission.objects.get_or_create(
                            role=role,
                            permission=permission
                        )
                        if perm_created:
                            self.stdout.write(f'    + Added permission: {perm_code}')
                    except Permission.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'    ! Permission not found: {perm_code}'))
        
        self.stdout.write(self.style.SUCCESS('\nDefault roles created successfully!'))

