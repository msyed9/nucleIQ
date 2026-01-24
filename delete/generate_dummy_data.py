import os
import pandas as pd

from backend.data_management.templates import get_template


BASE_DIR = r"C:\ECOLAB-ETS\RnD\nucleIQ"
OUT_DIR = os.path.join(BASE_DIR, "delete")
os.makedirs(OUT_DIR, exist_ok=True)

students = [
    {
        "first_name": "Aarav",
        "last_name": "Sharma",
        "admission_number": "STU2024001",
        "date_of_birth": "15-05-2010",
        "gender": "M",
        "father_name": "Rajesh Sharma",
        "mother_name": "Neha Sharma",
        "father_phone": "9876543210",
        "mother_phone": "9876543211",
        "father_email": "rajesh.sharma@example.com",
        "mother_email": "neha.sharma@example.com",
        "class_name": "Class 10",
        "section_name": "A",
        "admission_date": "01-04-2024",
        "address": "12 MG Road, City",
        "blood_group": "B+",
    },
    {
        "first_name": "Diya",
        "last_name": "Verma",
        "admission_number": "STU2024002",
        "date_of_birth": "22-08-2010",
        "gender": "F",
        "father_name": "Amit Verma",
        "mother_name": "Pooja Verma",
        "father_phone": "9876543212",
        "mother_phone": "9876543213",
        "father_email": "amit.verma@example.com",
        "mother_email": "pooja.verma@example.com",
        "class_name": "Class 10",
        "section_name": "A",
        "admission_date": "01-04-2024",
        "address": "45 Lake View, City",
        "blood_group": "O+",
    },
    {
        "first_name": "Kabir",
        "last_name": "Singh",
        "admission_number": "STU2024003",
        "date_of_birth": "03-01-2011",
        "gender": "M",
        "father_name": "Vikram Singh",
        "mother_name": "Meera Singh",
        "father_phone": "9876543214",
        "mother_phone": "9876543215",
        "father_email": "vikram.singh@example.com",
        "mother_email": "meera.singh@example.com",
        "class_name": "Class 9",
        "section_name": "B",
        "admission_date": "01-04-2024",
        "address": "78 Green Park, City",
        "blood_group": "A+",
    },
    {
        "first_name": "Isha",
        "last_name": "Khan",
        "admission_number": "STU2024004",
        "date_of_birth": "11-11-2011",
        "gender": "F",
        "father_name": "Farhan Khan",
        "mother_name": "Sara Khan",
        "father_phone": "9876543216",
        "mother_phone": "9876543217",
        "father_email": "farhan.khan@example.com",
        "mother_email": "sara.khan@example.com",
        "class_name": "Class 9",
        "section_name": "A",
        "admission_date": "01-04-2024",
        "address": "90 City Center, City",
        "blood_group": "AB+",
    },
    {
        "first_name": "Vivaan",
        "last_name": "Gupta",
        "admission_number": "STU2024005",
        "date_of_birth": "29-02-2012",
        "gender": "M",
        "father_name": "Rohit Gupta",
        "mother_name": "Anita Gupta",
        "father_phone": "9876543218",
        "mother_phone": "9876543219",
        "father_email": "rohit.gupta@example.com",
        "mother_email": "anita.gupta@example.com",
        "class_name": "Class 8",
        "section_name": "A",
        "admission_date": "01-04-2024",
        "address": "5 River Side, City",
        "blood_group": "B-",
    },
]

staff = [
    {
        "first_name": "Priya",
        "last_name": "Sharma",
        "employee_id": "EMP001",
        "joining_date": "01-04-2020",
        "designation": "TEACHER",
        "email": "priya.sharma@school.edu",
        "phone": "9876500001",
        "gender": "FEMALE",
        "department": "Mathematics",
    },
    {
        "first_name": "Rakesh",
        "last_name": "Mehta",
        "employee_id": "EMP002",
        "joining_date": "15-06-2019",
        "designation": "HEAD_TEACHER",
        "email": "rakesh.mehta@school.edu",
        "phone": "9876500002",
        "gender": "MALE",
        "department": "Science",
    },
    {
        "first_name": "Ananya",
        "last_name": "Iyer",
        "employee_id": "EMP003",
        "joining_date": "10-02-2021",
        "designation": "TEACHER",
        "email": "ananya.iyer@school.edu",
        "phone": "9876500003",
        "gender": "FEMALE",
        "department": "English",
    },
    {
        "first_name": "Sanjay",
        "last_name": "Patil",
        "employee_id": "EMP004",
        "joining_date": "01-08-2018",
        "designation": "ACCOUNTANT",
        "email": "sanjay.patil@school.edu",
        "phone": "9876500004",
        "gender": "MALE",
        "department": "Finance",
    },
    {
        "first_name": "Nisha",
        "last_name": "Rao",
        "employee_id": "EMP005",
        "joining_date": "01-05-2022",
        "designation": "LIBRARIAN",
        "email": "nisha.rao@school.edu",
        "phone": "9876500005",
        "gender": "FEMALE",
        "department": "Library",
    },
]

