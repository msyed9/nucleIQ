"""
Master Data Generator - Fixed Version
Generates properly formatted XLSX files matching the NucleIQ import templates.
"""

import os
import random
from datetime import datetime, timedelta, date
from faker import Faker
from openpyxl import Workbook

fake = Faker('en_IN')
output_dir = r"c:\ECOLAB-ETS\RnD\nucleIQ\delete\newschool"
os.makedirs(output_dir, exist_ok=True)

# Configuration
NUM_STUDENTS = 560
NUM_STAFF = 20
CLASSES = [f"Class {i}" for i in range(1, 11)]
SECTIONS = ["A", "B"]
ACADEMIC_YEARS = ["2024-25", "2025-26"]
SUBJECTS = ["English", "Mathematics", "Science", "Social Science", "Hindi", 
            "Physical Education", "Computer Science", "Art & Craft", "General Knowledge", "Music"]

# Valid enum values from models
VALID_DESIGNATIONS = [
    'PRINCIPAL', 'VICE_PRINCIPAL', 'HEAD_TEACHER', 'TEACHER', 'ASSISTANT_TEACHER',
    'LIBRARIAN', 'LAB_ASSISTANT', 'COUNSELOR', 'ACCOUNTANT', 'CLERK', 
    'RECEPTIONIST', 'SECURITY', 'PEON', 'DRIVER', 'OTHER'
]
VALID_EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT', 'TEMPORARY', 'PART_TIME']
VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER']
VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
DEPARTMENTS = ["Mathematics", "Science", "Language", "Humanities", "Administration"]

def create_xlsx(filename, headers, rows):
    path = os.path.join(output_dir, filename)
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    wb.save(path)
    print(f"Created {filename} with {len(rows)} records")

def format_date(d):
    """Format date as DD-MM-YYYY"""
    if isinstance(d, (date, datetime)):
        return d.strftime("%d-%m-%Y")
    return str(d)

# =======================
# 1. CLASSES
# =======================
print("\n[1/20] Generating Classes...")
class_rows = []
for c in CLASSES:
    for s in SECTIONS:
        for year in ACADEMIC_YEARS:
            class_rows.append([c, s, str(random.randint(100, 200)), "40", year])
create_xlsx("classes.xlsx", 
    ["class_name", "section_name", "room_number", "capacity", "academic_year"], 
    class_rows)

# =======================
# 2. SUBJECTS
# =======================
print("\n[2/20] Generating Subjects...")
sub_rows = []
for sub in SUBJECTS:
    for c in CLASSES:
        code = f"{sub[:3].upper()}{c.split()[-1]:0>2}"
        sub_rows.append([sub, code, c, "5", "false", "100"])
create_xlsx("subjects.xlsx", 
    ["subject_name", "subject_code", "class_name", "credit_hours", "is_elective", "max_marks"], 
    sub_rows)

# =======================
# 3. STAFF
# =======================
print("\n[3/20] Generating Staff...")
staff_ids = [f"EMP{1000+i}" for i in range(NUM_STAFF)]
staff_rows = []

# 15 teachers + 5 admin/support
designations = ['TEACHER'] * 15 + ['ACCOUNTANT', 'CLERK', 'RECEPTIONIST', 'SECURITY', 'PEON']

for i in range(NUM_STAFF):
    fname = fake.first_name()
    lname = fake.last_name()
    designation = designations[i]
    dept = random.choice(DEPARTMENTS) if designation == 'TEACHER' else 'Administration'
    gender = random.choice(VALID_GENDERS)
    dob = fake.date_of_birth(minimum_age=25, maximum_age=55)
    joining = fake.date_between(start_date='-10y', end_date='-1y')
    
    staff_rows.append([
        fname,  # first_name
        lname,  # last_name
        staff_ids[i],  # employee_id
        format_date(joining),  # joining_date
        designation,  # designation
        "",  # middle_name
        f"{fname.lower()}.{lname.lower()}@school.edu",  # email
        fake.phone_number()[-10:],  # phone
        "",  # alternate_phone
        format_date(dob),  # date_of_birth
        gender,  # gender
        random.choice(VALID_BLOOD_GROUPS),  # blood_group
        random.choice(VALID_EMPLOYMENT_TYPES),  # employment_type
        dept,  # department
        fake.address().replace("\n", ", "),  # address
        "Delhi",  # city
        "Delhi",  # state
        "110001",  # postal_code
        fake.aadhaar_id() if hasattr(fake, 'aadhaar_id') else "".join([str(random.randint(0,9)) for _ in range(12)]),  # aadhar_number
        "ABCDE1234F",  # pan_number
        str(random.randint(35000, 80000)),  # salary
        "".join([str(random.randint(0,9)) for _ in range(14)]),  # bank_account_number
        "State Bank of India",  # bank_name
        "SBIN0001234",  # bank_ifsc
        fake.name(),  # emergency_contact_name
        fake.phone_number()[-10:],  # emergency_contact_phone
        str(random.randint(1, 20))  # experience_years
    ])

