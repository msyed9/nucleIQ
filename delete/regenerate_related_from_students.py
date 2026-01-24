import os
import pandas as pd
from backend.data_management.templates import get_template

BASE_DIR = r"C:\ECOLAB-ETS\RnD\nucleIQ"
OUT_DIR = os.path.join(BASE_DIR, "delete")
STUDENTS_CSV = os.path.join(OUT_DIR, "students.csv")
os.makedirs(OUT_DIR, exist_ok=True)


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


def main():
    df_students = pd.read_csv(STUDENTS_CSV, dtype=str)
    adm_numbers = df_students["admission_number"].tolist()

    enrollments = []
    parents = []
    fee_allocations = []
    fee_discounts = []
    transport_allocs = []
    attendance = []
    exam_results = []
    library_txns = []
    hostel_allocs = []

    for i, adm in enumerate(adm_numbers):
        row = df_students.iloc[i]
        class_name = row.get("class_name", "")
        section_name = row.get("section_name", "")

        enrollments.append({
            "admission_number": adm,
            "class_name": class_name,
            "section_name": section_name,
            "roll_number": str(i + 1),
            "enrollment_date": "01-04-2024",
            "academic_year": "2024-25",
        })

        parents.append({
            "admission_number": adm,
            "father_name": row.get("father_name", ""),
            "mother_name": row.get("mother_name", ""),
            "father_phone": row.get("father_phone", ""),
            "mother_phone": row.get("mother_phone", ""),
            "father_email": row.get("father_email", ""),
            "mother_email": row.get("mother_email", ""),
            "father_occupation": "Business",
            "mother_occupation": "Homemaker",
        })

        fee_allocations.append({
            "admission_number": adm,
            "fee_type": "Tuition Fee",
            "amount": "5000",
            "frequency": "MONTHLY",
            "academic_year": "2024-25",
        })

        # Add discounts for every 10th student
        if i % 10 == 0:
            fee_discounts.append({
                "admission_number": adm,
                "discount_code": f"DISC{i}",
                "discount_type": "PERCENT",
                "value": "10",
                "start_date": "01-04-2024",
                "end_date": "31-03-2025",
                "reason": "Bulk discount",
            })

        transport_allocs.append({
            "admission_number": adm,
            "route_name": f"Route {(i%5)+1}",
            "stop_name": f"Stop {(i%8)+1}",
            "start_date": "01-04-2024",
        })

        attendance.append({
            "admission_number": adm,
            "date": "15-06-2024",
            "status": "PRESENT" if i % 7 != 0 else "ABSENT",
            "remarks": "",
        })

        # exam results deterministic
        marks = 50 + (i % 51)
        grade = (
            "A+" if marks >= 90 else
            "A" if marks >= 80 else
            "B+" if marks >= 70 else
            "B" if marks >= 60 else
            "C"
        )
        exam_results.append({
            "admission_number": adm,
            "exam_name": "Midterm",
            "subject_code": "MATH10",
            "max_marks": "100",
            "marks_obtained": str(marks),
            "grade": grade,
            "exam_date": "10-09-2024",
            "academic_year": "2024-25",
        })

        # Library transactions for first 200 students
        if i < 200:
            library_txns.append({
                "transaction_id": f"LIB{i+1:05d}",
                "admission_number": adm,
                "isbn": "9789389620001",
                "issue_date": "01-07-2024",
                "due_date": "15-07-2024",
                "return_date": "",
                "fine_amount": "0",
                "status": "ISSUED",
            })

        # Hostel allocations for some students
        if i % 20 == 0:
            hostel_allocs.append({
                "admission_number": adm,
                "hostel_name": "Boys Hostel" if i % 2 == 0 else "Girls Hostel",
                "room_number": str(100 + (i % 50)),
                "bed_number": "A",
                "start_date": "01-06-2024",
                "end_date": "",
                "status": "ACTIVE",
            })

    # Map output file prefix -> template name
    modules = {
        "student_enrollments": (enrollments, "student_enrollments"),
        "parents": (parents, "parents"),
        "fee_allocations": (fee_allocations, "fee_allocations"),
        "fee_discounts": (fee_discounts, "fee_discounts"),
        "transport_allocations": (transport_allocs, "transport"),
        "attendance": (attendance, "attendance"),
        "exam_results": (exam_results, "exam_results"),
        "library_transactions": (library_txns, "library_transactions"),
        "hostel_allocations": (hostel_allocs, "hostel_allocations"),
    }

    for prefix, (rows, template_name) in modules.items():
        if not rows:
            continue
        df_out = build_df(template_name, rows)
        csv_path = os.path.join(OUT_DIR, f"{prefix}.csv")
        xlsx_path = os.path.join(OUT_DIR, f"{prefix}.xlsx")
        df_out.to_csv(csv_path, index=False)
        df_out.to_excel(xlsx_path, index=False, sheet_name=template_name[:31])
        print("Wrote:", csv_path)
        print("Wrote:", xlsx_path)


if __name__ == '__main__':
    main()
