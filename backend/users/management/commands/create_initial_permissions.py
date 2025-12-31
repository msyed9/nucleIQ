"""
Django management command to create initial permissions
Usage: python manage.py create_initial_permissions
"""

from django.core.management.base import BaseCommand
from users.models import Permission


class Command(BaseCommand):
    help = 'Create initial permissions for all modules'

    def handle(self, *args, **options):
        self.stdout.write('Creating initial permissions...')
        
        # Define all module permissions
        modules = [
            'student_module',
            'staff_module',
            'fee_module',
            'attendance_module',
            'exam_module',
            'library_module',
            'transport_module',
            'hostel_module',
            'inventory_module',
            'hr_module',
            'payroll_module',
            'communication_module',
            'report_module',
            'academic_module',
            'timetable_module',
            'admission_module',
        ]
        
        actions = [
            ('create', 'Create'),
            ('read', 'Read/View'),
            ('update', 'Update/Edit'),
            ('delete', 'Delete'),
            ('export', 'Export'),
            ('import', 'Import'),
        ]
        
        created_count = 0
        existing_count = 0
        
        for module in modules:
            for action_code, action_name in actions:
                permission, created = Permission.objects.get_or_create(
                    resource=module,
                    action=action_code,
                    defaults={
                        'description': f'{action_name} {module.replace("_", " ").title()}'
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created: {permission.code}')
                    )
                else:
                    existing_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted! Created {created_count} new permissions, '
                f'{existing_count} already existed.'
            )
        )