create_xlsx("staff.xlsx", [
    "first_name", "last_name", "employee_id", "joining_date", "designation",
    "middle_name", "email", "phone", "alternate_phone", "date_of_birth",
    "gender", "blood_group", "employment_type", "department", "address",
    "city", "state", "postal_code", "aadhar_number", "pan_number",
    "salary", "bank_account_number", "bank_name", "bank_ifsc",
    "emergency_contact_name", "emergency_contact_phone", "experience_years"
], staff_rows)

# =======================
# 4. STUDENTS
# =======================
print("\n[4/20] Generating Students...")
admission_numbers = [f"STU{2024000+i}" for i in range(NUM_STUDENTS)]
student_rows = []
students_per_section = NUM_STUDENTS // (len(CLASSES) * len(SECTIONS))
stu_idx = 0

for c_idx, c_name in enumerate(CLASSES):
    for s_name in SECTIONS:
        for roll in range(1, students_per_section + 1):
            if stu_idx >= NUM_STUDENTS:
                break
            adm_no = admission_numbers[stu_idx]
            fname = fake.first_name()
            lname = fake.last_name()
            gender = random.choice(['M', 'F'])
            dob = fake.date_of_birth(minimum_age=5 + c_idx, maximum_age=7 + c_idx)
            father = fake.name_male()
            mother = fake.name_female()
            phone = fake.phone_number()[-10:]
            
            student_rows.append([
                fname,  # first_name
                adm_no,  # admission_number
                format_date(dob),  # date_of_birth
                gender,  # gender
                father,  # father_name
                mother,  # mother_name
                phone,  # father_phone
                "",  # middle_name
                lname,  # last_name
                format_date(date(2024, 4, 1)),  # admission_date
                f"{adm_no.lower()}@student.school.edu",  # email
                phone,  # phone
                fake.address().replace("\n", ", "),  # address
                random.choice(VALID_BLOOD_GROUPS),  # blood_group
                fake.phone_number()[-10:],  # mother_phone
                "",  # father_email
                "",  # mother_email
                "Business",  # father_occupation
                "Homemaker",  # mother_occupation
                "",  # guardian_name
                "",  # guardian_phone
                "",  # guardian_relation
                "".join([str(random.randint(0,9)) for _ in range(12)]),  # aadhar_number
                "",  # pen_number
                "Indian",  # nationality
                "Hindu",  # religion
                "General",  # caste
                c_name,  # class_name
                s_name,  # section_name
                str(roll),  # roll_number
                "",  # previous_school_name
                "",  # transfer_certificate_number
                ""  # notes
            ])
            stu_idx += 1

create_xlsx("students.xlsx", [
    "first_name", "admission_number", "date_of_birth", "gender", "father_name", "mother_name", "father_phone",
    "middle_name", "last_name", "admission_date", "email", "phone", "address", "blood_group", "mother_phone",
    "father_email", "mother_email", "father_occupation", "mother_occupation", "guardian_name",
    "guardian_phone", "guardian_relation", "aadhar_number", "pen_number", "nationality",
    "religion", "caste", "class_name", "section_name", "roll_number", "previous_school_name",
    "transfer_certificate_number", "notes"
], student_rows)

# =======================
# 5. PARENTS
# =======================
print("\n[5/20] Generating Parents...")
parent_rows = []
for i, adm_no in enumerate(admission_numbers):
    father = student_rows[i][4]  # father_name from students
    phone = student_rows[i][6]  # father_phone
    parent_rows.append([
        father,  # name
        "FATHER",  # relation
        f"P{i+1:05d}",  # parent_id
        phone,  # phone
        f"{father.lower().replace(' ', '.')}@email.com",  # email
        "Business",  # occupation
        "Graduate",  # education
        student_rows[i][12],  # address (same as student)
        adm_no  # student_admission_number
    ])
create_xlsx("parents.xlsx", 
    ["name", "relation", "parent_id", "phone", "email", "occupation", "education", "address", "student_admission_number"],
    parent_rows)

