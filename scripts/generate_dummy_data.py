"""
nucleIQ Dummy Data Generator
==============================
Generates 3 academic years (2023-2024, 2024-2025, 2025-2026) of realistic
dummy data matching all import templates. Outputs CSV files and a ZIP of
student photos.

Usage:
    python generate_dummy_data.py

Output directory: ./dummy_data/
"""

import csv
import os
import io
import random
import zipfile
from datetime import date, datetime, timedelta
from collections import defaultdict

# ============================================================================
# CONFIGURATION
# ============================================================================
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dummy_data")

ACADEMIC_YEARS = [
    {"name": "2023-24", "start": date(2023, 4, 1), "end": date(2024, 3, 31)},
    {"name": "2024-25", "start": date(2024, 4, 1), "end": date(2025, 3, 31)},
    {"name": "2025-26", "start": date(2025, 4, 1), "end": date(2026, 3, 31)},
]

# Classes: Nursery through Class 10 (13 classes)
CLASSES = [
    "Nursery", "LKG", "UKG",
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
]

SECTIONS = ["A", "B"]  # 2 sections per class
CAPACITY_PER_SECTION = 30

# Number of students per section (aiming for ~500+ total)
STUDENTS_PER_SECTION = 20  # 13 classes * 2 sections * 20 = 520 students

# ============================================================================
# REALISTIC DATA POOLS
# ============================================================================
FIRST_NAMES_MALE = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav", "Advaith",
    "Dhruv", "Kabir", "Ritvik", "Aarush", "Kian", "Darsh", "Virat", "Rudra",
    "Ansh", "Arnav", "Siddharth", "Yash", "Rohan", "Harsh", "Dev", "Kartik",
    "Rishi", "Tanmay", "Om", "Sahil", "Nikhil", "Akshay", "Varun", "Raj",
    "Kunal", "Manish", "Amit", "Rahul", "Gaurav", "Prateek", "Mohit", "Deepak",
    "Vikram", "Suresh", "Mahesh", "Naveen", "Pavan", "Karthik", "Ajay", "Anand",
    "Bharath", "Chandru", "Dinesh", "Eshan", "Farhan", "Gopal", "Hari", "Irfan",
]

FIRST_NAMES_FEMALE = [
    "Aanya", "Saanvi", "Aadya", "Diya", "Myra", "Ananya", "Aadhya", "Pari",
    "Sara", "Aarohi", "Kavya", "Navya", "Riya", "Anika", "Ishita", "Prisha",
    "Siya", "Tanvi", "Avni", "Kiara", "Zara", "Mahi", "Shanaya", "Tara",
    "Nisha", "Pooja", "Swati", "Sunita", "Meera", "Lata", "Neha", "Priya",
    "Deepa", "Anjali", "Shruti", "Divya", "Pallavi", "Rashmi", "Seema", "Uma",
    "Vani", "Yamini", "Bhavna", "Chitra", "Durga", "Ekta", "Fatima", "Gayatri",
    "Hema", "Indu", "Jaya", "Kamala", "Lalitha", "Madhuri", "Nandini", "Padma",
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Joshi", "Reddy",
    "Nair", "Iyer", "Rao", "Das", "Mukherjee", "Banerjee", "Ghosh", "Shah",
    "Mishra", "Dubey", "Pandey", "Tiwari", "Agarwal", "Mehta", "Chopra", "Kapoor",
    "Malhotra", "Bhatia", "Saxena", "Chauhan", "Yadav", "Jain", "Khanna", "Sethi",
    "Sood", "Arora", "Bedi", "Gill", "Mann", "Bajaj", "Ahuja", "Talwar",
    "Narayan", "Menon", "Pillai", "Kaur", "Dhawan", "Bhatt", "Shukla", "Srivastava",
    "Thakur", "Rathore",
]

FATHER_OCCUPATIONS = [
    "Business", "Engineer", "Doctor", "Teacher", "Government Employee",
    "Lawyer", "Banker", "Accountant", "Farmer", "Shopkeeper",
    "IT Professional", "Manager", "Contractor", "Mechanic", "Driver",
    "Self Employed", "Army Officer", "Police Officer", "Professor", "Architect",
]

MOTHER_OCCUPATIONS = [
    "Homemaker", "Teacher", "Doctor", "Nurse", "Engineer",
    "Banker", "Accountant", "IT Professional", "Social Worker", "Professor",
    "Business", "Government Employee", "Lawyer", "Artist", "Pharmacist",
]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
BLOOD_GROUP_WEIGHTS = [0.22, 0.05, 0.30, 0.08, 0.07, 0.02, 0.22, 0.04]

RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"]
RELIGION_WEIGHTS = [0.55, 0.20, 0.10, 0.08, 0.03, 0.02, 0.02]

CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"]
CATEGORY_WEIGHTS = [0.35, 0.30, 0.15, 0.10, 0.10]

CITIES = [
    "Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar",
    "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad",
]

STATES = ["Telangana"]

DESIGNATIONS_TEACHING = ["TEACHER", "ASSISTANT_TEACHER", "HEAD_TEACHER"]
DESIGNATIONS_ADMIN = ["PRINCIPAL", "VICE_PRINCIPAL", "ACCOUNTANT", "CLERK", "RECEPTIONIST", "LIBRARIAN", "COUNSELOR", "LAB_ASSISTANT"]
DESIGNATIONS_SUPPORT = ["SECURITY", "PEON", "DRIVER", "OTHER"]

