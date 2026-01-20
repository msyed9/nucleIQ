"""
Django management command to seed comprehensive demo data.
Run with: python manage.py seed_demo_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds comprehensive demo data for the school tenant'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🚀 Starting Comprehensive Demo Data Seeding...'))

        # Import models here to avoid app-not-ready issues
        from tenants.models import Tenant, AcademicYear, Department, GradeLevel, Section
        from staff.models import Staff, StaffAttendance
        from students.models import Student, StudentEnrollment
        from fees.models import FeeCategory, FeeStructure, FeeAllocation, FeeInvoice, FeeInvoiceItem
        from inventory.models import ItemCategory, Vendor, Item, StockTransaction
        from users.models import Role

        # 1. Get Tenant
        tenant = Tenant.objects.filter(subdomain='school').first()
        if not tenant:
            self.stdout.write(self.style.ERROR("No 'school' tenant found. Please create it first."))
            return
        self.stdout.write(f"Using Tenant: {tenant.name}")

        # 2. Academic Year
        AcademicYear.objects.filter(tenant=tenant).update(is_active=False)
        ay, created = AcademicYear.objects.update_or_create(
            tenant=tenant,
            name='2024-2025',
            defaults={
                'start_date': date(2024, 4, 1),
                'end_date': date(2025, 3, 31),
                'is_active': True,
            }
        )
        self.stdout.write(f"Academic Year: {ay.name} {'(created)' if created else '(exists)'}")

        # 3. Department - Use existing or create
        dept = Department.objects.filter(tenant=tenant).first()
        if not dept:
            dept = Department.objects.create(
                tenant=tenant, code='ACAD', name='Academics', description='Academic Staff'
            )
        self.stdout.write(f"Department: {dept.name}")

        # 4. Grade Levels & Sections - Use existing or create new
        sections = []
        existing_grades = list(GradeLevel.objects.filter(tenant=tenant)[:5])
        if existing_grades:
            for grade in existing_grades:
                sec = Section.objects.filter(tenant=tenant, grade_level=grade).first()
                if sec:
                    sections.append((grade, sec))
            self.stdout.write(f"Using {len(sections)} existing Grades & Sections")
        else:
            for g_num in range(1, 6):
                grade = GradeLevel.objects.create(
                    tenant=tenant, name=f'Grade {g_num}', short_name=str(g_num), 
                    display_order=g_num, description=f'Grade {g_num}', department=dept
                )
                sec = Section.objects.create(
                    tenant=tenant, grade_level=grade, name='A', 
                    capacity=40, room_number=f'R-{g_num}A', display_order=1
                )
                sections.append((grade, sec))
            self.stdout.write(f"Created {len(sections)} Grades & Sections")

        # 5. Staff (5 teachers)
        staff_members = []
        for i in range(1, 6):
            email = f"teacher{i}@school.nucleiq.com"
            user, u_created = User.objects.update_or_create(
                email=email,
                defaults={'first_name': f'Teacher{i}', 'last_name': 'Demo', 'tenant': tenant, 'is_staff': True}
            )
            if u_created:
                user.set_password('admin123')
                user.save()

            staff, _ = Staff.objects.update_or_create(
                tenant=tenant,
                employee_id=f'T{str(i).zfill(3)}',
                defaults={
                    'user': user,
                    'first_name': f'Teacher{i}',
                    'last_name': 'Demo',
                    'designation': 'TEACHER',
                    'department': dept,
                    'joining_date': date(2024, 1, 1),
                    'status': 'ACTIVE',
                }
            )
            staff_members.append(staff)
        self.stdout.write(f"Staff seeded: {len(staff_members)}")

        # 6. Students (4 per section = 20 total) - Use raw SQL to bypass model issues
        from django.db import connection
        import uuid as uuid_module
        students_created = 0
        for grade, sec in sections:
            for i in range(1, 5):
                adm_no = f"S-{grade.short_name}-{sec.name}-{i}"
                with connection.cursor() as cursor:
                    cursor.execute(f"SELECT id FROM students WHERE tenant_id = %s AND admission_number = %s", [str(tenant.id), adm_no])
                    row = cursor.fetchone()
                    if not row:
                        stu_id = str(uuid_module.uuid4())
                        cursor.execute("""
                            INSERT INTO students (id, tenant_id, admission_number, first_name, last_name, date_of_birth,
                                gender, admission_date, is_active, is_deleted, created_at, updated_at,
                                blood_group, email, phone, address, father_name, father_phone, father_email,
                                father_occupation, mother_name, mother_phone, mother_email, mother_occupation,
                                guardian_name, guardian_phone, guardian_relation, family_id, notes,
                                aadhar_number, aapar_number, pen_number)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true, false, now(), now(),
                                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '')
                        """, [stu_id, str(tenant.id), adm_no, f'Student{i}', f'Grade{grade.short_name}',
                              date(2015 - int(grade.short_name), 1, max(1, i)), random.choice(['M', 'F']), date(2024, 4, 1)])
                        
                        # Enrollment
                        enr_id = str(uuid_module.uuid4())
                        cursor.execute("""
                            INSERT INTO student_enrollments (id, tenant_id, student_id, academic_year_id, section_id,
                                roll_number, status, enrollment_date, exit_reason, is_deleted, created_at, updated_at,
                                total_days, present_days, absent_days, final_grade, notes)
                            VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE', %s, '', false, now(), now(), 0, 0, 0, '', '')
                        """, [enr_id, str(tenant.id), stu_id, str(ay.id), str(sec.id), str(i), date(2024, 4, 1)])
                        students_created += 1
        self.stdout.write(f"Students seeded: {students_created} new")

        # 7. Staff Attendance (last 10 days)
        att_count = 0
        for staff in staff_members:
            for i in range(10):
                d = date.today() - timedelta(days=i)
                if d.weekday() < 5:  # Only weekdays
                    _, created = StaffAttendance.objects.get_or_create(
                        tenant=tenant,
                        staff=staff,
                        date=d,
                        defaults={'status': 'PRESENT', 'check_in_time': '09:00:00'}
                    )
                    if created:
                        att_count += 1
        self.stdout.write(f"Staff Attendance: {att_count} records")

        # 8. Fee Category & Structure
        fee_cat, _ = FeeCategory.objects.update_or_create(
            tenant=tenant,
            code='TUIT',
            defaults={'name': 'Tuition Fee', 'description': 'Monthly Tuition Fee'}
        )
        for grade, _ in sections:
            FeeStructure.objects.update_or_create(
                tenant=tenant,
                academic_year=ay,
                class_level=grade.name,
                category=fee_cat,
                defaults={'amount': Decimal('5000.00'), 'frequency': 'MONTHLY'}
            )
        self.stdout.write("Fee Structures seeded")

        # 9. Inventory
        inv_cat, _ = ItemCategory.objects.update_or_create(
            tenant=tenant,
            name='Stationery',
            defaults={'description': 'Stationery items for school store'}
        )
        vendor, _ = Vendor.objects.update_or_create(
            tenant=tenant,
            name='Main Supplier',
            defaults={'contact_person': 'Mr. Vendor'}
        )
        items_data = [
            ('Notebook', 50.00, 30.00, 200),
            ('Blue Pen', 10.00, 5.00, 500),
            ('Pencil', 5.00, 2.50, 300),
            ('Eraser', 8.00, 4.00, 200),
            ('Ruler', 20.00, 10.00, 100),
        ]
        for name, price, cost, stock in items_data:
            item, created = Item.objects.update_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'category': inv_cat,
                    'unit': 'PCS',
                    'price': Decimal(str(price)),
                    'cost_price': Decimal(str(cost)),
                    'current_stock': stock,
                    'preferred_vendor': vendor,
                }
            )
            if created:
                StockTransaction.objects.create(
                    tenant=tenant,
                    item=item,
                    transaction_type='GRN',
                    quantity=stock,
                    unit_price=Decimal(str(cost)),
                    notes='Initial stock seeding'
                )
        self.stdout.write("Inventory seeded")

        self.stdout.write(self.style.SUCCESS('\n🏁 Comprehensive Demo Data Seeding Completed!'))
