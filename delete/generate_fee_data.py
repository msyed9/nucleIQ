import os
import random
import pandas as pd
from datetime import date, timedelta
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


def load_students():
    path = os.path.join(OUT_DIR, 'students.csv')
    if os.path.exists(path):
        df = pd.read_csv(path, dtype=str)
        return df.to_dict(orient='records')
    # fallback: synthesize 50 students
    students = []
    for i in range(1, 51):
        students.append({'admission_number': f'STU{(i):05d}', 'class_name': f'Grade {(i%12)+1}'})
    return students


def gen_fee_structures():
    rows = []
    freqs = ['MONTHLY', 'TERM', 'YEARLY']
    for grade in range(1, 13):
        rows.append({
            'fee_type': 'Tuition Fee',
            'class_name': f'Grade {grade}',
            'amount': str(3000 + grade * 200),
            'frequency': random.choice(freqs),
            'due_day': str(10),
            'is_mandatory': 'true',
            'description': f'Tuition for Grade {grade}',
        })
        rows.append({
            'fee_type': 'Transport Fee',
            'class_name': f'Grade {grade}',
            'amount': str(800 + grade * 10),
            'frequency': 'MONTHLY',
            'due_day': str(15),
            'is_mandatory': 'false',
            'description': f'Transport for Grade {grade}',
        })
    return rows


def gen_invoices_and_payments(students, structures):
    invoices = []
    payments = []
    today = date.today()
    # map class->structure amounts (pick tuition)
    class_amount = {}
    for s in structures:
        if s.get('fee_type', '').lower().startswith('tuition'):
            class_amount[s['class_name']] = float(s['amount'])

    invoice_seq = 1
    for stu in students:
        adm = stu.get('admission_number') or f'STU{invoice_seq:05d}'
        cls = stu.get('class_name', f'Grade {((invoice_seq%12)+1)}')
        # create 2 invoices per student
        for j in range(2):
            inv_num = f'INV-{adm}-{j+1:02d}'
            amt = class_amount.get(cls, 3000.0) + (0 if j==0 else 500.0)  # second invoice adds misc
            inv_date = today - timedelta(days=random.randint(30, 180))
            due_date = inv_date + timedelta(days=30)
            invoices.append({
                'invoice_number': inv_num,
                'admission_number': adm,
                'fee_type': 'Tuition Fee',
                'amount': f"{amt:.2f}",
                'due_date': due_date.strftime('%d-%m-%Y'),
                'invoice_date': inv_date.strftime('%d-%m-%Y'),
                'academic_year': f"{today.year}-{today.year+1}",
            })

            # generate 0..2 payments per invoice
            paid_total = 0.0
            pay_count = random.choice([0, 1, 2])
            for p in range(pay_count):
                paid = round(random.uniform(100.0, amt - paid_total), 2)
                if paid <= 0:
                    break
                paid_total += paid
                rcpt = f'RCP-{inv_num}-{p+1}'
                pay_date = inv_date + timedelta(days=random.randint(1, 40))
                payments.append({
                    'receipt_number': rcpt,
                    'invoice_number': inv_num,
                    'amount_paid': f"{paid:.2f}",
                    'payment_date': pay_date.strftime('%d-%m-%Y'),
                    'payment_mode': random.choice(['CASH','CHEQUE','ONLINE','UPI']),
                    'remarks': 'Auto-generated payment',
                })

            invoice_seq += 1

    return invoices, payments


def write_module(prefix, template_name, rows):
    df = build_df(template_name, rows)
    csv_path = os.path.join(OUT_DIR, f"{prefix}.csv")
    xlsx_path = os.path.join(OUT_DIR, f"{prefix}.xlsx")
    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False, sheet_name=template_name[:31])
    print('Wrote:', csv_path, 'rows=', len(df))


def main():
    students = load_students()
    fee_structures = gen_fee_structures()
    invoices, payments = gen_invoices_and_payments(students, fee_structures)

    write_module('fee_structures', 'fee_structures', fee_structures)
    write_module('fee_invoices', 'fee_invoices', invoices)
    write_module('fee_payments', 'fee_payments', payments)


if __name__ == '__main__':
    main()
