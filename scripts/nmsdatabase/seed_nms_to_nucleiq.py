"""
NMS Database -> NucleiQ FULL CSV Template Population Script
===========================================================
Parses nmsdb.sql and generates ALL CSV files matching
the nucleIQ import system templates.

Output files (in scripts/nmsdatabase/output/):
  01_classes.csv              (class & section setup)
  03_subjects.csv             (subjects per class)
  04_fee_structures.csv       (fee types per class)
  05_students.csv             (student data)
  06_student_enrollments.csv  (enrollment data)
  08_fee_invoices.csv         (fee invoices per student)
  09_fee_payments.csv         (fee payment receipts)
  10_attendance.csv           (student attendance)
  11_exam_results.csv         (exam results)

NMS database has actual data ONLY in: student, enroll, class, section.
Fee/attendance/exam tables are empty, so those CSVs are generated using
realistic data derived from the student records.

Missing mandatory fields are filled with 'SYDON'.

Usage:
  python seed_nms_to_nucleiq.py
"""

import os
import re
import csv
import random
from datetime import date, datetime, timedelta

# ================================================================ #
#  Configuration
# ================================================================ #
PLACEHOLDER = 'SYDON'
ACADEMIC_YEAR = '2025-26'
YEAR_START = date(2025, 7, 7)    # Academic year start
YEAR_END = date(2026, 3, 31)     # Academic year end

# Seed random for reproducible output
random.seed(42)

# NMS class -> nucleIQ grade mapping
NMS_CLASS_TO_GRADE = {
    1: 'Nursery', 2: 'LKG', 3: 'UKG',
    4: 'Grade 1', 5: 'Grade 2', 6: 'Grade 3',
    7: 'Grade 4', 8: 'Grade 5',
}

# Subjects by grade level (nucleIQ format)
SUBJECTS_PRE_PRIMARY = [
    ('English',      'ENG',  6, 100),
    ('Mathematics',  'MATH', 5, 100),
    ('EVS',          'EVS',  4, 100),
    ('Hindi',        'HIN',  4, 100),
    ('Urdu',         'URD',  4, 100),
    ('Art & Craft',  'ART',  2, 50),
]

SUBJECTS_PRIMARY = [
    ('English',           'ENG',  6, 100),
    ('Mathematics',       'MATH', 6, 100),
    ('Science',           'SCI',  5, 100),
    ('Social Studies',    'SST',  5, 100),
    ('Hindi',             'HIN',  4, 100),
    ('Urdu',              'URD',  4, 100),
    ('Computer Science',  'CS',   2, 50),
    ('Physical Education','PE',   2, 50),
]

# Fee types
FEE_TYPES_PRE_PRIMARY = [
    ('Tuition Fee', 2000, 'MONTHLY', 'Tuition Fee'),
    ('Annual Fee',  5000, 'YEARLY',  'Annual Fee'),
    ('Library Fee',  500, 'YEARLY',  'Library Fee'),
    ('Sports Fee',  1000, 'YEARLY',  'Sports Fee'),
    ('Exam Fee',     500, 'HALF_YEARLY', 'Exam Fee'),
]

FEE_TYPES_PRIMARY = [
    ('Tuition Fee', 2500, 'MONTHLY', 'Tuition Fee'),
    ('Annual Fee',  6000, 'YEARLY',  'Annual Fee'),
    ('Lab Fee',     1000, 'YEARLY',  'Lab Fee'),
    ('Library Fee',  500, 'YEARLY',  'Library Fee'),
    ('Sports Fee',  1000, 'YEARLY',  'Sports Fee'),
    ('Exam Fee',     750, 'HALF_YEARLY', 'Exam Fee'),
]

# Exam definitions
EXAMS = [
    ('Unit Test 1', date(2025, 8, 25)),
    ('Midterm',     date(2025, 10, 15)),
    ('Unit Test 2', date(2025, 12, 15)),
    ('Final',       date(2026, 3, 10)),
]

PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE']
ATTENDANCE_STATUSES = ['PRESENT'] * 80 + ['ABSENT'] * 10 + ['LATE'] * 5 + ['HALF_DAY'] * 3 + ['LEAVE'] * 2
ABSENT_REMARKS = ['Sick', 'Family event', 'Not informed', 'Medical leave', '']
GRADES_MAP = [
    (90, 'A+'), (80, 'A'), (70, 'B+'), (60, 'B'),
    (50, 'C'),  (40, 'D'), (0, 'F'),
]

# ================================================================ #
#  SQL Parser Functions
# ================================================================ #

def parse_sql_file(filepath):
    for enc in ['utf-8', 'latin-1', 'cp1252', 'utf-8-sig']:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise Exception(f"Could not read {filepath}")


def extract_column_names(content, table_name):
    m = re.search(rf"INSERT INTO `{table_name}`\s*\(([^)]+)\)", content)
    return [c.strip().strip('`') for c in m.group(1).split(',')] if m else []


def parse_value(val):
    val = val.strip()
    if val.upper() == 'NULL':
        return None
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1].replace("\\'", "'").replace("\\\\", "\\")
    try:
        return float(val) if '.' in val else int(val)
    except ValueError:
        return val


def split_sql_values(values_str):
    result, current, in_str, esc = [], '', False, False
    for ch in values_str:
        if esc:
            current += ch; esc = False; continue
        if ch == '\\':
            current += ch; esc = True; continue
        if ch == "'":
            in_str = not in_str; current += ch; continue
        if ch == ',' and not in_str:
            result.append(current.strip()); current = ''; continue
        current += ch
    if current.strip():
        result.append(current.strip())
    return [parse_value(v) for v in result]


def parse_table_data(content, table_name):
    columns = extract_column_names(content, table_name)
    if not columns:
        return []
    pattern = rf"INSERT INTO `{table_name}`\s*\([^)]+\)\s*VALUES\s*\((.+?)\);"
    rows = []
    for m in re.findall(pattern, content, re.DOTALL):
        vals = split_sql_values(m)
        row = {}
        for i, col in enumerate(columns):
            row[col] = vals[i] if i < len(vals) else None
        rows.append(row)
    return rows


# ================================================================ #
#  Data Mapping Helpers
# ================================================================ #

def map_gender(g):
    if not g: return 'O'
    g = str(g).strip().lower()
    return 'M' if g in ('male','m') else 'F' if g in ('female','f') else 'O'

def map_date(d):
    if not d: return None
    try:
        dt = datetime.strptime(str(d).strip(), '%Y-%m-%d').date()
        return dt if dt.year >= 2000 else None
    except: return None

def fmt_date(d, fmt='%d-%m-%Y'):
    return d.strftime(fmt) if d else ''

def map_phone(p):
    if not p or 'No Phone' in str(p): return ''
    c = re.sub(r'[^\d+]', '', str(p).strip())
    return c if len(c) >= 10 else ''

def safe(val, default=''):
    return str(val).strip() if val else default

def mand(val):
    s = safe(val)
    return s if s else PLACEHOLDER

def get_grade_letter(score, max_marks):
    pct = (score / max_marks) * 100 if max_marks > 0 else 0
    for threshold, grade in GRADES_MAP:
        if pct >= threshold:
            return grade
    return 'F'

def school_days_between(start, end):
    """Generate list of school days (Mon-Sat) between dates."""
    days = []
    d = start
    while d <= end:
        if d.weekday() < 6:  # Mon-Sat
            days.append(d)
        d += timedelta(days=1)
    return days


# ================================================================ #
#  Main
# ================================================================ #

