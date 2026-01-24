
import os
import pandas as pd
from datetime import datetime, timedelta
import random
from pathlib import Path

# Ensure the delete folder exists
output_dir = Path('c:/ECOLAB-ETS/RnD/nucleIQ/delete/school_migration_3years')
output_dir.mkdir(parents=True, exist_ok=True)

print(f"Generating dummy data in {output_dir}...")

def save_excel(df, name):
    path = output_dir / name
    try:
        df.to_excel(path, index=False)
        print(f"  - Saved {name}")
    except Exception as e:
        print(f"  - Error saving {name}: {e}")

# 1. Academic Years
academic_years = ['2023-24', '2024-25', '2025-26']

# 2. Classes & Sections
classes_data = []
for year in academic_years:
    for grade in range(1, 6):
        for section in ['A', 'B']:
            classes_data.append({
                'class_name': f'Class {grade}',
                'section_name': section,
                'room_number': f'{grade}0{1 if section=="A" else 2}',
                'capacity': 40,
                'academic_year': year
            })
save_excel(pd.DataFrame(classes_data), '01_classes_sections.xlsx')

# 3. Staff
staff_data = [
    {'first_name': 'Amit', 'last_name': 'Sharma', 'employee_id': 'EMP001', 'joining_date': '01-04-2022', 'designation': 'PRINCIPAL', 'department': 'Management', 'email': 'amit@school.edu', 'phone': '9876543210'},
    {'first_name': 'Priya', 'last_name': 'Verma', 'employee_id': 'EMP002', 'joining_date': '01-06-2022', 'designation': 'TEACHER', 'department': 'Mathematics', 'email': 'priya@school.edu', 'phone': '9876543211'},
    {'first_name': 'Rajesh', 'last_name': 'Kumar', 'employee_id': 'EMP003', 'joining_date': '15-06-2022', 'designation': 'TEACHER', 'department': 'Science', 'email': 'rajesh@school.edu', 'phone': '9876543212'},
    {'first_name': 'Sunita', 'last_name': 'Singh', 'employee_id': 'EMP004', 'joining_date': '01-07-2022', 'designation': 'TEACHER', 'department': 'English', 'email': 'sunita@school.edu', 'phone': '9876543213'},
    {'first_name': 'Vikram', 'last_name': 'Aditya', 'employee_id': 'EMP005', 'joining_date': '10-07-2022', 'designation': 'TEACHER', 'department': 'Social Studies', 'email': 'vikram@school.edu', 'phone': '9876543214'},
]
save_excel(pd.DataFrame(staff_data), '02_staff.xlsx')

# 4. Students (Basic Info)
students_data = []
for i in range(1, 21):
    gender = random.choice(['Male', 'Female'])
    f_name = f'Student_{i}'
    students_data.append({
        'first_name': f_name,
        'last_name': 'Surname',
        'admission_number': f'ADM2023{i:03d}',
        'date_of_birth': '10-05-2015',
        'gender': gender,
        'father_name': f'Father_{i}',
        'mother_name': f'Mother_{i}',
        'father_phone': f'9000000{i:03d}',
        'admission_date': '01-04-2023',
        'address': 'D-12, Green Park, City',
        'city': 'New Delhi',
        'state': 'Delhi',
        'postal_code': '110001'
    })
save_excel(pd.DataFrame(students_data), '03_students.xlsx')

# 5. Student Enrollments (3 Years migration)
enrollments_data = []
for year in ['2023-24', '2024-25', '2025-26']:
    for i in range(1, 21):
        # Simplistic promotion: 1->2, 2->3, etc.
        # ADM001 starts in Class 1 in 2023
        start_grade = 1 if i <= 10 else 2
        year_offset = int(year[:4]) - 2023
        current_grade = start_grade + year_offset
        if current_grade <= 5:
            enrollments_data.append({
                'admission_number': f'ADM2023{i:03d}',
                'class_name': f'Class {current_grade}',
                'section_name': 'A',
                'roll_number': str(i if i <= 10 else i-10),
                'enrollment_date': f'01-04-{year[:4]}',
                'academic_year': year
            })
