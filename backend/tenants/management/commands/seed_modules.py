from django.core.management.base import BaseCommand
from django.conf import settings
import os
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Seed multiple modules (students, staff, fees, idcards, library) for a tenant'

    def add_arguments(self, parser):
        parser.add_argument('--subdomain', type=str, default='nms', help='Tenant subdomain')
        parser.add_argument('--students', type=int, default=10, help='Number of students to create')
        parser.add_argument('--staff', type=int, default=5, help='Number of staff to create')

    def handle(self, *args, **options):
        subdomain = options['subdomain']
        students_count = options['students']
        staff_count = options['staff']

        from tenants.models import Tenant, AcademicYear

        try:
            tenant = Tenant.objects.get(subdomain=subdomain)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Tenant {subdomain} not found. Run seed_tenant first.'))
            return

        # Academic year
        today = date.today()
        ay_name = f"{today.year}-{today.year+1}"
        ay, _ = AcademicYear.objects.get_or_create(
            tenant=tenant,
            name=ay_name,
            defaults={
                'start_date': today.replace(month=4, day=1) if today.month >=4 else date(today.year-1,4,1),
                'end_date': date(today.year+1,3,31),
                'is_active': True,
            }
        )

        # Students
        from students.models import Student
        media_root = settings.MEDIA_ROOT
        students_created = []
        for i in range(1, students_count + 1):
            adm = f"{subdomain.upper()}-STU-{i:03d}"
            student, created = Student.objects.get_or_create(
                tenant=tenant,
                admission_number=adm,
                defaults={
                    'admission_date': today - timedelta(days=30*i),
                    'first_name': f'Student{i}',
                    'last_name': 'Demo',
                    'date_of_birth': date(2015, 1, 1) + timedelta(days=365*i%2000),
                    'gender': 'M' if i % 2 == 1 else 'F',
                    'email': f'student{i}@{subdomain}.local',
                    'phone': f'9000000{i:03d}',
                    'address': 'Demo Address',
                    'father_name': 'Father',
                    'father_phone': '9000000000',
                    'mother_name': 'Mother',
                }
            )
            students_created.append(student)

        self.stdout.write(self.style.SUCCESS(f'Created/verified {len(students_created)} students'))

        # Staff
        from staff.models import Staff
        staff_created = []
        for i in range(1, staff_count + 1):
            emp = f"{subdomain.upper()}-STF-{i:03d}"
            s, created = Staff.objects.get_or_create(
                tenant=tenant,
                employee_id=emp,
                defaults={
                    'first_name': f'Staff{i}',
                    'last_name': 'Demo',
                    'designation': 'TEACHER',
                    'joining_date': today - timedelta(days=365*i),
                    'email': f'staff{i}@{subdomain}.local',
                }
            )
            staff_created.append(s)

        self.stdout.write(self.style.SUCCESS(f'Created/verified {len(staff_created)} staff'))

        # Fees: category, structure, allocation, invoice, transaction
        try:
            from fees.models import FeeCategory, FeeStructure, FeeAllocation, FeeInvoice, FeeInvoiceItem, FeeTransaction
            cat, _ = FeeCategory.objects.get_or_create(tenant=tenant, code='TUITION', defaults={'name': 'Tuition'})
            struct, _ = FeeStructure.objects.get_or_create(
                tenant=tenant,
                academic_year=ay,
                class_level='Grade 1',
                category=cat,
                defaults={'amount': 5000.00, 'frequency': 'MONTHLY'}
            )

            allocations = []
            for stu in students_created[:5]:
                alloc, _ = FeeAllocation.objects.get_or_create(tenant=tenant, student=stu, fee_structure=struct)
                allocations.append(alloc)

            # Invoice for first student
            if students_created:
                stu = students_created[0]
                inv_num = f"INV-{subdomain.upper()}-001"
                inv, created = FeeInvoice.objects.get_or_create(
                    tenant=tenant,
                    invoice_number=inv_num,
                    defaults={
                        'student': stu,
                        'academic_year': ay,
                        'invoice_date': today,
                        'due_date': today + timedelta(days=15),
                        'total_amount': struct.amount,
                        'paid_amount': 0,
                        'balance_amount': struct.amount,
                    }
                )
                if created:
                    # add item
                    FeeInvoiceItem.objects.create(invoice=inv, fee_allocation=allocations[0], description='Tuition Fee', amount=struct.amount)
                    # create a partial transaction
                    FeeTransaction.objects.create(tenant=tenant, invoice=inv, transaction_number=f'TXN-{inv_num}', amount=2000.00, payment_mode='CASH')
                    inv.paid_amount = 2000.00
                    inv.update_status()

        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Fees seeding skipped/failed: {e}'))

        # Library: add book, copy, member, issue
        try:
            from library.models import Book, BookCopy, LibraryMember, BookIssue
            book, _ = Book.objects.get_or_create(tenant=tenant, title='Intro to Mathematics', defaults={'author': 'Author A', 'category': 'Math', 'shelf_location': 'A1', 'total_copies': 1, 'available_copies': 1})
            copy, _ = BookCopy.objects.get_or_create(tenant=tenant, book=book, barcode=f'{subdomain}-BC-001', defaults={'price': 100.00})

            if students_created:
                member, _ = LibraryMember.objects.get_or_create(tenant=tenant, student=students_created[0], defaults={'member_type': 'STUDENT'})
                issue, _ = BookIssue.objects.get_or_create(tenant=tenant, copy=copy, member=member, defaults={'due_date': date.today() + timedelta(days=14)})

        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Library seeding skipped/failed: {e}'))

        # ID Cards: template and design
        try:
            from idcards.models import IDCardTemplate, IDCardDesign, IDCardGeneration
            tpl, _ = IDCardTemplate.objects.get_or_create(tenant=tenant, name='Default Student Card', defaults={'card_type': 'STUDENT', 'orientation': 'VERTICAL', 'design_json': {'bg':'#1976D2'}, 'is_global': False})
            design, _ = IDCardDesign.objects.get_or_create(tenant=tenant, name='NMS Default', defaults={'card_type': 'STUDENT', 'orientation': 'VERTICAL', 'design_json': {'logo': tenant.branding.logo_url if hasattr(tenant,'branding') else ''}})
            gen, _ = IDCardGeneration.objects.get_or_create(tenant=tenant, design=design, defaults={'card_type': 'STUDENT', 'filters': {}, 'total_cards': len(students_created), 'status': 'PENDING'})
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'IDCards seeding skipped/failed: {e}'))

        self.stdout.write(self.style.SUCCESS('Module seeding complete'))