classes = [
    {"class_name": "Class 10", "section_name": "A", "room_number": "101", "capacity": "40", "academic_year": "2024-25"},
    {"class_name": "Class 10", "section_name": "B", "room_number": "102", "capacity": "40", "academic_year": "2024-25"},
    {"class_name": "Class 9", "section_name": "A", "room_number": "201", "capacity": "40", "academic_year": "2024-25"},
    {"class_name": "Class 9", "section_name": "B", "room_number": "202", "capacity": "40", "academic_year": "2024-25"},
    {"class_name": "Class 8", "section_name": "A", "room_number": "301", "capacity": "40", "academic_year": "2024-25"},
]

subjects = [
    {"subject_name": "Mathematics", "subject_code": "MATH10", "class_name": "Class 10", "credit_hours": "5", "is_elective": "false", "max_marks": "100"},
    {"subject_name": "Science", "subject_code": "SCI10", "class_name": "Class 10", "credit_hours": "5", "is_elective": "false", "max_marks": "100"},
    {"subject_name": "English", "subject_code": "ENG10", "class_name": "Class 10", "credit_hours": "4", "is_elective": "false", "max_marks": "100"},
    {"subject_name": "History", "subject_code": "HIS09", "class_name": "Class 9", "credit_hours": "4", "is_elective": "false", "max_marks": "100"},
    {"subject_name": "Computer", "subject_code": "COMP08", "class_name": "Class 8", "credit_hours": "3", "is_elective": "true", "max_marks": "100"},
]

student_enrollments = [
    {
        "admission_number": s["admission_number"],
        "class_name": s["class_name"],
        "section_name": s["section_name"],
        "roll_number": str(i + 1),
        "enrollment_date": "01-04-2024",
        "academic_year": "2024-25",
    }
    for i, s in enumerate(students)
]

parents = [
    {
        "admission_number": s["admission_number"],
        "father_name": s["father_name"],
        "mother_name": s["mother_name"],
        "father_phone": s["father_phone"],
        "mother_phone": s["mother_phone"],
        "father_email": s.get("father_email", ""),
        "mother_email": s.get("mother_email", ""),
        "father_occupation": "Business",
        "mother_occupation": "Homemaker",
    }
    for s in students
]

fee_structures = [
    {"fee_type": "Tuition Fee", "class_name": "Class 10", "amount": "5000", "frequency": "MONTHLY", "due_day": "10", "is_mandatory": "true", "description": "Monthly tuition fee", "academic_year": "2024-25"},
    {"fee_type": "Transport Fee", "class_name": "Class 10", "amount": "1200", "frequency": "MONTHLY", "due_day": "10", "is_mandatory": "false", "description": "Bus transport fee", "academic_year": "2024-25"},
    {"fee_type": "Lab Fee", "class_name": "Class 9", "amount": "2000", "frequency": "TERM", "due_day": "10", "is_mandatory": "true", "description": "Science lab fee", "academic_year": "2024-25"},
    {"fee_type": "Sports Fee", "class_name": "Class 8", "amount": "1500", "frequency": "YEARLY", "due_day": "10", "is_mandatory": "false", "description": "Annual sports fee", "academic_year": "2024-25"},
    {"fee_type": "Admission Fee", "class_name": "Class 10", "amount": "8000", "frequency": "ONE_TIME", "due_day": "10", "is_mandatory": "true", "description": "One-time admission fee", "academic_year": "2024-25"},
]

fee_allocations = [
    {"admission_number": s["admission_number"], "fee_type": "Tuition Fee", "amount": "5000", "frequency": "MONTHLY", "academic_year": "2024-25"}
    for s in students
]