DEPARTMENTS = [
    "Mathematics", "Science", "English", "Social Studies", "Hindi",
    "Telugu", "Computer Science", "Physical Education", "Arts", "Administration",
]

SUBJECTS = {
    # Class group: [(subject_name, subject_code, credit_hours, max_marks)]
    "primary_lower": [  # Nursery, LKG, UKG
        ("English", "ENG", 6, 100),
        ("Mathematics", "MATH", 5, 100),
        ("EVS", "EVS", 4, 100),
        ("Hindi", "HIN", 4, 100),
        ("Telugu", "TEL", 4, 100),
        ("Art & Craft", "ART", 2, 50),
    ],
    "primary_upper": [  # Class 1-5
        ("English", "ENG", 6, 100),
        ("Mathematics", "MATH", 6, 100),
        ("Science", "SCI", 5, 100),
        ("Social Studies", "SST", 5, 100),
        ("Hindi", "HIN", 4, 100),
        ("Telugu", "TEL", 4, 100),
        ("Computer Science", "CS", 2, 50),
        ("Physical Education", "PE", 2, 50),
    ],
    "secondary": [  # Class 6-10
        ("English", "ENG", 6, 100),
        ("Mathematics", "MATH", 6, 100),
        ("Science", "SCI", 6, 100),
        ("Social Studies", "SST", 5, 100),
        ("Hindi", "HIN", 4, 100),
        ("Telugu", "TEL", 4, 100),
        ("Computer Science", "CS", 3, 100),
        ("Physical Education", "PE", 2, 50),
        ("Art", "ART", 2, 50),
    ],
}

FEE_TYPES = [
    {"name": "Tuition Fee", "frequency": "MONTHLY", "amounts": {"lower": 2000, "upper": 3000, "secondary": 4000}},
    {"name": "Annual Fee", "frequency": "YEARLY", "amounts": {"lower": 5000, "upper": 6000, "secondary": 8000}},
    {"name": "Lab Fee", "frequency": "YEARLY", "amounts": {"lower": 0, "upper": 1000, "secondary": 2000}},
    {"name": "Library Fee", "frequency": "YEARLY", "amounts": {"lower": 500, "upper": 500, "secondary": 1000}},
    {"name": "Sports Fee", "frequency": "YEARLY", "amounts": {"lower": 1000, "upper": 1000, "secondary": 1500}},
    {"name": "Exam Fee", "frequency": "HALF_YEARLY", "amounts": {"lower": 500, "upper": 750, "secondary": 1000}},
]

PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"]
PAYMENT_MODE_WEIGHTS = [0.30, 0.35, 0.15, 0.10, 0.10]


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def fmt_date(d):
    """Format date as DD-MM-YYYY for templates"""
    if d is None:
        return ""
    return d.strftime("%d-%m-%Y")


def random_phone():
    """Generate a random 10-digit Indian mobile"""
    return f"9{random.randint(100000000, 999999999)}"


def random_email(first, last, domain="school.edu.in"):
    """Generate a semi-realistic email"""
    return f"{first.lower()}.{last.lower()}{random.randint(1,99)}@{domain}"


def random_aadhar():
    """Generate a random 12-digit Aadhar number"""
    return f"{random.randint(100000000000, 999999999999)}"


def random_pan():
    """Generate a random PAN-like string"""
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return f"{''.join(random.choices(letters, k=5))}{random.randint(1000,9999)}{''.join(random.choices(letters, k=1))}"


def get_class_group(class_name):
    """Return class grouping for subject/fee mapping"""
    if class_name in ("Nursery", "LKG", "UKG"):
        return "primary_lower"
    elif class_name in ("Class 1", "Class 2", "Class 3", "Class 4", "Class 5"):
        return "primary_upper"
    else:
        return "secondary"


def get_fee_tier(class_name):
    """Return fee tier name"""
    group = get_class_group(class_name)
    if group == "primary_lower":
        return "lower"
    elif group == "primary_upper":
        return "upper"
    return "secondary"


def random_dob(class_name, academic_year_start):
    """Generate a realistic DOB based on class and academic year"""
    class_age_map = {
        "Nursery": 3, "LKG": 4, "UKG": 5,
        "Class 1": 6, "Class 2": 7, "Class 3": 8, "Class 4": 9, "Class 5": 10,
        "Class 6": 11, "Class 7": 12, "Class 8": 13, "Class 9": 14, "Class 10": 15,
    }
    base_age = class_age_map.get(class_name, 10)
    birth_year = academic_year_start.year - base_age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)
    return date(birth_year, birth_month, birth_day)


def write_csv(filepath, headers, rows):
    """Write rows to a CSV file with BOM for Excel"""
    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
    print(f"  ✅ Generated: {os.path.basename(filepath)} ({len(rows)} rows)")


# ============================================================================
# DATA GENERATORS
# ============================================================================