def main():
    print()
    print("=" * 70)
    print("  NMS -> NucleiQ FULL CSV Template Generator")
    print("  Academic Year: " + ACADEMIC_YEAR)
    print("  Placeholder: " + PLACEHOLDER)
    print("=" * 70)

    # ------------------------------------------------------------ #
    # 1. Parse SQL
    # ------------------------------------------------------------ #
    sql_path = os.path.join(os.path.dirname(__file__), 'nmsdb.sql')
    if not os.path.exists(sql_path):
        print(f"[ERROR] SQL file not found: {sql_path}")
        return

    print("\n[1/10] Parsing nmsdb.sql ...")
    content = parse_sql_file(sql_path)
    print(f"        File size: {len(content):,} chars")

    students_raw  = parse_table_data(content, 'student')
    enroll_raw    = parse_table_data(content, 'enroll')
    class_raw     = parse_table_data(content, 'class')
    section_raw   = parse_table_data(content, 'section')

    print(f"        Students:    {len(students_raw)}")
    print(f"        Enrollments: {len(enroll_raw)}")
    print(f"        Classes:     {len(class_raw)}")
    print(f"        Sections:    {len(section_raw)}")

    # Lookups
    class_map   = {r['id']: r['name'] for r in class_raw}
    section_map = {r['id']: r['name'] for r in section_raw}
    enroll_map  = {e['student_id']: e for e in enroll_raw if e.get('student_id')}

    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    os.makedirs(output_dir, exist_ok=True)

    # ------------------------------------------------------------ #
    # Build student list with mapped fields
    # ------------------------------------------------------------ #
    students = []
    for stu in students_raw:
        nms_id = stu.get('id')
        reg = safe(stu.get('register_no', ''))
        adm = reg if reg else f"NMS-{str(nms_id).zfill(4)}"

        ei = enroll_map.get(nms_id)
        cid = ei.get('class_id', 1) if ei else 1
        sid = ei.get('section_id', 1) if ei else 1
        roll = ei.get('roll', 0) if ei else 0

        grade = NMS_CLASS_TO_GRADE.get(cid, class_map.get(cid, 'Nursery'))
        section = section_map.get(sid, 'A')

        dob = map_date(stu.get('birthday')) or date(2015, 1, 1)
        adm_date = map_date(stu.get('admission_date')) or YEAR_START
        phone = map_phone(stu.get('mobileno'))
        gender = map_gender(stu.get('gender'))

        students.append({
            'admission_number': adm,
            'first_name': mand(stu.get('first_name')),
            'last_name': safe(stu.get('last_name', '')),
            'gender': gender,
            'dob': dob,
            'admission_date': adm_date,
            'phone': phone,
            'email': safe(stu.get('email', '')),
            'religion': safe(stu.get('religion', '')),
            'caste': safe(stu.get('caste', '')),
            'blood_group': safe(stu.get('blood_group', '')),
            'address': ', '.join(filter(None, [
                safe(stu.get('current_address','')),
                safe(stu.get('city','')),
                safe(stu.get('state',''))
            ])),
            'class_name': grade,
            'section_name': section,
            'roll_number': str(roll) if roll else str(len(students) + 1),
        })

    # ------------------------------------------------------------ #
    # 2. Classes CSV
    # ------------------------------------------------------------ #
    print("\n[2/10] Generating 01_classes.csv ...")
    grades_used = sorted(set(s['class_name'] for s in students),
                         key=lambda g: list(NMS_CLASS_TO_GRADE.values()).index(g)
                         if g in NMS_CLASS_TO_GRADE.values() else 99)

    classes_path = os.path.join(output_dir, '01_classes.csv')
    with open(classes_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['class_name','section_name','room_number','capacity','academic_year'])
        room = 101
        for g in grades_used:
            w.writerow([g, 'A', room, 40, ACADEMIC_YEAR])
            room += 1
    print(f"        {len(grades_used)} classes -> {classes_path}")

    # ------------------------------------------------------------ #
    # 3. Subjects CSV
    # ------------------------------------------------------------ #
    print("\n[3/10] Generating 03_subjects.csv ...")
    pre_primary = {'Nursery', 'LKG', 'UKG'}
    subjects_path = os.path.join(output_dir, '03_subjects.csv')
    subject_map = {}  # grade -> list of (name, code, max_marks)

    with open(subjects_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['subject_name','subject_code','class_name','credit_hours','is_elective','max_marks'])
        for g in grades_used:
            subs = SUBJECTS_PRE_PRIMARY if g in pre_primary else SUBJECTS_PRIMARY
            grade_suffix = g.replace('Grade ', '').replace(' ', '')
            subject_list = []
            for name, code_prefix, hours, max_m in subs:
                code = f"{code_prefix}{grade_suffix}"
                w.writerow([name, code, g, hours, 'false', max_m])
                subject_list.append((name, code, max_m))
            subject_map[g] = subject_list

    total_subjects = sum(len(v) for v in subject_map.values())
    print(f"        {total_subjects} subjects -> {subjects_path}")

    # ------------------------------------------------------------ #
    # 4. Fee Structures CSV
    # ------------------------------------------------------------ #
    print("\n[4/10] Generating 04_fee_structures.csv ...")
    fees_path = os.path.join(output_dir, '04_fee_structures.csv')
    fee_types_by_grade = {}

    with open(fees_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['fee_type','class_name','amount','frequency','due_day','is_mandatory','description','academic_year'])
        cnt = 0
        for g in grades_used:
            ftypes = FEE_TYPES_PRE_PRIMARY if g in pre_primary else FEE_TYPES_PRIMARY
            grade_fees = []
            for fee_name, amt, freq, desc in ftypes:
                w.writerow([fee_name, g, amt, freq, 10, 'true', f'{desc} for {g}', ACADEMIC_YEAR])
                grade_fees.append((fee_name, amt, freq))
                cnt += 1
            fee_types_by_grade[g] = grade_fees

    print(f"        {cnt} fee structures -> {fees_path}")

    # ------------------------------------------------------------ #
    # 5. Students CSV
    # ------------------------------------------------------------ #
    print("\n[5/10] Generating 05_students.csv ...")
    stu_headers = [
        'first_name','admission_number','date_of_birth','gender',
        'father_name','mother_name','father_phone',
        'middle_name','last_name','admission_date',
        'email','phone','address','blood_group',
        'mother_phone','father_email','mother_email',
        'father_occupation','mother_occupation',
        'aadhar_number','nationality','religion','caste',
        'class_name','section_name','roll_number'
    ]
    stu_path = os.path.join(output_dir, '05_students.csv')
    with open(stu_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=stu_headers)
        w.writeheader()
        for s in students:
            w.writerow({
                'first_name':        s['first_name'],
                'admission_number':  s['admission_number'],
                'date_of_birth':     fmt_date(s['dob']),
                'gender':            s['gender'],
                'father_name':       PLACEHOLDER,
                'mother_name':       PLACEHOLDER,
                'father_phone':      s['phone'],
                'middle_name':       '',
                'last_name':         s['last_name'],
                'admission_date':    fmt_date(s['admission_date']),
                'email':             s['email'],
                'phone':             s['phone'],
                'address':           s['address'],
                'blood_group':       s['blood_group'],
                'mother_phone':      '',
                'father_email':      '',
                'mother_email':      '',
                'father_occupation': PLACEHOLDER,
                'mother_occupation': PLACEHOLDER,
                'aadhar_number':     '',
                'nationality':       'Indian',
                'religion':          s['religion'],
                'caste':             s['caste'],
                'class_name':        s['class_name'],
                'section_name':      s['section_name'],
                'roll_number':       s['roll_number'],
            })
    print(f"        {len(students)} students -> {stu_path}")

    # ------------------------------------------------------------ #
    # 6. Student Enrollments CSV
    # ------------------------------------------------------------ #
    print("\n[6/10] Generating 06_student_enrollments.csv ...")
    enr_path = os.path.join(output_dir, '06_student_enrollments.csv')
    with open(enr_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['admission_number','class_name','section_name','roll_number','enrollment_date','academic_year'])
        for s in students:
            w.writerow([
                s['admission_number'], s['class_name'], s['section_name'],
                s['roll_number'], s['admission_date'].strftime('%d/%m/%Y'), ACADEMIC_YEAR
            ])
    print(f"        {len(students)} enrollments -> {enr_path}")

    # ------------------------------------------------------------ #
    # 7. Fee Invoices CSV
    # ------------------------------------------------------------ #
    print("\n[7/10] Generating 08_fee_invoices.csv ...")
    inv_path = os.path.join(output_dir, '08_fee_invoices.csv')
    invoices = []  # collect for payment generation
    inv_num = 0

    with open(inv_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['invoice_number','admission_number','fee_type','amount','due_date','invoice_date','academic_year'])

        for s in students:
            grade_fees = fee_types_by_grade.get(s['class_name'], FEE_TYPES_PRE_PRIMARY)
            for fee_name, amt, freq in grade_fees:
                if freq == 'MONTHLY':
                    # Generate monthly invoices Jul 2025 - Mar 2026
                    for month_offset in range(9):  # Jul to Mar = 9 months
                        inv_num += 1
                        inv_id = f"INV/{ACADEMIC_YEAR}/{str(inv_num).zfill(6)}"
                        inv_month = YEAR_START.month + month_offset
                        inv_year = YEAR_START.year + (inv_month - 1) // 12
                        inv_month = ((inv_month - 1) % 12) + 1
                        inv_date = date(inv_year, inv_month, 1)
                        due_date = date(inv_year, inv_month, 10)

                        w.writerow([inv_id, s['admission_number'], fee_name, amt,
                                    fmt_date(due_date), fmt_date(inv_date), ACADEMIC_YEAR])
                        invoices.append({
                            'inv_id': inv_id, 'adm': s['admission_number'],
                            'fee_type': fee_name, 'amount': amt,
                            'due_date': due_date, 'inv_date': inv_date,
                        })

                elif freq == 'YEARLY':
                    inv_num += 1
                    inv_id = f"INV/{ACADEMIC_YEAR}/{str(inv_num).zfill(6)}"
                    inv_date = YEAR_START
                    due_date = YEAR_START + timedelta(days=15)
                    w.writerow([inv_id, s['admission_number'], fee_name, amt,
                                fmt_date(due_date), fmt_date(inv_date), ACADEMIC_YEAR])
                    invoices.append({
                        'inv_id': inv_id, 'adm': s['admission_number'],
                        'fee_type': fee_name, 'amount': amt,
                        'due_date': due_date, 'inv_date': inv_date,
                    })

                elif freq == 'HALF_YEARLY':
                    for hi, h_date in enumerate([YEAR_START, date(2026, 1, 1)]):
                        inv_num += 1
                        inv_id = f"INV/{ACADEMIC_YEAR}/{str(inv_num).zfill(6)}"
                        due_date = h_date + timedelta(days=15)
                        w.writerow([inv_id, s['admission_number'], fee_name, amt // 2,
                                    fmt_date(due_date), fmt_date(h_date), ACADEMIC_YEAR])
                        invoices.append({
                            'inv_id': inv_id, 'adm': s['admission_number'],
                            'fee_type': fee_name, 'amount': amt // 2,
                            'due_date': due_date, 'inv_date': h_date,
                        })

    print(f"        {len(invoices)} invoices -> {inv_path}")

    # ------------------------------------------------------------ #
    # 8. Fee Payments CSV (pay ~85% of invoices)
    # ------------------------------------------------------------ #
    print("\n[8/10] Generating 09_fee_payments.csv ...")
    pay_path = os.path.join(output_dir, '09_fee_payments.csv')
    pay_count = 0

    with open(pay_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['receipt_number','invoice_number','amount_paid','payment_date','payment_mode','remarks'])

        for inv in invoices:
            # ~85% chance of being paid
            if random.random() > 0.85:
                continue
            pay_count += 1
            rcp_id = f"RCP/{ACADEMIC_YEAR}/{str(pay_count).zfill(6)}"
            # Payment date = due_date + random 0-15 days
            pay_date = inv['due_date'] + timedelta(days=random.randint(0, 15))
            if pay_date > date(2026, 3, 31):
                pay_date = date(2026, 3, 31)
            mode = random.choice(PAYMENT_MODES)
            w.writerow([rcp_id, inv['inv_id'], inv['amount'],
                        fmt_date(pay_date), mode, ''])

    print(f"        {pay_count} payments -> {pay_path}")

    # ------------------------------------------------------------ #
    # 9. Attendance CSV (sample ~30 records per student)
    # ------------------------------------------------------------ #
    print("\n[9/10] Generating 10_attendance.csv ...")
    att_path = os.path.join(output_dir, '10_attendance.csv')
    att_count = 0

    # School days from July 2025 to Mar 2026 (sample some)
    all_school_days = school_days_between(YEAR_START, YEAR_END)
    # Pick around 30 random sample days per student
    sample_size = min(30, len(all_school_days))

    with open(att_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['admission_number','date','status','remarks'])

        for s in students:
            days = random.sample(all_school_days, sample_size)
            for day in sorted(days):
                status = random.choice(ATTENDANCE_STATUSES)
                remarks = ''
                if status in ('ABSENT', 'LEAVE'):
                    remarks = random.choice(ABSENT_REMARKS)
                w.writerow([s['admission_number'], fmt_date(day), status, remarks])
                att_count += 1

    print(f"        {att_count} attendance records -> {att_path}")

    # ------------------------------------------------------------ #
    # 10. Exam Results CSV
    # ------------------------------------------------------------ #
    print("\n[10/10] Generating 11_exam_results.csv ...")
    exam_path = os.path.join(output_dir, '11_exam_results.csv')
    exam_count = 0

    with open(exam_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['admission_number','exam_name','subject_code','max_marks',
                     'marks_obtained','grade','exam_date','academic_year'])

        for s in students:
            subs = subject_map.get(s['class_name'], [])
            for exam_name, exam_date in EXAMS:
                # Each student takes 3-4 random subjects per exam
                exam_subjects = random.sample(subs, min(random.randint(3, len(subs)), len(subs)))
                for sub_name, sub_code, max_marks in exam_subjects:
                    marks = round(random.uniform(25, max_marks), 1)
                    grade_letter = get_grade_letter(marks, max_marks)
                    w.writerow([
                        s['admission_number'], exam_name, sub_code, max_marks,
                        marks, grade_letter, fmt_date(exam_date), ACADEMIC_YEAR
                    ])
                    exam_count += 1

    print(f"        {exam_count} exam results -> {exam_path}")

    # ------------------------------------------------------------ #
    # Summary
    # ------------------------------------------------------------ #
    print("\n" + "=" * 70)
    print("  DONE! All CSV files generated successfully.")
    print("=" * 70)
    print(f"""
  Output directory: {output_dir}

  Files generated:
    1. 01_classes.csv               ({len(grades_used)} classes)
    2. 03_subjects.csv              ({total_subjects} subjects)
    3. 04_fee_structures.csv        ({cnt} fee structures)
    4. 05_students.csv              ({len(students)} students)
    5. 06_student_enrollments.csv   ({len(students)} enrollments)
    6. 08_fee_invoices.csv          ({len(invoices)} invoices)
    7. 09_fee_payments.csv          ({pay_count} payments)
    8. 10_attendance.csv            ({att_count} records)
    9. 11_exam_results.csv          ({exam_count} results)

  Class Mapping (NMS -> NucleiQ):
    Nursery   -> Nursery       LKG       -> LKG
    UKG       -> UKG           1st Class -> Grade 1
    2nd Class -> Grade 2       3rd Class -> Grade 3
    4th Class -> Grade 4       5th Class -> Grade 5

  Fields filled with '{PLACEHOLDER}':
    - father_name, mother_name
    - father_occupation, mother_occupation

  Note: Fee, attendance, and exam data are generated because
  the NMS database has no entries in those tables.

  Next Steps:
    1. Open the CSV files in Excel and review
    2. Import via nucleIQ admin panel
    3. Update '{PLACEHOLDER}' with actual parent/guardian data
""")


if __name__ == '__main__':
    main()