fee_discounts = [
    {"admission_number": "STU2024001", "discount_code": "SCHOLAR50", "discount_type": "PERCENT", "value": "50", "start_date": "01-04-2024", "end_date": "31-03-2025", "reason": "Merit Scholarship"},
    {"admission_number": "STU2024002", "discount_code": "SIBLING10", "discount_type": "PERCENT", "value": "10", "start_date": "01-04-2024", "end_date": "31-03-2025", "reason": "Sibling Discount"},
    {"admission_number": "STU2024003", "discount_code": "NEED500", "discount_type": "AMOUNT", "value": "500", "start_date": "01-04-2024", "end_date": "31-03-2025", "reason": "Need Based"},
    {"admission_number": "STU2024004", "discount_code": "SPORTS20", "discount_type": "PERCENT", "value": "20", "start_date": "01-04-2024", "end_date": "31-03-2025", "reason": "Sports Quota"},
    {"admission_number": "STU2024005", "discount_code": "EARLY200", "discount_type": "AMOUNT", "value": "200", "start_date": "01-04-2024", "end_date": "31-03-2025", "reason": "Early Payment"},
]

transport_allocations = [
    {"admission_number": s["admission_number"], "route_name": "Route 5", "stop_name": "Main Market", "start_date": "01-04-2024"}
    for s in students
]

attendance = [
    {"admission_number": s["admission_number"], "date": "15-06-2024", "status": "PRESENT", "remarks": ""}
    for s in students
]

exam_schedule = [
    {"exam_name": "Midterm", "class_name": "Class 10", "subject_code": "MATH10", "exam_date": "10-09-2024", "start_time": "09:00", "end_time": "12:00", "max_marks": "100"},
    {"exam_name": "Midterm", "class_name": "Class 10", "subject_code": "SCI10", "exam_date": "12-09-2024", "start_time": "09:00", "end_time": "12:00", "max_marks": "100"},
    {"exam_name": "Midterm", "class_name": "Class 10", "subject_code": "ENG10", "exam_date": "14-09-2024", "start_time": "09:00", "end_time": "12:00", "max_marks": "100"},
    {"exam_name": "Midterm", "class_name": "Class 9", "subject_code": "HIS09", "exam_date": "16-09-2024", "start_time": "09:00", "end_time": "12:00", "max_marks": "100"},
    {"exam_name": "Midterm", "class_name": "Class 8", "subject_code": "COMP08", "exam_date": "18-09-2024", "start_time": "09:00", "end_time": "11:00", "max_marks": "100"},
]

exam_results = [
    {"admission_number": "STU2024001", "exam_name": "Midterm", "subject_code": "MATH10", "max_marks": "100", "marks_obtained": "88", "grade": "A", "exam_date": "10-09-2024", "academic_year": "2024-25"},
    {"admission_number": "STU2024002", "exam_name": "Midterm", "subject_code": "MATH10", "max_marks": "100", "marks_obtained": "92", "grade": "A+", "exam_date": "10-09-2024", "academic_year": "2024-25"},
    {"admission_number": "STU2024003", "exam_name": "Midterm", "subject_code": "HIS09", "max_marks": "100", "marks_obtained": "76", "grade": "B+", "exam_date": "16-09-2024", "academic_year": "2024-25"},
    {"admission_number": "STU2024004", "exam_name": "Midterm", "subject_code": "HIS09", "max_marks": "100", "marks_obtained": "81", "grade": "A-", "exam_date": "16-09-2024", "academic_year": "2024-25"},
    {"admission_number": "STU2024005", "exam_name": "Midterm", "subject_code": "COMP08", "max_marks": "100", "marks_obtained": "79", "grade": "B+", "exam_date": "18-09-2024", "academic_year": "2024-25"},
]

periods = [
    {"day_of_week": "MON", "start_time": "09:00", "end_time": "09:45", "period_number": "1", "subject_code": "MATH10", "teacher_employee_id": "EMP001", "room_number": "101"},
    {"day_of_week": "MON", "start_time": "09:50", "end_time": "10:35", "period_number": "2", "subject_code": "SCI10", "teacher_employee_id": "EMP002", "room_number": "101"},
    {"day_of_week": "TUE", "start_time": "09:00", "end_time": "09:45", "period_number": "1", "subject_code": "ENG10", "teacher_employee_id": "EMP003", "room_number": "101"},
    {"day_of_week": "TUE", "start_time": "09:50", "end_time": "10:35", "period_number": "2", "subject_code": "MATH10", "teacher_employee_id": "EMP001", "room_number": "101"},
    {"day_of_week": "WED", "start_time": "09:00", "end_time": "09:45", "period_number": "1", "subject_code": "SCI10", "teacher_employee_id": "EMP002", "room_number": "101"},
]

