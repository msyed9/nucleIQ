"""
Management command to seed default permissions for the school ERP system.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import Permission


class Command(BaseCommand):
    help = 'Seeds default permissions for the school ERP system'
    
    # Define all permissions with grouping
    PERMISSIONS = [
        # Dashboard Permissions
        {'group': 'Dashboard', 'resource': 'monthly_income_expense', 'action': 'read', 'description': 'View monthly income vs expense pie chart', 'sort_order': 1},
        {'group': 'Dashboard', 'resource': 'annual_fees_summary', 'action': 'read', 'description': 'View annual student fees summary chart', 'sort_order': 2},
        {'group': 'Dashboard', 'resource': 'employee_count', 'action': 'read', 'description': 'View employee count widget', 'sort_order': 3},
        {'group': 'Dashboard', 'resource': 'student_count', 'action': 'read', 'description': 'View student count widget', 'sort_order': 4},
        {'group': 'Dashboard', 'resource': 'parent_count', 'action': 'read', 'description': 'View parent count widget', 'sort_order': 5},
        {'group': 'Dashboard', 'resource': 'teacher_count', 'action': 'read', 'description': 'View teacher count widget', 'sort_order': 6},
        {'group': 'Dashboard', 'resource': 'student_quantity_pie', 'action': 'read', 'description': 'View student quantity pie chart', 'sort_order': 7},
        {'group': 'Dashboard', 'resource': 'weekend_attendance', 'action': 'read', 'description': 'View weekend attendance inspection chart', 'sort_order': 8},
        {'group': 'Dashboard', 'resource': 'admission_count', 'action': 'read', 'description': 'View admission count widget', 'sort_order': 9},
        {'group': 'Dashboard', 'resource': 'voucher_count', 'action': 'read', 'description': 'View voucher count widget', 'sort_order': 10},
        {'group': 'Dashboard', 'resource': 'transport_count', 'action': 'read', 'description': 'View transport count widget', 'sort_order': 11},
        {'group': 'Dashboard', 'resource': 'hostel_count', 'action': 'read', 'description': 'View hostel count widget', 'sort_order': 12},
        {'group': 'Dashboard', 'resource': 'student_birthday', 'action': 'read', 'description': 'View student birthday wishes widget', 'sort_order': 13},
        {'group': 'Dashboard', 'resource': 'staff_birthday', 'action': 'read', 'description': 'View staff birthday wishes widget', 'sort_order': 14},
        
        # Website/CMS Permissions
        {'group': 'Website', 'resource': 'frontend_setting', 'action': 'read', 'description': 'View frontend settings', 'sort_order': 1},
        {'group': 'Website', 'resource': 'frontend_setting', 'action': 'create', 'description': 'Create frontend settings', 'sort_order': 2},
        {'group': 'Website', 'resource': 'frontend_setting', 'action': 'update', 'description': 'Edit frontend settings', 'sort_order': 3},
        {'group': 'Website', 'resource': 'frontend_setting', 'action': 'delete', 'description': 'Delete frontend settings', 'sort_order': 4},
        {'group': 'Website', 'resource': 'frontend_menu', 'action': 'read', 'description': 'View frontend menus', 'sort_order': 5},
        {'group': 'Website', 'resource': 'frontend_menu', 'action': 'create', 'description': 'Create frontend menus', 'sort_order': 6},
        {'group': 'Website', 'resource': 'frontend_menu', 'action': 'update', 'description': 'Edit frontend menus', 'sort_order': 7},
        {'group': 'Website', 'resource': 'frontend_menu', 'action': 'delete', 'description': 'Delete frontend menus', 'sort_order': 8},
        {'group': 'Website', 'resource': 'frontend_section', 'action': 'read', 'description': 'View frontend sections', 'sort_order': 9},
        {'group': 'Website', 'resource': 'frontend_section', 'action': 'create', 'description': 'Create frontend sections', 'sort_order': 10},
        {'group': 'Website', 'resource': 'frontend_section', 'action': 'update', 'description': 'Edit frontend sections', 'sort_order': 11},
        {'group': 'Website', 'resource': 'frontend_section', 'action': 'delete', 'description': 'Delete frontend sections', 'sort_order': 12},
        {'group': 'Website', 'resource': 'page', 'action': 'read', 'description': 'View pages', 'sort_order': 13},
        {'group': 'Website', 'resource': 'page', 'action': 'create', 'description': 'Create pages', 'sort_order': 14},
        {'group': 'Website', 'resource': 'page', 'action': 'update', 'description': 'Edit pages', 'sort_order': 15},
        {'group': 'Website', 'resource': 'page', 'action': 'delete', 'description': 'Delete pages', 'sort_order': 16},
        {'group': 'Website', 'resource': 'slider', 'action': 'read', 'description': 'View sliders', 'sort_order': 17},
        {'group': 'Website', 'resource': 'slider', 'action': 'create', 'description': 'Create sliders', 'sort_order': 18},
        {'group': 'Website', 'resource': 'slider', 'action': 'update', 'description': 'Edit sliders', 'sort_order': 19},
        {'group': 'Website', 'resource': 'slider', 'action': 'delete', 'description': 'Delete sliders', 'sort_order': 20},
        {'group': 'Website', 'resource': 'features', 'action': 'read', 'description': 'View features', 'sort_order': 21},
        {'group': 'Website', 'resource': 'features', 'action': 'create', 'description': 'Create features', 'sort_order': 22},
        {'group': 'Website', 'resource': 'features', 'action': 'update', 'description': 'Edit features', 'sort_order': 23},
        {'group': 'Website', 'resource': 'features', 'action': 'delete', 'description': 'Delete features', 'sort_order': 24},
        {'group': 'Website', 'resource': 'testimonial', 'action': 'read', 'description': 'View testimonials', 'sort_order': 25},
        {'group': 'Website', 'resource': 'testimonial', 'action': 'create', 'description': 'Create testimonials', 'sort_order': 26},
        {'group': 'Website', 'resource': 'testimonial', 'action': 'update', 'description': 'Edit testimonials', 'sort_order': 27},
        {'group': 'Website', 'resource': 'testimonial', 'action': 'delete', 'description': 'Delete testimonials', 'sort_order': 28},
        {'group': 'Website', 'resource': 'services', 'action': 'read', 'description': 'View services', 'sort_order': 29},
        {'group': 'Website', 'resource': 'services', 'action': 'create', 'description': 'Create services', 'sort_order': 30},
        {'group': 'Website', 'resource': 'services', 'action': 'update', 'description': 'Edit services', 'sort_order': 31},
        {'group': 'Website', 'resource': 'services', 'action': 'delete', 'description': 'Delete services', 'sort_order': 32},
        
        # Student Management
        {'group': 'Students', 'resource': 'student', 'action': 'create', 'description': 'Add new students', 'sort_order': 1},
        {'group': 'Students', 'resource': 'student', 'action': 'read', 'description': 'View student records', 'sort_order': 2},
        {'group': 'Students', 'resource': 'student', 'action': 'update', 'description': 'Edit student records', 'sort_order': 3},
        {'group': 'Students', 'resource': 'student', 'action': 'delete', 'description': 'Delete student records', 'sort_order': 4},
        {'group': 'Students', 'resource': 'student', 'action': 'export', 'description': 'Export student data', 'sort_order': 5},
        {'group': 'Students', 'resource': 'student', 'action': 'import', 'description': 'Import student data', 'sort_order': 6},
        
        # Staff Management
        {'group': 'Staff', 'resource': 'staff', 'action': 'create', 'description': 'Add new staff', 'sort_order': 1},
        {'group': 'Staff', 'resource': 'staff', 'action': 'read', 'description': 'View staff records', 'sort_order': 2},
        {'group': 'Staff', 'resource': 'staff', 'action': 'update', 'description': 'Edit staff records', 'sort_order': 3},
        {'group': 'Staff', 'resource': 'staff', 'action': 'delete', 'description': 'Delete staff records', 'sort_order': 4},
        {'group': 'Staff', 'resource': 'staff', 'action': 'export', 'description': 'Export staff data', 'sort_order': 5},
        
        # Attendance
        {'group': 'Attendance', 'resource': 'attendance', 'action': 'create', 'description': 'Mark attendance', 'sort_order': 1},
        {'group': 'Attendance', 'resource': 'attendance', 'action': 'read', 'description': 'View attendance', 'sort_order': 2},
        {'group': 'Attendance', 'resource': 'attendance', 'action': 'update', 'description': 'Edit attendance', 'sort_order': 3},
        {'group': 'Attendance', 'resource': 'attendance', 'action': 'delete', 'description': 'Delete attendance', 'sort_order': 4},
        {'group': 'Attendance', 'resource': 'attendance', 'action': 'export', 'description': 'Export attendance reports', 'sort_order': 5},
        
        # Fees Management
        {'group': 'Fees', 'resource': 'fee', 'action': 'create', 'description': 'Create fee records', 'sort_order': 1},
        {'group': 'Fees', 'resource': 'fee', 'action': 'read', 'description': 'View fee records', 'sort_order': 2},
        {'group': 'Fees', 'resource': 'fee', 'action': 'update', 'description': 'Edit fee records', 'sort_order': 3},
        {'group': 'Fees', 'resource': 'fee', 'action': 'delete', 'description': 'Delete fee records', 'sort_order': 4},
        {'group': 'Fees', 'resource': 'fee_payment', 'action': 'create', 'description': 'Collect fee payments', 'sort_order': 5},
        {'group': 'Fees', 'resource': 'fee_payment', 'action': 'read', 'description': 'View payment history', 'sort_order': 6},
        {'group': 'Fees', 'resource': 'fee', 'action': 'export', 'description': 'Export fee reports', 'sort_order': 7},
        
        # Exams
        {'group': 'Exams', 'resource': 'exam', 'action': 'create', 'description': 'Create exams', 'sort_order': 1},
        {'group': 'Exams', 'resource': 'exam', 'action': 'read', 'description': 'View exams', 'sort_order': 2},
        {'group': 'Exams', 'resource': 'exam', 'action': 'update', 'description': 'Edit exams', 'sort_order': 3},
        {'group': 'Exams', 'resource': 'exam', 'action': 'delete', 'description': 'Delete exams', 'sort_order': 4},
        {'group': 'Exams', 'resource': 'result', 'action': 'create', 'description': 'Enter results', 'sort_order': 5},
        {'group': 'Exams', 'resource': 'result', 'action': 'read', 'description': 'View results', 'sort_order': 6},
        {'group': 'Exams', 'resource': 'result', 'action': 'update', 'description': 'Edit results', 'sort_order': 7},
        
        # Library
        {'group': 'Library', 'resource': 'book', 'action': 'create', 'description': 'Add books', 'sort_order': 1},
        {'group': 'Library', 'resource': 'book', 'action': 'read', 'description': 'View books', 'sort_order': 2},
        {'group': 'Library', 'resource': 'book', 'action': 'update', 'description': 'Edit books', 'sort_order': 3},
        {'group': 'Library', 'resource': 'book', 'action': 'delete', 'description': 'Delete books', 'sort_order': 4},
        {'group': 'Library', 'resource': 'book_issue', 'action': 'create', 'description': 'Issue books', 'sort_order': 5},
        {'group': 'Library', 'resource': 'book_issue', 'action': 'read', 'description': 'View issued books', 'sort_order': 6},
        
        # Transport
        {'group': 'Transport', 'resource': 'route', 'action': 'create', 'description': 'Create routes', 'sort_order': 1},
        {'group': 'Transport', 'resource': 'route', 'action': 'read', 'description': 'View routes', 'sort_order': 2},
        {'group': 'Transport', 'resource': 'route', 'action': 'update', 'description': 'Edit routes', 'sort_order': 3},
        {'group': 'Transport', 'resource': 'route', 'action': 'delete', 'description': 'Delete routes', 'sort_order': 4},
        {'group': 'Transport', 'resource': 'vehicle', 'action': 'create', 'description': 'Add vehicles', 'sort_order': 5},
        {'group': 'Transport', 'resource': 'vehicle', 'action': 'read', 'description': 'View vehicles', 'sort_order': 6},
        {'group': 'Transport', 'resource': 'vehicle', 'action': 'update', 'description': 'Edit vehicles', 'sort_order': 7},
        
        # Hostel
        {'group': 'Hostel', 'resource': 'hostel', 'action': 'create', 'description': 'Create hostel', 'sort_order': 1},
        {'group': 'Hostel', 'resource': 'hostel', 'action': 'read', 'description': 'View hostel', 'sort_order': 2},
        {'group': 'Hostel', 'resource': 'hostel', 'action': 'update', 'description': 'Edit hostel', 'sort_order': 3},
        {'group': 'Hostel', 'resource': 'hostel', 'action': 'delete', 'description': 'Delete hostel', 'sort_order': 4},
        {'group': 'Hostel', 'resource': 'room', 'action': 'create', 'description': 'Create rooms', 'sort_order': 5},
        {'group': 'Hostel', 'resource': 'room', 'action': 'read', 'description': 'View rooms', 'sort_order': 6},
        
        # HR & Payroll
        {'group': 'HR', 'resource': 'payroll', 'action': 'create', 'description': 'Process payroll', 'sort_order': 1},
        {'group': 'HR', 'resource': 'payroll', 'action': 'read', 'description': 'View payroll', 'sort_order': 2},
        {'group': 'HR', 'resource': 'payroll', 'action': 'update', 'description': 'Edit payroll', 'sort_order': 3},
        {'group': 'HR', 'resource': 'leave', 'action': 'create', 'description': 'Apply leave', 'sort_order': 4},
        {'group': 'HR', 'resource': 'leave', 'action': 'read', 'description': 'View leave', 'sort_order': 5},
        {'group': 'HR', 'resource': 'leave', 'action': 'update', 'description': 'Approve/Reject leave', 'sort_order': 6},
        
        # Inventory
        {'group': 'Inventory', 'resource': 'item', 'action': 'create', 'description': 'Add items', 'sort_order': 1},
        {'group': 'Inventory', 'resource': 'item', 'action': 'read', 'description': 'View items', 'sort_order': 2},
        {'group': 'Inventory', 'resource': 'item', 'action': 'update', 'description': 'Edit items', 'sort_order': 3},
        {'group': 'Inventory', 'resource': 'item', 'action': 'delete', 'description': 'Delete items', 'sort_order': 4},
        {'group': 'Inventory', 'resource': 'stock', 'action': 'create', 'description': 'Update stock', 'sort_order': 5},
        {'group': 'Inventory', 'resource': 'stock', 'action': 'read', 'description': 'View stock', 'sort_order': 6},
        
        # Reports
        {'group': 'Reports', 'resource': 'report', 'action': 'read', 'description': 'View reports', 'sort_order': 1},
        {'group': 'Reports', 'resource': 'report', 'action': 'export', 'description': 'Export reports', 'sort_order': 2},
        {'group': 'Reports', 'resource': 'analytics', 'action': 'read', 'description': 'View analytics', 'sort_order': 3},
        
        # System Settings
        {'group': 'Settings', 'resource': 'role', 'action': 'create', 'description': 'Create roles', 'sort_order': 1},
        {'group': 'Settings', 'resource': 'role', 'action': 'read', 'description': 'View roles', 'sort_order': 2},
        {'group': 'Settings', 'resource': 'role', 'action': 'update', 'description': 'Edit roles', 'sort_order': 3},
        {'group': 'Settings', 'resource': 'role', 'action': 'delete', 'description': 'Delete roles', 'sort_order': 4},
        {'group': 'Settings', 'resource': 'permission', 'action': 'read', 'description': 'View permissions', 'sort_order': 5},
        {'group': 'Settings', 'resource': 'system_setting', 'action': 'read', 'description': 'View system settings', 'sort_order': 6},
        {'group': 'Settings', 'resource': 'system_setting', 'action': 'update', 'description': 'Edit system settings', 'sort_order': 7},
        
        # Communication
        {'group': 'Communication', 'resource': 'notification', 'action': 'create', 'description': 'Send notifications', 'sort_order': 1},
        {'group': 'Communication', 'resource': 'notification', 'action': 'read', 'description': 'View notifications', 'sort_order': 2},
        {'group': 'Communication', 'resource': 'sms', 'action': 'create', 'description': 'Send SMS', 'sort_order': 3},
        {'group': 'Communication', 'resource': 'email', 'action': 'create', 'description': 'Send emails', 'sort_order': 4},
    ]
    
    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding permissions...'))
        
        created_count = 0
        updated_count = 0
        
        for perm_data in self.PERMISSIONS:
            permission, created = Permission.objects.update_or_create(
                resource=perm_data['resource'],
                action=perm_data['action'],
                defaults={
                    'group': perm_data['group'],
                    'description': perm_data['description'],
                    'sort_order': perm_data['sort_order'],
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'   Created: {permission.code}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'   Updated: {permission.code}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted! Created: {created_count}, Updated: {updated_count}'
            )
        )
