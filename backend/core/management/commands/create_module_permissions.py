"""
Management command to create permissions for ID Cards, Certificates, and Reports modules.
"""
from django.core.management.base import BaseCommand
from users.models import Permission


class Command(BaseCommand):
    help = 'Create permissions for ID Cards, Certificates, and Reports modules'

    def handle(self, *args, **options):
        # Define permissions for each module
        permissions = [
            # ID Card permissions
            {'resource': 'idcard', 'action': 'create', 'group': 'ID Cards', 'description': 'Create ID card designs and templates'},
            {'resource': 'idcard', 'action': 'read', 'group': 'ID Cards', 'description': 'View ID card designs and templates'},
            {'resource': 'idcard', 'action': 'update', 'group': 'ID Cards', 'description': 'Edit ID card designs and templates'},
            {'resource': 'idcard', 'action': 'delete', 'group': 'ID Cards', 'description': 'Delete ID card designs and templates'},
            {'resource': 'idcard', 'action': 'export', 'group': 'ID Cards', 'description': 'Generate and export ID cards'},
            
            # Certificate permissions
            {'resource': 'certificate', 'action': 'create', 'group': 'Certificates', 'description': 'Create certificate templates'},
            {'resource': 'certificate', 'action': 'read', 'group': 'Certificates', 'description': 'View certificates'},
            {'resource': 'certificate', 'action': 'update', 'group': 'Certificates', 'description': 'Edit certificate templates'},
            {'resource': 'certificate', 'action': 'delete', 'group': 'Certificates', 'description': 'Delete certificates'},
            {'resource': 'certificate', 'action': 'export', 'group': 'Certificates', 'description': 'Generate and export certificates'},
            
            # Report permissions
            {'resource': 'report', 'action': 'create', 'group': 'Reports', 'description': 'Create custom reports'},
            {'resource': 'report', 'action': 'read', 'group': 'Reports', 'description': 'View reports'},
            {'resource': 'report', 'action': 'update', 'group': 'Reports', 'description': 'Edit reports'},
            {'resource': 'report', 'action': 'delete', 'group': 'Reports', 'description': 'Delete reports'},
            {'resource': 'report', 'action': 'export', 'group': 'Reports', 'description': 'Export reports'},
            
            # Roles and User Management permissions
            {'resource': 'user_management', 'action': 'create', 'group': 'User Management', 'description': 'Create users'},
            {'resource': 'user_management', 'action': 'read', 'group': 'User Management', 'description': 'View users'},
            {'resource': 'user_management', 'action': 'update', 'group': 'User Management', 'description': 'Edit users'},
            {'resource': 'user_management', 'action': 'delete', 'group': 'User Management', 'description': 'Delete users'},
            
            {'resource': 'roles', 'action': 'create', 'group': 'Roles & Permissions', 'description': 'Create roles'},
            {'resource': 'roles', 'action': 'read', 'group': 'Roles & Permissions', 'description': 'View roles'},
            {'resource': 'roles', 'action': 'update', 'group': 'Roles & Permissions', 'description': 'Edit roles'},
            {'resource': 'roles', 'action': 'delete', 'group': 'Roles & Permissions', 'description': 'Delete roles'},
            
            {'resource': 'settings', 'action': 'read', 'group': 'Settings', 'description': 'View settings'},
            {'resource': 'settings', 'action': 'update', 'group': 'Settings', 'description': 'Update settings'},
            
            # Fees permissions
            {'resource': 'fees', 'action': 'create', 'group': 'Fees', 'description': 'Create fee structures and invoices'},
            {'resource': 'fees', 'action': 'read', 'group': 'Fees', 'description': 'View fees and invoices'},
            {'resource': 'fees', 'action': 'update', 'group': 'Fees', 'description': 'Edit fee structures and invoices'},
            {'resource': 'fees', 'action': 'delete', 'group': 'Fees', 'description': 'Delete fees and invoices'},
        ]
        
        created_count = 0
        updated_count = 0
        
        for perm_data in permissions:
            perm, created = Permission.objects.get_or_create(
                code=f"{perm_data['resource']}.{perm_data['action']}",
                defaults={
                    'resource': perm_data['resource'],
                    'action': perm_data['action'],
                    'description': perm_data['description'],
                    'group': perm_data['group'],
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {perm.code}"))
                created_count += 1
            else:
                # Update group if missing
                if not perm.group:
                    perm.group = perm_data['group']
                    perm.description = perm_data['description']
                    perm.save()
                    self.stdout.write(f"Updated: {perm.code}")
                    updated_count += 1
                else:
                    self.stdout.write(f"Exists: {perm.code}")
        
        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created: {created_count}, Updated: {updated_count}"
        ))