timetable = [
    {"class_name": "Class 10", "section_name": "A", "academic_year": "2024-25", **p}
    for p in periods
]

library_books = [
    {"isbn": "9789389620001", "title": "Mathematics Grade 10", "author": "NCERT", "publisher": "NCERT", "category": "Textbook", "copies_total": "20", "location": "Rack A1", "published_year": "2022"},
    {"isbn": "9789389620002", "title": "Science Grade 10", "author": "NCERT", "publisher": "NCERT", "category": "Textbook", "copies_total": "18", "location": "Rack A2", "published_year": "2022"},
    {"isbn": "9789389620003", "title": "English Grade 10", "author": "NCERT", "publisher": "NCERT", "category": "Textbook", "copies_total": "15", "location": "Rack A3", "published_year": "2021"},
    {"isbn": "9789389620004", "title": "History Grade 9", "author": "NCERT", "publisher": "NCERT", "category": "Textbook", "copies_total": "12", "location": "Rack B1", "published_year": "2021"},
    {"isbn": "9789389620005", "title": "Computer Grade 8", "author": "TechPress", "publisher": "TechPress", "category": "Reference", "copies_total": "10", "location": "Rack C1", "published_year": "2020"},
]

library_transactions = [
    {"transaction_id": "LIBTXN001", "admission_number": "STU2024001", "isbn": "9789389620001", "issue_date": "01-07-2024", "due_date": "15-07-2024", "return_date": "10-07-2024", "fine_amount": "0", "status": "RETURNED"},
    {"transaction_id": "LIBTXN002", "admission_number": "STU2024002", "isbn": "9789389620002", "issue_date": "02-07-2024", "due_date": "16-07-2024", "return_date": "", "fine_amount": "0", "status": "ISSUED"},
    {"transaction_id": "LIBTXN003", "admission_number": "STU2024003", "isbn": "9789389620003", "issue_date": "03-07-2024", "due_date": "17-07-2024", "return_date": "", "fine_amount": "10", "status": "OVERDUE"},
    {"transaction_id": "LIBTXN004", "admission_number": "STU2024004", "isbn": "9789389620004", "issue_date": "04-07-2024", "due_date": "18-07-2024", "return_date": "12-07-2024", "fine_amount": "0", "status": "RETURNED"},
    {"transaction_id": "LIBTXN005", "admission_number": "STU2024005", "isbn": "9789389620005", "issue_date": "05-07-2024", "due_date": "19-07-2024", "return_date": "", "fine_amount": "0", "status": "ISSUED"},
]

payroll_payments = [
    {"payment_reference": "SAL/2024/001", "employee_id": "EMP001", "period_start": "01-04-2024", "period_end": "30-04-2024", "gross_amount": "50000", "deductions": "2000", "net_amount": "48000", "payment_date": "01-05-2024", "payment_mode": "BANK_TRANSFER", "remarks": "April salary"},
    {"payment_reference": "SAL/2024/002", "employee_id": "EMP002", "period_start": "01-04-2024", "period_end": "30-04-2024", "gross_amount": "60000", "deductions": "2500", "net_amount": "57500", "payment_date": "01-05-2024", "payment_mode": "BANK_TRANSFER", "remarks": "April salary"},
    {"payment_reference": "SAL/2024/003", "employee_id": "EMP003", "period_start": "01-04-2024", "period_end": "30-04-2024", "gross_amount": "45000", "deductions": "1500", "net_amount": "43500", "payment_date": "01-05-2024", "payment_mode": "BANK_TRANSFER", "remarks": "April salary"},
    {"payment_reference": "SAL/2024/004", "employee_id": "EMP004", "period_start": "01-04-2024", "period_end": "30-04-2024", "gross_amount": "55000", "deductions": "2200", "net_amount": "52800", "payment_date": "01-05-2024", "payment_mode": "BANK_TRANSFER", "remarks": "April salary"},
    {"payment_reference": "SAL/2024/005", "employee_id": "EMP005", "period_start": "01-04-2024", "period_end": "30-04-2024", "gross_amount": "40000", "deductions": "1000", "net_amount": "39000", "payment_date": "01-05-2024", "payment_mode": "BANK_TRANSFER", "remarks": "April salary"},
]

