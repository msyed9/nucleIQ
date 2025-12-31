"""
Django Management Command to Populate Dummy Data for Demo School
Populates all modules with realistic dummy data for testing and demonstration
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import datetime, date, timedelta
from decimal import Decimal
import random

# Import all models
from tenants.models import Tenant, AcademicYear, GradeLevel, Section, Subject, Department
from users.models import User
from students.models import Student, StudentEnrollment, StudentRemark, StudentHealthRecord
from staff.models import Staff, StaffAttendance, StaffLeave
from attendance.models import AttendanceRecord
from fees.models import FeeStructure, FeeCategory, FeeInvoice, FeeTransaction
from finance.models import PettyCashRequest


class Command(BaseCommand):
    help = 'Populate dummy data for Demo School across all modules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            default='demo',
            help='Tenant subdomain (default: demo)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating'
        )

    def handle(self, *args, **options):
        tenant_subdomain = options['tenant']
        clear_data = options['clear']

        self.stdout.write(self.style.WARNING(f'\n🚀 Starting dummy data population for tenant: {tenant_subdomain}\n'))

        try:
            tenant = Tenant.objects.get(subdomain=tenant_subdomain)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ Tenant "{tenant_subdomain}" not found!'))
            return

        if clear_data:
            self.stdout.write(self.style.WARNING('⚠️  Clearing existing data...'))
            self.clear_tenant_data(tenant)

        # 1. Academic Structure
        self.stdout.write(self.style.SUCCESS('\n📚 Creating Academic Structure...'))
        academic_year = self.create_academic_year(tenant)
        departments = self.create_departments(tenant)
        subjects = self.create_subjects(tenant)
        grade_levels, sections = self.create_grade_sections(tenant, academic_year)

        # 2. Users & Staff
        self.stdout.write(self.style.SUCCESS('\n👥 Creating Staff & Users...'))
        admin_user, staff_members = self.create_staff(tenant, departments, subjects)

        # 3. Students
        self.stdout.write(self.style.SUCCESS('\n👨‍🎓 Creating Students...'))
        students = self.create_students(tenant, sections, academic_year)

        # 4. Attendance
        self.stdout.write(self.style.SUCCESS('\n📅 Creating Attendance Records...'))
        self.create_student_attendance(tenant, students, academic_year)
        self.create_staff_attendance(tenant, staff_members)

        # 5. Fees
        self.stdout.write(self.style.SUCCESS('\n💰 Creating Fee Structure & Collections...'))
        self.create_fee_structure(tenant, grade_levels, academic_year)
        self.create_fee_collections(tenant, students, academic_year)

        # 6. Finance
        self.stdout.write(self.style.SUCCESS('\n💵 Creating Finance Records...'))
        self.create_petty_cash_requests(tenant, staff_members, admin_user)

        # 7. Student Remarks & Health
        self.stdout.write(self.style.SUCCESS('\n📝 Creating Student Remarks & Health Records...'))
        self.create_student_remarks(students, staff_members)
        self.create_health_records(students)

        # 8. Staff Leaves
        self.stdout.write(self.style.SUCCESS('\n🏖️  Creating Staff Leave Applications...'))
        self.create_staff_leaves(tenant, staff_members, admin_user)

        self.stdout.write(self.style.SUCCESS('\n\n✅ Dummy data population completed successfully!\n'))
        self.print_summary(tenant)

    def clear_tenant_data(self, tenant):
        """Clear all existing data for the tenant"""
        Student.objects.filter(tenant=tenant).delete()
        Staff.objects.filter(tenant=tenant).delete()
        FeeCategory.objects.filter(tenant=tenant).delete()
        FeeStructure.objects.filter(tenant=tenant).delete()
        Section.objects.filter(tenant=tenant).delete()
        GradeLevel.objects.filter(tenant=tenant).delete()
        Subject.objects.filter(tenant=tenant).delete()
        Department.objects.filter(tenant=tenant).delete()
        AcademicYear.objects.filter(tenant=tenant).delete()
        self.stdout.write(self.style.WARNING('   Data cleared!'))

    def create_academic_year(self, tenant):
        """Create current academic year"""
        academic_year, created = AcademicYear.objects.update_or_create(
            tenant=tenant,
            name='2024-2025',
            defaults={
                'start_date': date(2024, 4, 1),
                'end_date': date(2025, 3, 31),
                'is_active': True
            }
        )
        self.stdout.write(f'   ✓ Academic Year: {academic_year.name}')
        return academic_year

    def create_departments(self, tenant):
        """Create school departments"""
        dept_names = [
            'Science', 'Mathematics', 'English', 'Social Studies',
            'Languages', 'Arts', 'Physical Education', 'Administration'
        ]
        departments = []
        for name in dept_names:
            dept, _ = Department.objects.update_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'code': name[:3].upper(),
                    'description': f'{name} Department'
                }
            )
            departments.append(dept)
        self.stdout.write(f'   ✓ Created {len(departments)} departments')
        return departments

    def create_subjects(self, tenant):
        """Create subjects"""
        subject_names = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology',
            'English', 'Hindi', 'Social Studies', 'Computer Science',
            'Physical Education', 'Art', 'Music'
        ]
        subjects = []
        for name in subject_names:
            subj, _ = Subject.objects.update_or_create(
                tenant=tenant,
                code=name[:3].upper(),
                defaults={'name': name}
            )
            subjects.append(subj)
        self.stdout.write(f'   ✓ Created {len(subjects)} subjects')
        return subjects

    def create_grade_sections(self, tenant, academic_year):
        """Create grade levels and sections"""
        grade_levels = []
        sections = []

        for grade_num in range(1, 13):  # Grades 1-12
            grade, _ = GradeLevel.objects.update_or_create(
                tenant=tenant,
                name=f'Grade {grade_num}',
                defaults={
                    'short_name': str(grade_num),
                    'display_order': grade_num,
                    'description': f'Grade {grade_num} - Standard curriculum'
                }
            )
            grade_levels.append(grade)

            # Create sections A, B, C for each grade
            for section_name in ['A', 'B', 'C']:
                section, _ = Section.objects.update_or_create(
                    tenant=tenant,
                    grade_level=grade,
                    name=section_name,
                    defaults={
                        'capacity': 40
                    }
                )
                sections.append(section)

        self.stdout.write(f'   ✓ Created {len(grade_levels)} grades with {len(sections)} sections')
        return grade_levels, sections

    def create_staff(self, tenant, departments, subjects):
        """Create staff members"""
        # Create admin user
        admin_user, created = User.objects.update_or_create(
            email='admin@demo.nucleiq.com',
            tenant=tenant,
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()

        staff_data = [
            {'first_name': 'Dr. Rajesh', 'last_name': 'Kumar', 'designation': 'PRINCIPAL', 'dept': 'Administration'},
            {'first_name': 'Mrs. Priya', 'last_name': 'Sharma', 'designation': 'VICE_PRINCIPAL', 'dept': 'Administration'},
            {'first_name': 'Mr. Amit', 'last_name': 'Verma', 'designation': 'TEACHER', 'dept': 'Mathematics'},
            {'first_name': 'Ms. Sneha', 'last_name': 'Patel', 'designation': 'TEACHER', 'dept': 'Science'},
            {'first_name': 'Mr. Rahul', 'last_name': 'Singh', 'designation': 'TEACHER', 'dept': 'English'},
            {'first_name': 'Mrs. Kavita', 'last_name': 'Reddy', 'designation': 'TEACHER', 'dept': 'Social Studies'},
            {'first_name': 'Mr. Suresh', 'last_name': 'Nair', 'designation': 'TEACHER', 'dept': 'Science'},
            {'first_name': 'Ms. Anjali', 'last_name': 'Gupta', 'designation': 'TEACHER', 'dept': 'Languages'},
            {'first_name': 'Mr. Vikram', 'last_name': 'Joshi', 'designation': 'LIBRARIAN', 'dept': 'Administration'},
            {'first_name': 'Mrs. Meera', 'last_name': 'Desai', 'designation': 'COUNSELOR', 'dept': 'Administration'},
            {'first_name': 'Mr. Arun', 'last_name': 'Pillai', 'designation': 'ACCOUNTANT', 'dept': 'Administration'},
            {'first_name': 'Ms. Pooja', 'last_name': 'Iyer', 'designation': 'CLERK', 'dept': 'Administration'},
        ]

        staff_members = []
        for idx, data in enumerate(staff_data, 1):
            dept = next((d for d in departments if d.name == data['dept']), departments[0])
            
            staff, created = Staff.objects.update_or_create(
                tenant=tenant,
                employee_id=f'EMP{idx:03d}',
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'designation': data['designation'],
                    'department': dept,
                    'email': f"{data['first_name'].lower().replace(' ', '')}.{data['last_name'].lower()}@demo.nucleiq.com",
                    'phone': f'+91-98765{idx:05d}',
                    'joining_date': date(2020 + (idx % 5), random.randint(1, 12), random.randint(1, 28)),
                    'status': 'ACTIVE',
                    'employment_type': 'PERMANENT',
                    'salary': Decimal(random.randint(30000, 80000)),
                    'gender': random.choice(['MALE', 'FEMALE']),
                    'date_of_birth': date(1970 + idx, random.randint(1, 12), random.randint(1, 28)),
                    'address': f'{idx} MG Road, Demo City',
                    'blood_group': random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
                    'experience_years': Decimal(random.randint(2, 20))
                }
            )
            
            # Assign subjects for teachers
            if data['designation'] in ['TEACHER', 'HEAD_TEACHER']:
                staff.subjects_taught.add(random.choice(subjects))
            
            staff_members.append(staff)

        self.stdout.write(f'   ✓ Created {len(staff_members)} staff members')
        return admin_user, staff_members

    def create_students(self, tenant, sections, academic_year):
        """Create students across all sections"""
        first_names = [
            'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan',
            'Ananya', 'Diya', 'Pari', 'Sara', 'Aadhya', 'Kiara', 'Navya', 'Saanvi',
            'Riya', 'Ishaan', 'Kabir', 'Reyansh', 'Shaurya', 'Atharv', 'Krishna', 'Advait'
        ]
        last_names = [
            'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Gupta',
            'Joshi', 'Desai', 'Iyer', 'Pillai', 'Rao', 'Mehta', 'Shah', 'Agarwal'
        ]

        students = []
        admission_counter = 1

        for section in sections:
            # Create 25-35 students per section
            num_students = random.randint(25, 35)
            
            for i in range(num_students):
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                
                # Calculate age based on grade
                grade_num = section.grade_level.display_order
                birth_year = datetime.now().year - (5 + grade_num)
                
                student, created = Student.objects.update_or_create(
                    tenant=tenant,
                    admission_number=f'ADM{admission_counter:04d}',
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'admission_date': date(birth_year + 5, random.randint(4, 6), random.randint(1, 28)),
                        'date_of_birth': date(birth_year, random.randint(1, 12), random.randint(1, 28)),
                        'gender': random.choice(['M', 'F']),
                        'blood_group': random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
                        'email': f'{first_name.lower()}.{last_name.lower()}{admission_counter}@student.demo.com',
                        'phone': f'+91-98765{admission_counter:05d}',
                        'address': f'{admission_counter} Student Colony, Demo City, State - 123456',
                        'father_name': f'Mr. {last_name}',
                        'father_phone': f'+91-98765{admission_counter:05d}',
                        'father_email': f'{last_name.lower()}.father{admission_counter}@email.com',
                        'father_occupation': random.choice(['Engineer', 'Doctor', 'Teacher', 'Businessman', 'Government Employee']),
                        'mother_name': f'Mrs. {last_name}',
                        'mother_phone': f'+91-98766{admission_counter:05d}',
                        'mother_email': f'{last_name.lower()}.mother{admission_counter}@email.com',
                        'mother_occupation': random.choice(['Teacher', 'Doctor', 'Homemaker', 'Engineer', 'Nurse']),
                        'is_active': True,
                        'family_id': f'FAM{admission_counter // 3:04d}' if random.random() > 0.7 else ''  # 30% have siblings
                    }
                )
                
                if created:
                    # Create enrollment
                    StudentEnrollment.objects.create(
                        tenant=tenant,
                        student=student,
                        academic_year=academic_year,
                        section=section,
                        roll_number=str(i + 1),
                        status='ACTIVE',
                        enrollment_date=academic_year.start_date,
                        total_days=random.randint(150, 200),
                        present_days=random.randint(130, 190),
                        absent_days=random.randint(5, 20)
                    )
                    
                    students.append(student)
                    admission_counter += 1

        self.stdout.write(f'   ✓ Created {len(students)} students with enrollments')
        return students

    def create_student_attendance(self, tenant, students, academic_year):
        """Create attendance records for last 30 days"""
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        attendance_count = 0
        current_date = start_date
        
        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                for student in random.sample(students, min(len(students), 200)):  # Sample to avoid too many records
                    AttendanceRecord.objects.update_or_create(
                        tenant=tenant,
                        student=student,
                        date=current_date,
                        record_type='STUDENT',
                        academic_year=academic_year,
                        defaults={
                            'status': random.choices(
                                ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'],
                                weights=[85, 5, 7, 3]
                            )[0],
                            'method': 'MANUAL',
                            'remarks': ''
                        }
                    )
                    attendance_count += 1
            
            current_date += timedelta(days=1)
        
        self.stdout.write(f'   ✓ Created {attendance_count} student attendance records')

    def create_staff_attendance(self, tenant, staff_members):
        """Create staff attendance for last 30 days"""
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        attendance_count = 0
        current_date = start_date
        
        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() < 5:
                for staff in staff_members:
                    StaffAttendance.objects.update_or_create(
                        tenant=tenant,
                        staff=staff,
                        date=current_date,
                        defaults={
                            'status': random.choices(
                                ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'],
                                weights=[90, 2, 3, 5]
                            )[0],
                            'check_in_time': datetime.strptime('09:00', '%H:%M').time() if random.random() > 0.1 else None,
                            'check_out_time': datetime.strptime('17:00', '%H:%M').time() if random.random() > 0.1 else None
                        }
                    )
                    attendance_count += 1
            
            current_date += timedelta(days=1)
        
        self.stdout.write(f'   ✓ Created {attendance_count} staff attendance records')

    def create_fee_structure(self, tenant, grade_levels, academic_year):
        """Create fee structure for all grades"""
        categories = [
            {'name': 'Tuition Fee', 'code': 'TUITION'},
            {'name': 'Development Fee', 'code': 'DEV'},
            {'name': 'Transport Fee', 'code': 'TRANSPORT'},
            {'name': 'Library Fee', 'code': 'LIBRARY'},
            {'name': 'Lab Fee', 'code': 'LAB'},
            {'name': 'Sports Fee', 'code': 'SPORTS'},
        ]
        
        fee_categories = []
        for cat in categories:
            fc, _ = FeeCategory.objects.update_or_create(
                tenant=tenant,
                code=cat['code'],
                defaults={'name': cat['name'], 'description': f'{cat["name"]} for students'}
            )
            fee_categories.append(fc)
        
        structure_count = 0
        for grade in grade_levels:
            base_amount = 5000 + (grade.display_order * 500)  # Increases with grade
            
            for category in fee_categories:
                if category.code == 'TUITION':
                    amount = base_amount
                elif category.code == 'TRANSPORT':
                    amount = 2000
                else:
                    amount = random.randint(500, 1500)
                
                FeeStructure.objects.update_or_create(
                    tenant=tenant,
                    academic_year=academic_year,
                    class_level=grade.name,
                    category=category,
                    defaults={
                        'amount': Decimal(amount),
                        'frequency': 'MONTHLY',
                        'is_mandatory': category.code in ['TUITION', 'DEV'],
                        'due_day': 10
                    }
                )
                structure_count += 1
        
        self.stdout.write(f'   ✓ Created {structure_count} fee structures')

    def create_fee_collections(self, tenant, students, academic_year):
        """Create fee invoices and transactions"""
        invoice_count = 0
        transaction_count = 0
        
        for student in random.sample(students, min(len(students), 150)):  # Sample students
            # Create 2-3 fee invoices per student
            for month in range(1, random.randint(2, 4)):
                invoice_date = date(2024, 4 + month, 1)
                due_date = date(2024, 4 + month, 10)
                total_amount = Decimal(random.randint(8000, 15000))
                
                invoice, created = FeeInvoice.objects.update_or_create(
                    invoice_number=f'INV{student.admission_number}-{month:02d}',
                    defaults={
                        'tenant': tenant,
                        'student': student,
                        'academic_year': academic_year,
                        'invoice_date': invoice_date,
                        'due_date': due_date,
                        'total_amount': total_amount,
                        'paid_amount': Decimal(0),
                        'balance_amount': total_amount,
                        'status': 'PENDING'
                    }
                )
                
                if created:
                    invoice_count += 1
                    
                    # 70% chance of payment
                    if random.random() > 0.3:
                        payment_amount = total_amount if random.random() > 0.2 else total_amount * Decimal('0.5')
                        
                        transaction = FeeTransaction.objects.create(
                            tenant=tenant,
                            invoice=invoice,
                            transaction_number=f'TXN{random.randint(100000, 999999)}',
                            amount=payment_amount,
                            payment_mode=random.choice(['CASH', 'UPI', 'CHEQUE', 'CARD']),
                            payment_reference=f'REF{random.randint(1000, 9999)}',
                            remarks='Payment received'
                        )
                        
                        invoice.paid_amount += payment_amount
                        invoice.balance_amount = invoice.total_amount - invoice.paid_amount
                        invoice.status = 'PAID' if invoice.paid_amount >= invoice.total_amount else 'PARTIAL'
                        invoice.save()
                        transaction_count += 1
        
        self.stdout.write(f'   ✓ Created {invoice_count} fee invoices and {transaction_count} transactions')

    def create_petty_cash_requests(self, tenant, staff_members, admin_user):
        """Create petty cash requests"""
        purposes = [
            'Office Supplies', 'Maintenance Work', 'Event Expenses',
            'Transportation', 'Refreshments', 'Printing & Stationery',
            'Utility Bills', 'Miscellaneous'
        ]
        
        request_count = 0
        for _ in range(20):
            staff = random.choice(staff_members)
            
            # Skip if staff doesn't have a user account
            if not staff.user:
                continue
            
            PettyCashRequest.objects.create(
                tenant=tenant,
                requested_by=staff.user,
                amount=Decimal(random.randint(500, 5000)),
                purpose=random.choice(purposes),
                description=f'Request for {random.choice(purposes).lower()}',
                status=random.choice(['PENDING', 'APPROVED', 'APPROVED', 'REJECTED']),  # More approved
                requested_date=date.today() - timedelta(days=random.randint(1, 30)),
                approved_by=admin_user if random.random() > 0.3 else None,
                approval_date=timezone.now() - timedelta(days=random.randint(0, 20)) if random.random() > 0.3 else None
            )
            request_count += 1
        
        self.stdout.write(f'   ✓ Created {request_count} petty cash requests')

    def create_student_remarks(self, students, staff_members):
        """Create student remarks"""
        remark_templates = [
            {'type': 'POSITIVE', 'category': 'ACADEMIC', 'title': 'Excellent Performance', 'desc': 'Showed outstanding performance in recent test'},
            {'type': 'POSITIVE', 'category': 'BEHAVIORAL', 'title': 'Good Behavior', 'desc': 'Displayed exemplary behavior in class'},
            {'type': 'ACHIEVEMENT', 'category': 'ACADEMIC', 'title': 'Competition Winner', 'desc': 'Won first prize in science competition'},
            {'type': 'NEUTRAL', 'category': 'GENERAL', 'title': 'Parent Meeting', 'desc': 'Met with parents to discuss progress'},
            {'type': 'NEGATIVE', 'category': 'ATTENDANCE', 'title': 'Low Attendance', 'desc': 'Attendance below 75% this month'},
            {'type': 'DISCIPLINE', 'category': 'BEHAVIORAL', 'title': 'Discipline Issue', 'desc': 'Needs improvement in classroom behavior'},
        ]
        
        remark_count = 0
        for student in random.sample(students, min(len(students), 100)):
            # Create 1-3 remarks per student
            for _ in range(random.randint(1, 3)):
                template = random.choice(remark_templates)
                staff = random.choice(staff_members)
                
                StudentRemark.objects.create(
                    student=student,
                    remark_type=template['type'],
                    category=template['category'],
                    title=template['title'],
                    description=template['desc'],
                    created_by_staff=staff.user if hasattr(staff, 'user') and staff.user else None,
                    visible_to_parent=True,
                    visible_to_student=template['type'] in ['POSITIVE', 'ACHIEVEMENT'],
                    is_important=template['type'] in ['NEGATIVE', 'DISCIPLINE']
                )
                remark_count += 1
        
        self.stdout.write(f'   ✓ Created {remark_count} student remarks')

    def create_health_records(self, students):
        """Create health records for students"""
        record_count = 0
        for student in random.sample(students, min(len(students), 80)):
            # Create 1-2 health records
            for _ in range(random.randint(1, 2)):
                StudentHealthRecord.objects.create(
                    student=student,
                    date=date.today() - timedelta(days=random.randint(1, 365)),
                    height_cm=Decimal(random.randint(120, 180)),
                    weight_kg=Decimal(random.randint(30, 80)),
                    diagnosis=random.choice(['General Checkup', 'Fever', 'Cold', 'Injury', 'Routine Examination']),
                    treatment=random.choice(['Rest advised', 'Medication prescribed', 'No treatment needed', 'Referred to specialist']),
                    examined_by=random.choice(['Dr. Smith', 'Dr. Patel', 'Nurse Mary', 'Dr. Kumar'])
                )
                record_count += 1
        
        self.stdout.write(f'   ✓ Created {record_count} health records')

    def create_staff_leaves(self, tenant, staff_members, admin_user):
        """Create staff leave applications"""
        leave_count = 0
        for staff in random.sample(staff_members, min(len(staff_members), 8)):
            # Create 1-2 leave applications
            for _ in range(random.randint(1, 2)):
                from_date = date.today() + timedelta(days=random.randint(-30, 30))
                to_date = from_date + timedelta(days=random.randint(1, 5))
                
                StaffLeave.objects.create(
                    tenant=tenant,
                    staff=staff,
                    leave_type=random.choice(['CASUAL', 'SICK', 'EARNED']),
                    from_date=from_date,
                    to_date=to_date,
                    reason=random.choice(['Personal work', 'Medical reasons', 'Family function', 'Emergency']),
                    status=random.choice(['PENDING', 'APPROVED', 'APPROVED', 'REJECTED']),
                    approved_by=admin_user if random.random() > 0.3 else None,
                    approval_date=timezone.now() if random.random() > 0.3 else None
                )
                leave_count += 1
        
        self.stdout.write(f'   ✓ Created {leave_count} staff leave applications')

    def print_summary(self, tenant):
        """Print summary of created data"""
        self.stdout.write(self.style.SUCCESS('\n📊 Data Summary:'))
        self.stdout.write(f'   • Students: {Student.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Staff: {Staff.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Sections: {Section.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Student Attendance: {AttendanceRecord.objects.filter(tenant=tenant, record_type="STUDENT").count()}')
        self.stdout.write(f'   • Staff Attendance: {StaffAttendance.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Fee Invoices: {FeeInvoice.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Fee Transactions: {FeeTransaction.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Student Remarks: {StudentRemark.objects.filter(student__tenant=tenant).count()}')
        self.stdout.write(f'   • Health Records: {StudentHealthRecord.objects.filter(student__tenant=tenant).count()}')
        self.stdout.write(f'   • Staff Leaves: {StaffLeave.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'   • Petty Cash Requests: {PettyCashRequest.objects.filter(tenant=tenant).count()}')