# =======================
# 6. USER ACCOUNTS
# =======================
print("\n[6/20] Generating User Accounts...")
user_rows = []
for adm_no in admission_numbers:
    user_rows.append([
        f"user_{adm_no.lower()}",  # username
        "Password@123",  # password
        "STUDENT",  # role
        f"Student {adm_no}",  # full_name
        f"{adm_no.lower()}@school.edu",  # email
        adm_no,  # admission_number
        ""  # employee_id
    ])
for emp_id in staff_ids:
    user_rows.append([
        f"user_{emp_id.lower()}",
        "Password@123",
        "STAFF",
        f"Staff {emp_id}",
        f"{emp_id.lower()}@school.edu",
        "",
        emp_id
    ])
create_xlsx("user_accounts.xlsx",
    ["username", "password", "role", "full_name", "email", "admission_number", "employee_id"],
    user_rows)

# =======================
# 7. STUDENT ENROLLMENTS
# =======================
print("\n[7/20] Generating Student Enrollments...")
enrollment_rows = []
for i, adm_no in enumerate(admission_numbers):
    c_idx = i // (len(SECTIONS) * students_per_section)
    s_idx = (i // students_per_section) % len(SECTIONS)
    c_name = CLASSES[min(c_idx, len(CLASSES)-1)]
    s_name = SECTIONS[s_idx]
    for year in ACADEMIC_YEARS:
        enrollment_rows.append([
            adm_no,
            c_name,
            s_name,
            year,
            "ACTIVE",
            format_date(date(int(year[:4]), 4, 1))
        ])
create_xlsx("student_enrollments.xlsx",
    ["admission_number", "class_name", "section_name", "academic_year", "status", "enrollment_date"],
    enrollment_rows)

# =======================
# 8. FEE STRUCTURES
# =======================
print("\n[8/20] Generating Fee Structures...")
fee_rows = []
for c_idx, c_name in enumerate(CLASSES):
    base_incr = c_idx * 1000
    terms = [("Term 1", 7670 + base_incr), ("Term 2", 5200 + base_incr), ("Term 3", 5200 + base_incr)]
    for term_name, amt in terms:
        fee_rows.append([
            f"Tuition Fee - {term_name}",  # fee_type
            c_name,  # class_name
            str(amt),  # amount
            "TERM"  # frequency
        ])
create_xlsx("fee_structures.xlsx",
    ["fee_type", "class_name", "amount", "frequency"],
    fee_rows)

# =======================
# 9-12. FEE ALLOCATIONS, INVOICES, PAYMENTS, DISCOUNTS
# =======================
print("\n[9-12/20] Generating Fee Records...")
allocation_rows = []
invoice_rows = []
payment_rows = []

for i, adm_no in enumerate(admission_numbers):
    c_idx = min(i // (len(SECTIONS) * students_per_section), len(CLASSES)-1)
    c_name = CLASSES[c_idx]
    base_incr = c_idx * 1000
    
    for year in ACADEMIC_YEARS:
        for term_num, (term_amt) in enumerate([(7670 + base_incr), (5200 + base_incr), (5200 + base_incr)]):
            fee_type = f"Tuition Fee - Term {term_num + 1}"
            due_month = [4, 8, 12][term_num]
            due_date = format_date(date(int(year[:4]), due_month, 10))
            
            allocation_rows.append([adm_no, fee_type, str(term_amt), year])
            
            status = "PAID" if year == "2024-25" else "PARTIAL"
            invoice_rows.append([adm_no, fee_type, str(term_amt), due_date, status, year])
            
            if year == "2024-25":
                pay_date = format_date(date(int(year[:4]), due_month, 15))
                payment_rows.append([f"INV-{year}-{adm_no}-T{term_num+1}", str(term_amt), "CASH", pay_date, f"REC{random.randint(10000,99999)}", "Full payment"])
            else:
                pay_date = format_date(date(int(year[:4]), due_month, 15))
                payment_rows.append([f"INV-{year}-{adm_no}-T{term_num+1}", str(int(term_amt * 0.5)), "ONLINE", pay_date, f"REC{random.randint(10000,99999)}", "Partial payment"])

create_xlsx("fee_allocations.xlsx", ["admission_number", "fee_type", "amount", "academic_year"], allocation_rows[:1000])
create_xlsx("fee_invoices.xlsx", ["admission_number", "fee_type", "amount", "due_date", "status", "academic_year"], invoice_rows[:1000])
create_xlsx("fee_payments.xlsx", ["invoice_number", "amount_paid", "payment_method", "payment_date", "receipt_number", "notes"], payment_rows[:1000])
create_xlsx("fee_discounts.xlsx", ["admission_number", "discount_code", "discount_type", "value", "start_date", "end_date", "reason"], [])

# =======================
# 13. ATTENDANCE (Sample - first 100 students, 30 days)
# =======================
print("\n[13/20] Generating Attendance (sampled)...")
attn_rows = []
start_date = date(2024, 4, 1)
# Sample: 100 students x 60 school days = 6000 records
for day_offset in range(60):
    curr_date = start_date + timedelta(days=day_offset)
    if curr_date.weekday() == 6:  # Skip Sundays
        continue
    for adm_no in admission_numbers[:100]:
        status = "PRESENT" if random.random() > 0.05 else "ABSENT"
        attn_rows.append([adm_no, format_date(curr_date), status, ""])
create_xlsx("attendance.xlsx", ["admission_number", "date", "status", "remarks"], attn_rows)

# =======================
# 14-20. OTHER MODULES (Skeleton data)
# =======================
print("\n[14-20/20] Generating remaining modules...")

# Transport
create_xlsx("transport.xlsx", 
    ["route_name", "vehicle_number", "driver_name", "driver_phone", "monthly_fee"],
    [["Route 1", "DL1C1234", "Ram Kumar", "9876543210", "1500"],
     ["Route 2", "DL2C5678", "Shyam Singh", "9876543211", "1800"]])

# Library Books
create_xlsx("library_books.xlsx",
    ["title", "author", "isbn", "category", "total_copies", "available_copies"],
    [["Physics Fundamentals", "H.C. Verma", "9788177091878", "Science", "10", "8"],
     ["Mathematics Primer", "R.D. Sharma", "9788189928131", "Mathematics", "15", "12"]])

create_xlsx("library_transactions.xlsx",
    ["admission_number", "book_isbn", "issue_date", "due_date", "return_date", "status"],
    [[admission_numbers[0], "9788177091878", "10-04-2024", "24-04-2024", "20-04-2024", "RETURNED"]])

# Inventory
create_xlsx("inventory_items.xlsx",
    ["item_code", "item_name", "category", "quantity", "unit_cost", "purchase_date"],
    [["FUR001", "Student Desk", "Furniture", "100", "1200", "01-01-2024"],
     ["COM001", "Desktop Computer", "Computers", "20", "45000", "15-01-2024"],
     ["STA001", "Notebook Pack (100)", "Stationery", "50", "800", "01-02-2024"]])

# Exam Schedule
create_xlsx("exam_schedule.xlsx",
    ["exam_name", "class_name", "subject_name", "exam_date", "start_time", "end_time"],
    [["Term 1 Exam", "Class 10", "Mathematics", "10-09-2024", "09:00", "12:00"]])

# Exam Results
create_xlsx("exam_results.xlsx",
    ["admission_number", "exam_name", "subject_name", "marks_obtained", "max_marks", "academic_year"],
    [[admission_numbers[0], "Term 1 Exam", "Mathematics", "85", "100", "2024-25"]])

# Timetable
create_xlsx("timetable.xlsx",
    ["class_name", "section_name", "day", "period", "subject_name", "teacher_employee_id", "start_time", "end_time"],
    [["Class 10", "A", "MONDAY", "1", "Mathematics", staff_ids[0], "08:00", "08:45"]])

# Payroll
create_xlsx("payroll_payments.xlsx",
    ["employee_id", "period_month", "period_year", "gross_amount", "deductions", "net_amount", "payment_date", "status"],
    [[staff_ids[0], "4", "2024", "50000", "5000", "45000", "30-04-2024", "PAID"]])

# Hostel
create_xlsx("hostel_allocations.xlsx",
    ["admission_number", "hostel_name", "room_number", "bed_number", "start_date", "end_date", "status"],
    [])

# Certificates
create_xlsx("certificates_issued.xlsx",
    ["admission_number", "certificate_type", "issue_date", "certificate_number", "remarks"],
    [])

# Finance Journal
create_xlsx("finance_journal_entries.xlsx",
    ["entry_number", "entry_date", "account_code", "account_name", "debit", "credit", "narration"],
    [])

# Helpdesk
create_xlsx("helpdesk_tickets.xlsx",
    ["ticket_number", "requester_type", "requester_id", "subject", "description", "status", "priority"],
    [])

# LMS Courses
create_xlsx("lms_courses.xlsx",
    ["course_name", "description", "class_name", "subject_name"],
    [])

create_xlsx("lms_enrollments.xlsx",
    ["course_name", "student_admission_number", "enrollment_date"],
    [])

# ID Cards
create_xlsx("idcards.xlsx",
    ["holder_id", "holder_type", "issue_date", "expiry_date", "card_number", "status"],
    [])

print("\n" + "="*60)
print("DATA GENERATION COMPLETE!")
print(f"All files saved to: {output_dir}")
print("="*60)
