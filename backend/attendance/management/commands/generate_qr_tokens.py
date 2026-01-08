from django.core.management.base import BaseCommand
from datetime import date
import uuid
from attendance.models import QRCodeToken
from students.models import Student
from staff.models import Staff
from tenants.models import Tenant


class Command(BaseCommand):
    help = 'Generate QR code tokens for students and staff'

    def add_arguments(self, parser):
        parser.add_argument('--students', action='store_true', help='Generate tokens for all students')
        parser.add_argument('--staff', action='store_true', help='Generate tokens for all staff')
        parser.add_argument('--tenant', type=str, help='Tenant slug')

    def handle(self, *args, **options):
        tenant_slug = options.get('tenant')
        
        if not tenant_slug:
            self.stdout.write(self.style.ERROR('Please provide --tenant parameter'))
            return
        
        try:
            tenant = Tenant.objects.get(slug=tenant_slug)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Tenant {tenant_slug} not found'))
            return
        
        if options['students']:
            students = Student.objects.filter(tenant=tenant, is_active=True)
            count = 0
            for student in students:
                token, created = QRCodeToken.objects.get_or_create(
                    tenant=tenant,
                    student=student,
                    valid_date=date.today(),
                    defaults={'token': str(uuid.uuid4()), 'is_active': True}
                )
                if created:
                    count += 1
            self.stdout.write(self.style.SUCCESS(f'Created {count} student QR tokens'))
        
        if options['staff']:
            staff_members = Staff.objects.filter(tenant=tenant, is_active=True)
            count = 0
            for staff in staff_members:
                token, created = QRCodeToken.objects.get_or_create(
                    tenant=tenant,
                    teacher=staff,
                    valid_date=date.today(),
                    defaults={'token': str(uuid.uuid4()), 'is_active': True}
                )
                if created:
                    count += 1
            self.stdout.write(self.style.SUCCESS(f'Created {count} staff QR tokens'))