hostel_allocations = [
    {"admission_number": "STU2024001", "hostel_name": "Boys Hostel", "room_number": "101", "bed_number": "A", "start_date": "01-06-2024", "end_date": "", "status": "ACTIVE"},
    {"admission_number": "STU2024003", "hostel_name": "Boys Hostel", "room_number": "102", "bed_number": "B", "start_date": "01-06-2024", "end_date": "", "status": "ACTIVE"},
    {"admission_number": "STU2024005", "hostel_name": "Boys Hostel", "room_number": "103", "bed_number": "A", "start_date": "01-06-2024", "end_date": "", "status": "ACTIVE"},
    {"admission_number": "STU2024002", "hostel_name": "Girls Hostel", "room_number": "201", "bed_number": "A", "start_date": "01-06-2024", "end_date": "", "status": "ACTIVE"},
    {"admission_number": "STU2024004", "hostel_name": "Girls Hostel", "room_number": "202", "bed_number": "B", "start_date": "01-06-2024", "end_date": "", "status": "ACTIVE"},
]

inventory_items = [
    {"item_code": "ASSET001", "item_name": "Projector", "category": "Electronics", "quantity": "5", "unit_cost": "25000", "purchase_date": "15-03-2023", "vendor": "ABC Suppliers", "location": "Lab 1", "condition": "GOOD"},
    {"item_code": "ASSET002", "item_name": "Desktop Computer", "category": "Electronics", "quantity": "20", "unit_cost": "35000", "purchase_date": "10-02-2023", "vendor": "Tech World", "location": "Computer Lab", "condition": "GOOD"},
    {"item_code": "ASSET003", "item_name": "Library Table", "category": "Furniture", "quantity": "15", "unit_cost": "8000", "purchase_date": "05-01-2022", "vendor": "FurniCo", "location": "Library", "condition": "GOOD"},
    {"item_code": "ASSET004", "item_name": "Sports Kit", "category": "Sports", "quantity": "10", "unit_cost": "3000", "purchase_date": "20-06-2023", "vendor": "SportsHub", "location": "Sports Room", "condition": "NEW"},
    {"item_code": "ASSET005", "item_name": "Lab Microscope", "category": "Lab", "quantity": "8", "unit_cost": "12000", "purchase_date": "18-08-2023", "vendor": "Lab Equip", "location": "Science Lab", "condition": "GOOD"},
]

module_data = {
    "classes_sections": ("classes", classes),
    "subjects": ("subjects", subjects),
    "staff": ("staff", staff),
    "students": ("students", students),
    "student_enrollments": ("student_enrollments", student_enrollments),
    "parents": ("parents", parents),
    "fee_structures": ("fee_structures", fee_structures),
    "fee_allocations": ("fee_allocations", fee_allocations),
    "fee_discounts": ("fee_discounts", fee_discounts),
    "transport_allocations": ("transport", transport_allocations),
    "attendance": ("attendance", attendance),
    "exam_schedule": ("exam_schedule", exam_schedule),
    "exam_results": ("exam_results", exam_results),
    "timetable": ("timetable", timetable),
    "library_books": ("library_books", library_books),
    "library_transactions": ("library_transactions", library_transactions),
    "payroll_payments": ("payroll_payments", payroll_payments),
    "hostel_allocations": ("hostel_allocations", hostel_allocations),
    "inventory_items": ("inventory_items", inventory_items),
}


def build_df(template_name, rows):
    template = get_template(template_name)
    if not template:
        raise ValueError(f"Template not found: {template_name}")

    columns = [f.name for f in template.fields]
    normalized_rows = []
    for row in rows:
        normalized = {col: "" for col in columns}
        for key, val in row.items():
            if key in normalized:
                normalized[key] = val
        normalized_rows.append(normalized)

    return pd.DataFrame(normalized_rows, columns=columns)


created_files = []

for file_prefix, (template_name, rows) in module_data.items():
    df = build_df(template_name, rows)

    csv_path = os.path.join(OUT_DIR, f"{file_prefix}.csv")
    xlsx_path = os.path.join(OUT_DIR, f"{file_prefix}.xlsx")

    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False, sheet_name=template_name[:31])

    created_files.append((csv_path, xlsx_path))

print("Created files:")
for c, x in created_files:
    print(c)
    print(x)
