import os
import pandas as pd
from datetime import datetime, timedelta
from backend.data_management.templates import get_template


BASE_DIR = r"C:\ECOLAB-ETS\RnD\nucleIQ"
OUT_DIR = os.path.join(BASE_DIR, "delete")
os.makedirs(OUT_DIR, exist_ok=True)


def make_phone(n):
    base = 9000000000
    return str(base + n)


first_names = [
    "Aarav","Arjun","Advait","Aisha","Diya","Isha","Kabir","Riya","Vivaan","Karan",
    "Sahil","Nisha","Ananya","Rohit","Priya","Sneha","Tanvi","Vikram","Meera","Sana"
]
last_names = [
    "Sharma","Verma","Singh","Khan","Gupta","Patel","Rao","Iyer","Mehta","Bose",
    "Nair","Joshi","Desai","Kumar","Chopra","Malhotra","Reddy","Kapoor","Das","Sen"
]


def gen_student(i):
    fn = first_names[i % len(first_names)]
    ln = last_names[i % len(last_names)]
    admission_number = f"STU2024{(i+1):04d}"
    dob = (datetime(2010, 1, 1) + timedelta(days=(i * 37) % 2000)).strftime("%d-%m-%Y")
    gender = "M" if i % 2 == 0 else "F"
    class_num = 10 - ((i // 100) % 3)  # 10,9,8 distribution
    class_name = f"Class {class_num}"
    section = chr(ord('A') + (i % 4))
    father = f"{ln} Sr."
    mother = f"Mrs. {ln}"
    father_phone = make_phone(i + 1)
    mother_phone = make_phone(i + 1001)
    father_email = f"{ln.lower()}.{fn.lower()}.father@example.com"
    mother_email = f"{ln.lower()}.{fn.lower()}.mother@example.com"
    admission_date = "01-04-2024"
    address = f"{(i%200)+1} Example Street, City"

    return {
        "first_name": fn,
        "last_name": ln,
        "admission_number": admission_number,
        "date_of_birth": dob,
        "gender": gender,
        "father_name": father,
        "mother_name": mother,
        "father_phone": father_phone,
        "mother_phone": mother_phone,
        "father_email": father_email,
        "mother_email": mother_email,
        "class_name": class_name,
        "section_name": section,
        "admission_date": admission_date,
        "address": address,
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


def main():
    students = [gen_student(i) for i in range(500)]
    df = build_df('students', students)

    csv_path = os.path.join(OUT_DIR, 'students.csv')
    xlsx_path = os.path.join(OUT_DIR, 'students.xlsx')

    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False, sheet_name='students')

    print('Wrote:', csv_path)
    print('Wrote:', xlsx_path)
    print('Rows:', len(df))


if __name__ == '__main__':
    main()