save_excel(pd.DataFrame(enrollments_data), '04_student_enrollments.xlsx')

# 6. Fee Structures
fee_data = []
for year in academic_years:
    base_amount = 5000 if year == '2023-24' else (5500 if year == '2024-25' else 6000)
    for grade in range(1, 6):
        fee_data.append({
            'fee_type': 'Tuition Fee',
            'class_name': f'Class {grade}',
            'amount': base_amount + (grade * 500),
            'frequency': 'MONTHLY',
            'due_day': 10,
            'is_mandatory': 'true',
            'academic_year': year
        })
save_excel(pd.DataFrame(fee_data), '05_fee_structures.xlsx')

# 7. Attendance
attendance_data = []
for i in range(1, 6):
    for day in range(1, 6):
        attendance_data.append({
            'admission_number': f'ADM2023{i:03d}',
            'date': f'{day:02d}-04-2023',
            'status': 'PRESENT',
            'remarks': 'Migration Dummy'
        })
save_excel(pd.DataFrame(attendance_data), '06_attendance.xlsx')

# 8. Parents
parents_data = []
for i in range(1, 21):
    parents_data.append({
        'admission_number': f'ADM2023{i:03d}',
        'father_name': f'Father_{i}',
        'mother_name': f'Mother_{i}',
        'father_phone': f'9000000{i:03d}',
        'mother_phone': f'9000001{i:03d}',
        'father_email': f'father_{i}@example.com',
        'mother_email': f'mother_{i}@example.com',
        'father_occupation': 'Business',
        'mother_occupation': 'Homemaker'
    })
save_excel(pd.DataFrame(parents_data), '07_parents_info.xlsx')

# 9. Fee Invoices
invoices_data = []
for i in range(1, 21):
    for year in ['2023-24', '2024-25']:
        inv_no = f'INV/{year}/{i:03d}'
        invoices_data.append({
            'invoice_number': inv_no,
            'admission_number': f'ADM2023{i:03d}',
            'fee_type': 'Tuition Fee',
            'amount': 5000 if year == '2023-24' else 5500,
            'due_date': f'10-04-{year[:4]}',
            'invoice_date': f'01-04-{year[:4]}',
            'academic_year': year
        })
save_excel(pd.DataFrame(invoices_data), '08_fee_invoices.xlsx')

# 10. Fee Payments
payments_data = []
for i in range(1, 21):
    inv_no_2023 = f'INV/2023-24/{i:03d}'
    payments_data.append({
        'receipt_number': f'RCP/2023/{i:03d}',
        'invoice_number': inv_no_2023,
        'amount_paid': 5000,
        'payment_date': '15-04-2023',
        'payment_mode': 'CASH',
        'remarks': 'Fully paid'
    })
    if i <= 15:
        inv_no_2024 = f'INV/2024-25/{i:03d}'
        payments_data.append({
            'receipt_number': f'RCP/2024/{i:03d}',
            'invoice_number': inv_no_2024,
            'amount_paid': 5500,
            'payment_date': '12-04-2024',
            'payment_mode': 'ONLINE',
            'remarks': 'Online'
        })
save_excel(pd.DataFrame(payments_data), '09_fee_payments.xlsx')

# 11. User Accounts
users_data = []
for i in range(1, 21):
    users_data.append({
        'email': f'parent_{i}@example.com',
        'password': 'Password@123',
        'first_name': f'Father_{i}',
        'last_name': 'Surname',
        'role': 'PARENT',
        'admission_number': f'ADM2023{i:03d}',
        'employee_id': ''
    })
staff_creds = [('Amit', 'Sharma', 'EMP001', 'PRINCIPAL'), ('Priya', 'Verma', 'EMP002', 'TEACHER')]
for f, l, eid, role in staff_creds:
    users_data.append({
        'email': f'{f.lower()}@school.edu',
        'password': 'Staff@123',
        'first_name': f,
        'last_name': l,
        'role': 'STAFF' if role == 'PRINCIPAL' else 'TEACHER',
        'admission_number': '',
        'employee_id': eid
    })
save_excel(pd.DataFrame(users_data), '10_user_accounts.xlsx')

print("Done! Files generated in " + str(output_dir))
