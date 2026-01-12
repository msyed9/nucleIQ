"""
Management command to create default ID card templates
"""

from django.core.management.base import BaseCommand
from idcards.models import IDCardTemplate
from tenants.models import Tenant


class Command(BaseCommand):
    help = 'Create default system ID card templates'
    
    def handle(self, *args, **options):
        self.stdout.write('Creating default ID card templates...')
        
        # Get first tenant or create a system tenant
        tenant = Tenant.objects.first()
        
        if not tenant:
            self.stdout.write(self.style.ERROR('No tenant found. Please create a tenant first.'))
            return
        
        templates_created = 0
        
        # Template 1: Student Portrait - Classic
        template1, created = IDCardTemplate.objects.get_or_create(
            name='Student Portrait - Classic',
            entity_type='student',
            is_system=True,
            tenant=tenant,
            defaults={
                'description': 'Classic vertical student ID card with blue gradient',
                'orientation': 'portrait',
                'width': 54.0,
                'height': 86.0,
                'background_type': 'gradient',
                'background_value': 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                'config': {
                    'elements': [
                        {
                            'id': 'school_logo',
                            'type': 'image',
                            'x': 17, 'y': 3, 'width': 20, 'height': 20,
                            'source': 'school.logo'
                        },
                        {
                            'id': 'school_name',
                            'type': 'text',
                            'x': 2, 'y': 24, 'width': 50, 'height': 6,
                            'text': '{{school.name}}',
                            'source': 'school.name',
                            'fontSize': 14,
                            'fontWeight': 'bold',
                            'textAlign': 'center',
                            'color': '#ffffff'
                        },
                        {
                            'id': 'student_photo',
                            'type': 'image',
                            'x': 12, 'y': 31, 'width': 30, 'height': 35,
                            'source': 'student.photo',
                            'borderRadius': 4
                        },
                        {
                            'id': 'student_name',
                            'type': 'text',
                            'x': 2, 'y': 67, 'width': 50, 'height': 5,
                            'source': 'student.name',
                            'fontSize': 12,
                            'fontWeight': '600',
                            'textAlign': 'center',
                            'color': '#1f2937'
                        },
                        {
                            'id': 'class_section',
                            'type': 'text',
                            'x': 2, 'y': 72, 'width': 50, 'height': 4,
                            'text': 'Class: {{student.class}} - {{student.section}}',
                            'fontSize': 10,
                            'textAlign': 'center',
                             'color': '#4b5563'
                        },
                        {
                            'id': 'qr_code',
                            'type': 'qr',
                            'x': 17, 'y': 77, 'width': 20, 'height': 20
                        }
                    ]
                }
            }
        )
        if created:
            templates_created += 1
            self.stdout.write(self.style.SUCCESS(f'Created: {template1.name}'))
        
        # Template 2: Student Landscape - Modern
        template2, created = IDCardTemplate.objects.get_or_create(
            name='Student Landscape - Modern',
            entity_type='student',
            is_system=True,
            tenant=tenant,
            defaults={
                'description': 'Modern horizontal student ID card',
                'orientation': 'landscape',
                'width': 86.0,
                'height': 54.0,
                'background_type': 'color',
                'background_value': '#f8fafc',
                'config': {
                    'elements': [
                        {
                            'id': 'accent_bar',
                            'type': 'shape',
                            'shape': 'rectangle',
                            'x': 0, 'y': 0, 'width': 86, 'height': 8,
                            'fillColor': '#3b82f6'
                        },
                        {
                            'id': 'school_name',
                            'type': 'text',
                            'x': 2, 'y': 2, 'width': 60, 'height': 4,
                            'source': 'school.name',
                            'fontSize': 12,
                            'fontWeight': 'bold',
                            'textAlign': 'center',
                            'color': '#ffffff'
                        },
                        {
                            'id': 'student_photo',
                            'type': 'image',
                            'x': 4, 'y': 12, 'width': 25, 'height': 30,
                            'source': 'student.photo',
                            'borderRadius': 4
                        },
                        {
                            'id': 'student_name',
                            'type': 'text',
                            'x': 32, 'y': 14, 'width': 50, 'height': 5,
                            'source': 'student.name',
                            'fontSize': 13,
                            'fontWeight': 'bold',
                            'color': '#1f2937'
                        },
                        {
                            'id': 'class_label',
                            'type': 'text',
                            'x': 32, 'y': 21, 'width': 50, 'height': 4,
                            'text': 'Class: {{student.class}} - {{student.section}}',
                            'fontSize': 10,
                            'color': '#6b7280'
                        },
                        {
                            'id': 'admission_label',
                            'type': 'text',
                            'x': 32, 'y': 26, 'width': 50, 'height': 4,
                            'text': 'Adm No: {{student.admission_number}}',
                            'fontSize': 9,
                            'color': '#6b7280'
                        },
                        {
                            'id': 'qr_code',
                            'type': 'qr',
                            'x': 63, 'y': 31, 'width': 20, 'height': 20
                        }
                    ]
                }
            }
        )
        if created:
            templates_created += 1
            self.stdout.write(self.style.SUCCESS(f'Created: {template2.name}'))
        
        # Template 3: Staff Portrait - Professional
        template3, created = IDCardTemplate.objects.get_or_create(
            name='Staff Portrait - Professional',
            entity_type='staff',
            is_system=True,
            tenant=tenant,
            defaults={
                'description': 'Professional vertical staff ID card',
                'orientation': 'portrait',
                'width': 54.0,
                'height': 86.0,
                'background_type': 'gradient',
                'background_value': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                'config': {
                    'elements': [
                        {
                            'id': 'school_logo',
                            'type': 'image',
                            'x': 17, 'y': 3, 'width': 20, 'height': 20,
                            'source': 'school.logo'
                        },
                        {
                            'id': 'school_name',
                            'type': 'text',
                            'x': 2, 'y': 24, 'width': 50, 'height': 6,
                            'source': 'school.name',
                            'fontSize': 14,
                            'fontWeight': 'bold',
                            'textAlign': 'center',
                            'color': '#ffffff'
                        },
                        {
                            'id': 'staff_label',
                            'type': 'text',
                            'x': 2, 'y': 29, 'width': 50, 'height': 4,
                            'text': 'STAFF',
                            'fontSize': 10,
                            'fontWeight': 'bold',
                            'textAlign': 'center',
                            'color': '#fbbf24'
                        },
                        {
                            'id': 'staff_photo',
                            'type': 'image',
                            'x': 12, 'y': 34, 'width': 30, 'height': 32,
                            'source': 'staff.photo',
                            'borderRadius': 4
                        },
                        {
                            'id': 'staff_name',
                            'type': 'text',
                            'x': 2, 'y': 67, 'width': 50, 'height': 5,
                            'source': 'staff.name',
                            'fontSize': 12,
                            'fontWeight': '600',
                            'textAlign': 'center',
                            'color': '#ffffff'
                        },
                        {
                            'id': 'designation',
                            'type': 'text',
                            'x': 2, 'y': 72, 'width': 50, 'height': 4,
                            'source': 'staff.designation',
                            'fontSize': 10,
                            'textAlign': 'center',
                            'color': '#e5e7eb'
                        },
                        {
                            'id': 'qr_code',
                            'type': 'qr',
                            'x': 17, 'y': 77, 'width': 18, 'height': 18
                        }
                    ]
                }
            }
        )
        if created:
            templates_created += 1
            self.stdout.write(self.style.SUCCESS(f'Created: {template3.name}'))
        
        # Template 4: Staff Landscape - Corporate
        template4, created = IDCardTemplate.objects.get_or_create(
            name='Staff Landscape - Corporate',
            entity_type='staff',
            is_system=True,
            tenant=tenant,
            defaults={
                'description': 'Corporate horizontal staff ID card',
                'orientation': 'landscape',
                'width': 86.0,
                'height': 54.0,
                'background_type': 'color',
                'background_value': '#ffffff',
                'config': {
                    'elements': [
                        {
                            'id': 'header_bar',
                            'type': 'shape',
                            'shape': 'rectangle',
                            'x': 0, 'y': 0, 'width': 86, 'height': 10,
                            'fillColor': '#0f172a'
                        },
                        {
                            'id': 'school_name',
                            'type': 'text',
                            'x': 2, 'y': 2, 'width': 50, 'height': 6,
                            'source': 'school.name',
                            'fontSize': 13,
                            'fontWeight': 'bold',
                            'color': '#ffffff'
                        },
                        {
                            'id': 'staff_label',
                            'type': 'text',
                            'x': 54, 'y': 3, 'width': 30, 'height': 4,
                            'text': 'STAFF MEMBER',
                            'fontSize': 9,
                            'fontWeight': 'bold',
                            'textAlign': 'right',
                            'color': '#fbbf24'
                        },
                        {
                            'id': 'staff_photo',
                            'type': 'image',
                            'x': 4, 'y': 14, 'width': 22, 'height': 28,
                            'source': 'staff.photo',
                            'borderRadius': 4
                        },
                        {
                            'id': 'staff_name',
                            'type': 'text',
                            'x': 29, 'y': 16, 'width': 54, 'height': 5,
                            'source': 'staff.name',
                            'fontSize': 13,
                            'fontWeight': 'bold',
                            'color': '#1f2937'
                        },
                        {
                            'id': 'designation',
                            'type': 'text',
                            'x': 29, 'y': 23, 'width': 54, 'height': 4,
                            'source': 'staff.designation',
                            'fontSize': 10,
                            'color': '#6b7280'
                        },
                        {
                            'id': 'employee_id',
                            'type': 'text',
                            'x': 29, 'y': 28, 'width': 54, 'height': 4,
                            'text': 'ID: {{staff.employee_id}}',
                            'fontSize': 9,
                            'color': '#6b7280'
                        },
                        {
                            'id': 'qr_code',
                            'type': 'qr',
                            'x': 65, 'y': 32, 'width': 18, 'height': 18
                        }
                    ]
                }
            }
        )
        if created:
            templates_created += 1
            self.stdout.write(self.style.SUCCESS(f'Created: {template4.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nTotal templates created: {templates_created}'))
        self.stdout.write(self.style.SUCCESS('Default ID card templates setup complete!'))