class DummyDataGenerator:
    """Main generator class"""

    def __init__(self):
        self.students = []  # All students across all years
        self.staff_records = []
        self.student_id_counter = 0
        self.staff_id_counter = 0
        self.invoice_counter = 0
        self.receipt_counter = 0

    def run(self):
        """Generate all data files"""
        ensure_dir(OUTPUT_DIR)
        print("=" * 70)
        print("  nucleIQ DUMMY DATA GENERATOR")
        print("  Generating 3 academic years of realistic school data")
        print("=" * 70)

        # Phase 1: Foundation
        print("\n📁 PHASE 1: FOUNDATION DATA")
        self.generate_classes()
        self.generate_staff()

        # Phase 2: Academic Structure
        print("\n📁 PHASE 2: ACADEMIC STRUCTURE")
        self.generate_subjects()
        self.generate_fee_structures()

        # Phase 3: Students (with progression across years)
        print("\n📁 PHASE 3: STUDENT DATA (3 years)")
        self.generate_students()
        self.generate_enrollments()

        # Phase 4: User Accounts
        print("\n📁 PHASE 4: USER ACCOUNTS")
        self.generate_user_accounts()

        # Phase 5: Fee Transactions
        print("\n📁 PHASE 5: FEE TRANSACTIONS")
        self.generate_fee_invoices_and_payments()

        # Phase 6: Attendance & Exams
        print("\n📁 PHASE 6: ATTENDANCE & EXAMS")
        self.generate_attendance()
        self.generate_exam_results()

        # Phase 9: Photos
        print("\n📁 PHASE 9: STUDENT PHOTOS")
        self.generate_photo_zip()

        print("\n" + "=" * 70)
        print(f"  ✅ ALL FILES GENERATED IN: {OUTPUT_DIR}")
        print(f"  Total Students: {len(self.students)}")
        print(f"  Total Staff: {len(self.staff_records)}")
        print("=" * 70)
        self._print_upload_order()

    # ------------------------------------------------------------------
    #  1. CLASSES
    # ------------------------------------------------------------------
    def generate_classes(self):
        headers = ["class_name", "section_name", "room_number", "capacity", "academic_year"]
        rows = []
        room = 100
        for ay in ACADEMIC_YEARS:
            for cls in CLASSES:
                for sec in SECTIONS:
                    room += 1
                    rows.append([cls, sec, str(room), CAPACITY_PER_SECTION, ay["name"]])
        write_csv(os.path.join(OUTPUT_DIR, "01_classes.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  2. STAFF
    # ------------------------------------------------------------------
    def generate_staff(self):
        headers = [
            "first_name", "last_name", "employee_id", "joining_date", "designation",
            "email", "phone", "date_of_birth", "gender", "department",
            "employment_type", "address", "city", "state", "salary",
            "aadhar_number", "blood_group", "experience_years",
        ]
        rows = []

        # Principal (1)
        self.staff_id_counter += 1
        rows.append(self._make_staff("Rajesh", "Sharma", "PRINCIPAL", "Administration", 95000, 25, "MALE"))

        # Vice Principal (1)
        self.staff_id_counter += 1
        rows.append(self._make_staff("Sunita", "Verma", "VICE_PRINCIPAL", "Administration", 80000, 20, "FEMALE"))

        # Accountant (1)
        self.staff_id_counter += 1
        rows.append(self._make_staff("Manoj", "Gupta", "ACCOUNTANT", "Administration", 45000, 15, "MALE"))

        # Clerks (2)
        for _ in range(2):
            self.staff_id_counter += 1
            g = random.choice(["MALE", "FEMALE"])
            fn = random.choice(FIRST_NAMES_MALE if g == "MALE" else FIRST_NAMES_FEMALE)
            rows.append(self._make_staff(fn, random.choice(LAST_NAMES), "CLERK", "Administration", 30000, random.randint(3, 10), g))

        # Teachers (26 = 13 classes * 2 sections, at least 1 per section)
        for dept in DEPARTMENTS[:8]:  # 8 departments
            for _ in range(3):  # 3 teachers per dept = 24 teachers
                self.staff_id_counter += 1
                g = random.choice(["MALE", "FEMALE"])
                fn = random.choice(FIRST_NAMES_MALE if g == "MALE" else FIRST_NAMES_FEMALE)
                desg = random.choice(DESIGNATIONS_TEACHING)
                sal = random.randint(35000, 65000)
                exp = random.randint(2, 20)
                rows.append(self._make_staff(fn, random.choice(LAST_NAMES), desg, dept, sal, exp, g))

        # Librarian (1)
        self.staff_id_counter += 1
        rows.append(self._make_staff("Kavita", "Nair", "LIBRARIAN", "Administration", 35000, 10, "FEMALE"))

        # Lab Assistant (2)
        for _ in range(2):
            self.staff_id_counter += 1
            g = random.choice(["MALE", "FEMALE"])
            fn = random.choice(FIRST_NAMES_MALE if g == "MALE" else FIRST_NAMES_FEMALE)
            rows.append(self._make_staff(fn, random.choice(LAST_NAMES), "LAB_ASSISTANT", "Science", 28000, random.randint(2, 8), g))

        # Support staff (5)
        for desg in ["SECURITY", "PEON", "PEON", "DRIVER", "DRIVER"]:
            self.staff_id_counter += 1
            fn = random.choice(FIRST_NAMES_MALE)
            rows.append(self._make_staff(fn, random.choice(LAST_NAMES), desg, "Administration", random.randint(18000, 25000), random.randint(1, 10), "MALE"))

        self.staff_records = rows
        write_csv(os.path.join(OUTPUT_DIR, "02_staff.csv"), headers, rows)

    def _make_staff(self, first, last, designation, department, salary, exp, gender):
        emp_id = f"EMP{self.staff_id_counter:03d}"
        join_year = 2026 - exp
        join_date = date(max(join_year, 2010), random.randint(4, 8), random.randint(1, 28))
        dob = date(2026 - exp - random.randint(23, 35), random.randint(1, 12), random.randint(1, 28))
        city = random.choice(CITIES)
        return [
            first, last, emp_id, fmt_date(join_date), designation,
            random_email(first, last), random_phone(),
            fmt_date(dob), gender, department,
            "PERMANENT" if exp > 5 else random.choice(["PERMANENT", "CONTRACT"]),
            f"{random.randint(1,500)}, {random.choice(['MG Road', 'Jubilee Hills', 'Banjara Hills', 'Kukatpally', 'Miyapur', 'Gachibowli'])}, {city}",
            city, "Telangana", salary,
            random_aadhar(), random.choices(BLOOD_GROUPS, BLOOD_GROUP_WEIGHTS)[0], exp,
        ]

    # ------------------------------------------------------------------
    #  3. SUBJECTS
    # ------------------------------------------------------------------
    def generate_subjects(self):
        headers = ["subject_name", "subject_code", "class_name", "credit_hours", "is_elective", "max_marks"]
        rows = []
        for cls in CLASSES:
            group = get_class_group(cls)
            subj_list = SUBJECTS.get(group, SUBJECTS["primary_upper"])
            class_short = cls.replace("Class ", "").replace(" ", "")
            for subj_name, subj_code_base, hours, marks in subj_list:
                code = f"{subj_code_base}{class_short}"
                rows.append([subj_name, code, cls, hours, "false", marks])
        write_csv(os.path.join(OUTPUT_DIR, "03_subjects.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  4. FEE STRUCTURES
    # ------------------------------------------------------------------
    def generate_fee_structures(self):
        headers = ["fee_type", "class_name", "amount", "frequency", "due_day", "is_mandatory", "description", "academic_year"]
        rows = []
        for ay in ACADEMIC_YEARS:
            for cls in CLASSES:
                tier = get_fee_tier(cls)
                for ft in FEE_TYPES:
                    amt = ft["amounts"][tier]
                    if amt > 0:
                        rows.append([
                            ft["name"], cls, amt, ft["frequency"],
                            10, "true", f"{ft['name']} for {cls}", ay["name"]
                        ])
        write_csv(os.path.join(OUTPUT_DIR, "04_fee_structures.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  5. STUDENTS (with progression over 3 years)
    # ------------------------------------------------------------------
    def generate_students(self):
        headers = [
            "first_name", "admission_number", "date_of_birth", "gender",
            "father_name", "mother_name", "father_phone",
            "middle_name", "last_name", "admission_date", "email", "phone",
            "address", "blood_group", "mother_phone", "father_email", "mother_email",
            "father_occupation", "mother_occupation",
            "aadhar_number", "nationality", "religion", "caste",
            "class_name", "section_name", "roll_number",
        ]
        rows = []
        self.students = []

        # Generate students for the FIRST academic year (2023-24)
        # They will then be promoted in subsequent years
        ay = ACADEMIC_YEARS[0]

        for cls_idx, cls in enumerate(CLASSES):
            for sec in SECTIONS:
                for stu_num in range(1, STUDENTS_PER_SECTION + 1):
                    self.student_id_counter += 1
                    gender = random.choice(["M", "F"])
                    first = random.choice(FIRST_NAMES_MALE if gender == "M" else FIRST_NAMES_FEMALE)
                    last = random.choice(LAST_NAMES)
                    middle = random.choice(["", "Kumar", "Devi", "Kumari", "Lal", "Mohan", "Ram"])

                    admission_no = f"STU{self.student_id_counter:04d}"
                    dob = random_dob(cls, ay["start"])
                    admission_date = ay["start"] - timedelta(days=random.randint(0, 30))

                    father_first = random.choice(FIRST_NAMES_MALE)
                    father_last = last
                    mother_first = random.choice(FIRST_NAMES_FEMALE)

                    father_phone = random_phone()
                    mother_phone = random_phone()
                    city = random.choice(CITIES)

                    student_record = {
                        "admission_number": admission_no,
                        "first_name": first,
                        "last_name": last,
                        "gender": gender,
                        "dob": dob,
                        "initial_class": cls,
                        "initial_class_idx": cls_idx,
                        "section": sec,
                        "father_name": f"{father_first} {father_last}",
                        "mother_name": f"{mother_first} {last}",
                    }
                    self.students.append(student_record)

                    rows.append([
                        first, admission_no, fmt_date(dob), gender,
                        f"{father_first} {father_last}",
                        f"{mother_first} {last}",
                        father_phone,
                        middle, last, fmt_date(admission_date),
                        random_email(first, last, "student.nucleiq.in") if random.random() > 0.5 else "",
                        random_phone() if random.random() > 0.6 else "",
                        f"{random.randint(1,500)}, {random.choice(['Gandhi Nagar', 'Nehru Colony', 'Patel Road', 'Ambedkar Street', 'Lake View'])}, {city}",
                        random.choices(BLOOD_GROUPS, BLOOD_GROUP_WEIGHTS)[0],
                        mother_phone,
                        random_email(father_first, father_last, "gmail.com") if random.random() > 0.4 else "",
                        random_email(mother_first, last, "gmail.com") if random.random() > 0.6 else "",
                        random.choice(FATHER_OCCUPATIONS),
                        random.choice(MOTHER_OCCUPATIONS),
                        random_aadhar() if random.random() > 0.3 else "",
                        "Indian", 
                        random.choices(RELIGIONS, RELIGION_WEIGHTS)[0],
                        random.choices(CATEGORIES, CATEGORY_WEIGHTS)[0],
                        cls, sec, str(stu_num),
                    ])

        self._generate_100_special_students(rows, ay)
        write_csv(os.path.join(OUTPUT_DIR, "05_students.csv"), headers, rows)

    def _generate_100_special_students(self, rows, ay):
        # 100 students total
        
        # 20 pairs of siblings (40 students)
        for i in range(20):
            father_first, last, mother_first = random.choice(FIRST_NAMES_MALE), random.choice(LAST_NAMES), random.choice(FIRST_NAMES_FEMALE)
            father_phone, mother_phone, city = random_phone(), random_phone(), random.choice(CITIES)
            address = f"{random.randint(1,500)}, Nehru Colony, {city}"
            father_occ, mother_occ = random.choice(FATHER_OCCUPATIONS), random.choice(MOTHER_OCCUPATIONS)
            
            self.student_id_counter += 1
            gen1 = random.choice(["M", "F"])
            fn1 = random.choice(FIRST_NAMES_MALE if gen1 == "M" else FIRST_NAMES_FEMALE)
            cls_idx1 = random.randint(0, len(CLASSES)-3)
            self._add_special_student(rows, ay, fn1, last, gen1, cls_idx1, father_first, mother_first, father_phone, mother_phone, address, father_occ, mother_occ, "sibling_discount")
            
            self.student_id_counter += 1
            gen2 = random.choice(["M", "F"])
            fn2 = random.choice(FIRST_NAMES_MALE if gen2 == "M" else FIRST_NAMES_FEMALE)
            cls_idx2 = cls_idx1 + random.randint(1, 2)
            self._add_special_student(rows, ay, fn2, last, gen2, cls_idx2, father_first, mother_first, father_phone, mother_phone, address, father_occ, mother_occ, "sibling_discount")
            
        # 20 students for "partial fee payment"
        for i in range(20): self._add_random_special(rows, ay, "partial_fee")
        # 20 students for "pending fee from last year"
        for i in range(20): self._add_random_special(rows, ay, "pending_fee")
        # 20 students for "discounted fee"
        for i in range(20): self._add_random_special(rows, ay, "other_discount")

    def _add_random_special(self, rows, ay, scenario):
        self.student_id_counter += 1
        gender = random.choice(["M", "F"])
        fn = random.choice(FIRST_NAMES_MALE if gender == "M" else FIRST_NAMES_FEMALE)
        last = random.choice(LAST_NAMES)
        father_first, mother_first = random.choice(FIRST_NAMES_MALE), random.choice(FIRST_NAMES_FEMALE)
        city = random.choice(CITIES)
        address = f"{random.randint(1,500)}, Nehru Colony, {city}"
        self._add_special_student(rows, ay, fn, last, gender, random.randint(0, len(CLASSES)-1), father_first, mother_first, random_phone(), random_phone(), address, random.choice(FATHER_OCCUPATIONS), random.choice(MOTHER_OCCUPATIONS), scenario)

    def _add_special_student(self, rows, ay, first, last, gender, cls_idx, father_first, mother_first, father_phone, mother_phone, address, father_occ, mother_occ, scenario):
        cls = CLASSES[cls_idx]
        sec = random.choice(SECTIONS)
        admission_no = f"STU{self.student_id_counter:04d}"
        dob = random_dob(cls, ay["start"])
        admission_date = ay["start"] - timedelta(days=random.randint(0, 30))
        middle = ""
        student_record = {
            "admission_number": admission_no, "first_name": first, "last_name": last, "gender": gender,
            "dob": dob, "initial_class": cls, "initial_class_idx": cls_idx, "section": sec,
            "father_name": f"{father_first} {last}", "mother_name": f"{mother_first} {last}", "scenario": scenario
        }
        self.students.append(student_record)
        rows.append([
            first, admission_no, fmt_date(dob), gender, f"{father_first} {last}", f"{mother_first} {last}",
            father_phone, middle, last, fmt_date(admission_date), random_email(first, last, "student.nucleiq.in"), random_phone(),
            address, random.choices(BLOOD_GROUPS, BLOOD_GROUP_WEIGHTS)[0], mother_phone, random_email(father_first, last, "gmail.com"),
            random_email(mother_first, last, "gmail.com"), father_occ, mother_occ, random_aadhar(), "Indian", 
            random.choices(RELIGIONS, RELIGION_WEIGHTS)[0], random.choices(CATEGORIES, CATEGORY_WEIGHTS)[0],
            cls, sec, str(random.randint(1, 30)),
        ])

    # ------------------------------------------------------------------
    #  6. ENROLLMENTS (promotions for years 2 and 3)
    # ------------------------------------------------------------------
    def generate_enrollments(self):
        headers = ["admission_number", "class_name", "section_name", "roll_number", "enrollment_date", "academic_year"]
        rows = []

        for ay_idx, ay in enumerate(ACADEMIC_YEARS[1:], start=1):  # years 2 and 3
            for stu in self.students:
                new_class_idx = stu["initial_class_idx"] + ay_idx
                if new_class_idx < len(CLASSES):
                    new_class = CLASSES[new_class_idx]
                    section = stu["section"]
                    roll = random.randint(1, STUDENTS_PER_SECTION)
                    rows.append([
                        stu["admission_number"], new_class, section,
                        str(roll), fmt_date(ay["start"]), ay["name"],
                    ])
                # else: student graduated, skip

        write_csv(os.path.join(OUTPUT_DIR, "06_student_enrollments.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  7. USER ACCOUNTS
    # ------------------------------------------------------------------
    def generate_user_accounts(self):
        headers = ["email", "password", "first_name", "last_name", "role", "admission_number", "employee_id"]
        rows = []

        # Parent accounts (one per student's father)
        for stu in self.students[:200]:  # first 200 students get parent logins
            father_name = stu["father_name"].split()
            rows.append([
                random_email(father_name[0], father_name[-1] if len(father_name) > 1 else "parent", "parent.nucleiq.in"),
                "Parent@123",
                father_name[0],
                father_name[-1] if len(father_name) > 1 else "",
                "PARENT",
                stu["admission_number"],
                "",
            ])

        # Teacher accounts
        for staff_row in self.staff_records:
            if staff_row[4] in ("TEACHER", "ASSISTANT_TEACHER", "HEAD_TEACHER"):
                rows.append([
                    staff_row[5],  # email
                    "Teacher@123",
                    staff_row[0],  # first_name
                    staff_row[1],  # last_name
                    "TEACHER",
                    "",
                    staff_row[2],  # employee_id
                ])

        write_csv(os.path.join(OUTPUT_DIR, "07_user_accounts.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  8. FEE INVOICES & PAYMENTS
    # ------------------------------------------------------------------
    def generate_fee_invoices_and_payments(self):
        inv_headers = ["invoice_number", "admission_number", "fee_type", "amount", "due_date", "invoice_date", "academic_year"]
        pay_headers = ["receipt_number", "invoice_number", "amount_paid", "payment_date", "payment_mode", "remarks"]
        inv_rows = []
        pay_rows = []

        for ay in ACADEMIC_YEARS:
            for stu in self.students:
                cls_idx = stu["initial_class_idx"] + ACADEMIC_YEARS.index(ay)
                if cls_idx >= len(CLASSES):
                    continue
                cls = CLASSES[cls_idx]
                tier = get_fee_tier(cls)

                for ft in FEE_TYPES:
                    amt = ft["amounts"][tier]
                    if amt <= 0:
                        continue

                    scenario = stu.get("scenario")
                    if scenario in ("sibling_discount", "other_discount"):
                        amt = int(amt * 0.8) # 20% discount applied

                    if ft["frequency"] == "MONTHLY":
                        # Generate monthly invoices (12 months)
                        for month_offset in range(12):
                            invoice_date = ay["start"] + timedelta(days=30 * month_offset)
                            if invoice_date > date(2026, 2, 26):
                                break
                            self.invoice_counter += 1
                            inv_no = f"INV/{ay['name']}/{self.invoice_counter:06d}"
                            due_date = invoice_date + timedelta(days=10)
                            inv_rows.append([inv_no, stu["admission_number"], ft["name"], amt, fmt_date(due_date), fmt_date(invoice_date), ay["name"]])

                            # Payment determination
                            if scenario == "pending_fee" and ay["name"] in ("2023-24", "2024-25"):
                                pass # no payment
                            elif scenario == "partial_fee" and random.random() < 0.5:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(0, 5))
                                pay_rows.append([rcp_no, inv_no, amt // 2, fmt_date(pay_date), "CASH", "Partial payment"])
                            elif random.random() < 0.85:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(-5, 15))
                                mode = random.choices(PAYMENT_MODES, PAYMENT_MODE_WEIGHTS)[0]
                                pay_rows.append([rcp_no, inv_no, amt, fmt_date(pay_date), mode, ""])
                    else:
                        # Non-monthly: 1 or 2 invoices
                        num_invoices = 1 if ft["frequency"] in ("YEARLY", "ONE_TIME") else 2
                        for i in range(num_invoices):
                            self.invoice_counter += 1
                            inv_no = f"INV/{ay['name']}/{self.invoice_counter:06d}"
                            invoice_date = ay["start"] + timedelta(days=180 * i)
                            if invoice_date > date(2026, 2, 26):
                                break
                            due_date = invoice_date + timedelta(days=15)
                            per_invoice_amt = amt // num_invoices
                            inv_rows.append([inv_no, stu["admission_number"], ft["name"], per_invoice_amt, fmt_date(due_date), fmt_date(invoice_date), ay["name"]])

                            if scenario == "pending_fee" and ay["name"] in ("2023-24", "2024-25"):
                                pass
                            elif scenario == "partial_fee" and random.random() < 0.5:
                                self.receipt_counter += 1
                                pay_rows.append([f"RCP/{ay['name']}/{self.receipt_counter:06d}", inv_no, per_invoice_amt // 2, fmt_date(due_date), "CASH", "Partial payment"])
                            elif random.random() < 0.90:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(-3, 10))
                                mode = random.choices(PAYMENT_MODES, PAYMENT_MODE_WEIGHTS)[0]
                                pay_rows.append([rcp_no, inv_no, per_invoice_amt, fmt_date(pay_date), mode, ""])

        # Limit to keep files manageable (subsample for large datasets)
        MAX_INVOICES = 50000
        MAX_PAYMENTS = 50000
        if len(inv_rows) > MAX_INVOICES:
            print(f"  ⚠️  Subsampling invoices from {len(inv_rows)} to {MAX_INVOICES}")
            inv_rows = random.sample(inv_rows, MAX_INVOICES)
            # Filter payments to only include matching invoices
            valid_inv_nos = {r[0] for r in inv_rows}
            pay_rows = [r for r in pay_rows if r[1] in valid_inv_nos]

        if len(pay_rows) > MAX_PAYMENTS:
            print(f"  ⚠️  Subsampling payments from {len(pay_rows)} to {MAX_PAYMENTS}")
            pay_rows = random.sample(pay_rows, MAX_PAYMENTS)

        write_csv(os.path.join(OUTPUT_DIR, "08_fee_invoices.csv"), inv_headers, inv_rows)
        write_csv(os.path.join(OUTPUT_DIR, "09_fee_payments.csv"), pay_headers, pay_rows)

    # ------------------------------------------------------------------
    #  9. ATTENDANCE
    # ------------------------------------------------------------------
    def generate_attendance(self):
        headers = ["admission_number", "date", "status", "remarks"]
        rows = []

        # Generate attendance for ~50 school days per year across all students
        # (subsampled to keep the file manageable)
        STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]
        STATUS_WEIGHTS = [0.82, 0.08, 0.05, 0.03, 0.02]

        for ay in ACADEMIC_YEARS:
            # Pick 40 random school days
            school_days = []
            current = ay["start"]
            while current <= min(ay["end"], date(2026, 2, 26)):
                if current.weekday() < 6:  # Mon-Sat
                    school_days.append(current)
                current += timedelta(days=1)

            sampled_days = random.sample(school_days, min(40, len(school_days)))
            sampled_days.sort()

            # Pick 50 students per year for attendance (otherwise file is too large)
            sampled_students = random.sample(self.students, min(50, len(self.students)))

            for day in sampled_days:
                for stu in sampled_students:
                    cls_idx = stu["initial_class_idx"] + ACADEMIC_YEARS.index(ay)
                    if cls_idx >= len(CLASSES):
                        continue
                    status = random.choices(STATUSES, STATUS_WEIGHTS)[0]
                    remark = ""
                    if status == "ABSENT":
                        remark = random.choice(["Sick", "Family event", "Not informed", ""])
                    elif status == "LEAVE":
                        remark = random.choice(["Medical leave", "Family function", ""])
                    rows.append([stu["admission_number"], fmt_date(day), status, remark])

        # Cap at 5000 rows
        if len(rows) > 5000:
            print(f"  ⚠️  Subsampling attendance from {len(rows)} to 5000")
            rows = random.sample(rows, 5000)

        write_csv(os.path.join(OUTPUT_DIR, "10_attendance.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  10. EXAM RESULTS
    # ------------------------------------------------------------------
    def generate_exam_results(self):
        headers = ["admission_number", "exam_name", "subject_code", "max_marks", "marks_obtained", "grade", "exam_date", "academic_year"]
        rows = []

        EXAM_NAMES = ["Unit Test 1", "Midterm", "Unit Test 2", "Final"]
        EXAM_MONTH_OFFSETS = [60, 120, 210, 300]  # days from start of AY

        def compute_grade(pct):
            if pct >= 90: return "A+"
            if pct >= 80: return "A"
            if pct >= 70: return "B+"
            if pct >= 60: return "B"
            if pct >= 50: return "C"
            if pct >= 40: return "D"
            return "F"

        # Only generate for a subsample of students (100) to keep file manageable
        sampled_students = random.sample(self.students, min(100, len(self.students)))

        for ay_idx, ay in enumerate(ACADEMIC_YEARS):
            for exam_idx, exam_name in enumerate(EXAM_NAMES):
                exam_date = ay["start"] + timedelta(days=EXAM_MONTH_OFFSETS[exam_idx])
                if exam_date > date(2026, 2, 26):
                    continue

                for stu in sampled_students:
                    cls_idx = stu["initial_class_idx"] + ay_idx
                    if cls_idx >= len(CLASSES):
                        continue
                    cls = CLASSES[cls_idx]
                    group = get_class_group(cls)
                    subj_list = SUBJECTS.get(group, SUBJECTS["primary_upper"])
                    class_short = cls.replace("Class ", "").replace(" ", "")

                    for subj_name, subj_code_base, _, max_marks in subj_list:
                        code = f"{subj_code_base}{class_short}"
                        # Generate a realistic mark with some consistency per student
                        base_pct = random.gauss(72, 15)  # mean 72%, std 15%
                        base_pct = max(15, min(100, base_pct))
                        marks = round(max_marks * base_pct / 100, 1)
                        grade = compute_grade(base_pct)
                        rows.append([
                            stu["admission_number"], exam_name, code,
                            max_marks, marks, grade,
                            fmt_date(exam_date), ay["name"],
                        ])

        # Cap at 5000
        if len(rows) > 5000:
            print(f"  ⚠️  Subsampling exam results from {len(rows)} to 5000")
            rows = random.sample(rows, 5000)

        write_csv(os.path.join(OUTPUT_DIR, "11_exam_results.csv"), headers, rows)

    # ------------------------------------------------------------------
    #  11. STUDENT PHOTO ZIP
    # ------------------------------------------------------------------
    def generate_photo_zip(self):
        """Generate a ZIP file with simple placeholder student photos"""
        zip_path = os.path.join(OUTPUT_DIR, "12_student_photos.zip")

        try:
            from PIL import Image, ImageDraw, ImageFont
            USE_PIL = True
        except ImportError:
            USE_PIL = False

        print("  ⏳ Loading AI human faces...")
        try:
            with open(r"C:\Users\syedmo\.gemini\antigravity\brain\4f85d770-8276-4abc-af93-3ff73656c2e1\ai_face_male_1772415091553.png", "rb") as f:
                male_face = f.read()
            with open(r"C:\Users\syedmo\.gemini\antigravity\brain\4f85d770-8276-4abc-af93-3ff73656c2e1\ai_face_female_1772415117964.png", "rb") as f:
                female_face = f.read()
            USE_AI = True
        except Exception as e:
            print("  ⚠️ AI faces fetch failed:", e)
            USE_AI = False

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for stu in self.students:
                adm = stu["admission_number"]
                initials = (stu["first_name"][0] + stu["last_name"][0]).upper()
                gender = stu.get("gender", "M")

                if USE_AI:
                    img_data = male_face if gender == "M" else female_face
                    zf.writestr(f"{adm}.jpg", img_data)
                elif USE_PIL:
                    # Generate a colored avatar with initials
                    colors = [
                        (66, 133, 244), (219, 68, 55), (244, 180, 0),
                        (15, 157, 88), (171, 71, 188), (255, 112, 67),
                        (0, 150, 136), (63, 81, 181), (233, 30, 99),
                    ]
                    bg_color = random.choice(colors)
                    img = Image.new('RGB', (200, 200), bg_color)
                    draw = ImageDraw.Draw(img)
                    # Draw initials centered
                    try:
                        font = ImageFont.truetype("arial.ttf", 72)
                    except (OSError, IOError):
                        font = ImageFont.load_default()
                    bbox = draw.textbbox((0, 0), initials, font=font)
                    text_w = bbox[2] - bbox[0]
                    text_h = bbox[3] - bbox[1]
                    x = (200 - text_w) // 2
                    y = (200 - text_h) // 2 - 10
                    draw.text((x, y), initials, fill=(255, 255, 255), font=font)

                    buf = io.BytesIO()
                    img.save(buf, format='JPEG', quality=80)
                    zf.writestr(f"{adm}.jpg", buf.getvalue())
                else:
                    # Fallback: create a minimal 1x1 pixel JPEG-like placeholder
                    # (actual tiny JPEG binary)
                    # We'll create a simple BMP and convert
                    pixel_data = bytearray([
                        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
                        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
                        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                    ])
                    # Just write a minimal placeholder
                    placeholder = b'\x89PNG\r\n\x1a\n' + b'\x00' * 50  # tiny invalid but name-correct placeholder
                    zf.writestr(f"{adm}.jpg", placeholder)

        photo_count = len(self.students)
        print(f"  ✅ Generated: 12_student_photos.zip ({photo_count} photos)")
        if not USE_PIL:
            print(f"  ⚠️  Note: Install Pillow (pip install Pillow) for proper avatar images")

    # ------------------------------------------------------------------
    #  PRINT UPLOAD ORDER
    # ------------------------------------------------------------------
    def _print_upload_order(self):
        print("\n📋 UPLOAD ORDER (use this exact sequence):")
        print("-" * 60)
        files = [
            ("01_classes.csv", "classes"),
            ("02_staff.csv", "staff"),
            ("03_subjects.csv", "subjects"),
            ("04_fee_structures.csv", "fee_structures"),
            ("05_students.csv", "students"),
            ("06_student_enrollments.csv", "student_enrollments"),
            ("07_user_accounts.csv", "user_accounts"),
            ("08_fee_invoices.csv", "fee_invoices"),
            ("09_fee_payments.csv", "fee_payments"),
            ("10_attendance.csv", "attendance"),
            ("11_exam_results.csv", "exam_results"),
            ("12_student_photos.zip", "student_photos"),
        ]
        for i, (filename, module) in enumerate(files, 1):
            print(f"  {i:2d}. Upload: {filename:<35s} Module: {module}")
        print("-" * 60)
        print("  ℹ️  For each file:")
        print("     1. Go to Data Management page")
        print("     2. Select the module from the dropdown")
        print("     3. Upload the file")
        print("     4. Review validation preview")
        print("     5. Confirm import")


# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    random.seed(42)  # Reproducible results
    gen = DummyDataGenerator()
    gen.run()
