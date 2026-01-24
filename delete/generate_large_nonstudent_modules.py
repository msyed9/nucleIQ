import os
import pandas as pd
from datetime import datetime, timedelta
from backend.data_management.templates import get_template

BASE_DIR = r"C:\ECOLAB-ETS\RnD\nucleIQ"
OUT_DIR = os.path.join(BASE_DIR, "delete")
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


def gen_classes(n=200):
    rows = []
    grades = [str(x) for x in range(1, 13)]
    for i in range(n):
        grade = grades[i % len(grades)]
        section = chr(ord('A') + (i % 6))
        rows.append({
            "class_name": f"Grade {grade}",
            "section_name": section,
            "room_number": str(100 + (i % 50)),
            "capacity": str(30 + (i % 20)),
            "academic_year": "2024-25",
        })
    return rows


def gen_subjects(n=500):
    rows = []
    subjects_base = ["Mathematics", "Science", "English", "History", "Geography", "Computer", "Art", "Music", "Physical Education", "Economics"]
    for i in range(n):
        subj = subjects_base[i % len(subjects_base)]
        code = f"SUB{(i+1):04d}"
        class_name = f"Grade {((i%12)+1)}"
        rows.append({
            "subject_name": f"{subj} {((i%3)+1)}",
            "subject_code": code,
            "class_name": class_name,
            "credit_hours": str(2 + (i % 4)),
            "is_elective": "false" if i % 5 else "true",
            "max_marks": "100",
        })
    return rows


def gen_staff(n=250):
    rows = []
    first = ["Amit","Priya","Rakesh","Ananya","Sanjay","Nisha","Vikram","Meera","Karan","Isha"]
    last = ["Sharma","Verma","Singh","Khan","Gupta","Patel","Rao","Iyer","Mehta","Bose"]
    designations = ["TEACHER","HEAD_TEACHER","ACCOUNTANT","LIBRARIAN","ADMIN"]
    departments = ["Mathematics","Science","English","Finance","Library","Administration","Computer"]
    start = datetime(2015,1,1)
    for i in range(n):
        fn = first[i % len(first)]
        ln = last[i % len(last)]
        emp = f"EMP{(i+1):04d}"
        join = (start + timedelta(days=(i*37)%4000)).strftime("%d-%m-%Y")
        rows.append({
            "first_name": fn,
            "last_name": ln,
            "employee_id": emp,
            "joining_date": join,
            "designation": designations[i % len(designations)],
            "email": f"{fn.lower()}.{ln.lower()}@school.edu",
            "phone": str(9000000000 + i),
            "gender": "M" if i % 2 == 0 else "F",
            "department": departments[i % len(departments)],
        })
    return rows


def write_module(prefix, template_name, rows):
    df = build_df(template_name, rows)
    csv_path = os.path.join(OUT_DIR, f"{prefix}.csv")
    xlsx_path = os.path.join(OUT_DIR, f"{prefix}.xlsx")
    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False, sheet_name=template_name[:31])
    print("Wrote:", csv_path, "rows=", len(df))


def main():
    classes = gen_classes(200)
    subjects = gen_subjects(500)
    staff = gen_staff(250)

    write_module("classes_sections", "classes", classes)
    write_module("subjects", "subjects", subjects)
    write_module("staff", "staff", staff)


if __name__ == '__main__':
    main()
