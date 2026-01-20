import os
import django
from django.db import connection
import uuid
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

def seed_complete():
    print("🚀 Complete Demo Data Seeding via Raw SQL...")
    
    with connection.cursor() as cursor:
        # Get Tenant
        cursor.execute("SELECT id FROM tenants WHERE subdomain = 'school' LIMIT 1")
        row = cursor.fetchone()
        if not row:
            print("No 'school' tenant found. Please ensure it exists first.")
            return
        t_id = str(row[0])
        print(f"Using Tenant ID: {t_id}")

        # 1. Academic Year
        cursor.execute(f"SELECT id FROM academic_years WHERE tenant_id = '{t_id}' LIMIT 1")
        ay_row = cursor.fetchone()
        if ay_row:
            ay_id = str(ay_row[0])
            print(f"Academic Year exists: {ay_id}")
        else:
            ay_id = str(uuid.uuid4())
            cursor.execute(f"UPDATE academic_years SET is_active = false WHERE tenant_id = '{t_id}'")
            cursor.execute(f"INSERT INTO academic_years (id, tenant_id, name, start_date, end_date, is_active, is_deleted, created_at, updated_at) VALUES ('{ay_id}', '{t_id}', '2024-2025', '2024-04-01', '2025-03-31', true, false, now(), now())")
            print(f"Created Academic Year: {ay_id}")

        # 2. Department (Any existing one)
        cursor.execute(f"SELECT id FROM departments WHERE tenant_id = '{t_id}' LIMIT 1")
        dept_row = cursor.fetchone()
        if dept_row:
            dept_id = str(dept_row[0])
            print(f"Department exists: {dept_id}")
        else:
            dept_id = str(uuid.uuid4())
            cursor.execute(f"INSERT INTO departments (id, tenant_id, name, code, description, is_deleted, is_active, display_order, created_at, updated_at) VALUES ('{dept_id}', '{t_id}', 'Academics', 'ACAD', 'Academic Department', false, true, 1, now(), now())")
            print(f"Created Department: {dept_id}")

        # 3. Grade Level (Any existing one)
        cursor.execute(f"SELECT id FROM grade_levels WHERE tenant_id = '{t_id}' LIMIT 1")
        g_row = cursor.fetchone()
        if g_row:
            g_id = str(g_row[0])
            print(f"Grade exists: {g_id}")
        else:
            g_id = str(uuid.uuid4())
            cursor.execute(f"INSERT INTO grade_levels (id, tenant_id, department_id, name, short_name, display_order, description, is_active, is_deleted, created_at, updated_at) VALUES ('{g_id}', '{t_id}', '{dept_id}', 'Grade 1', '1', 1, 'First Grade', true, false, now(), now())")
            print(f"Created Grade: {g_id}")

        # 4. Section (Any existing one)
        cursor.execute(f"SELECT id FROM sections WHERE tenant_id = '{t_id}' LIMIT 1")
        s_row = cursor.fetchone()
        if s_row:
            s_id = str(s_row[0])
            print(f"Section exists: {s_id}")
        else:
            s_id = str(uuid.uuid4())
            cursor.execute(f"INSERT INTO sections (id, tenant_id, grade_level_id, name, capacity, room_number, is_active, display_order, is_deleted, created_at, updated_at) VALUES ('{s_id}', '{t_id}', '{g_id}', 'A', 40, 'Room 1', true, 1, false, now(), now())")
            print(f"Created Section: {s_id}")

        # 5. Students (10)
        students_created = 0
        for i in range(1, 11):
            adm = f"S2024{str(i).zfill(3)}"
            cursor.execute(f"SELECT id FROM students WHERE tenant_id = '{t_id}' AND admission_number = '{adm}' LIMIT 1")
            if not cursor.fetchone():
                stu_id = str(uuid.uuid4())
                cursor.execute(f"""
                    INSERT INTO students (id, tenant_id, admission_number, first_name, last_name, date_of_birth, 
                        gender, blood_group, email, phone, address, admission_date, father_name, father_phone, father_email,
                        father_occupation, mother_name, mother_phone, mother_email, mother_occupation, guardian_name,
                        guardian_phone, guardian_relation, family_id, is_active, notes, aadhar_number, aapar_number, pen_number,
                        is_deleted, created_at, updated_at)
                    VALUES ('{stu_id}', '{t_id}', '{adm}', 'Student {i}', 'Demo', '2015-01-{str(i).zfill(2)}', 
                        'M', '', '', '', '', '2024-01-01', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '', '', '',
                        false, now(), now())
                """)
                # Enrollment
                enr_id = str(uuid.uuid4())
                cursor.execute(f"""
                    INSERT INTO student_enrollments (id, tenant_id, student_id, academic_year_id, section_id, 
                        roll_number, status, enrollment_date, is_deleted, created_at, updated_at, total_days, present_days, absent_days)
                    VALUES ('{enr_id}', '{t_id}', '{stu_id}', '{ay_id}', '{s_id}', 
                        '{i}', 'ACTIVE', '2024-04-01', false, now(), now(), 0, 0, 0)
                """)
                students_created += 1
        print(f"Students: {students_created} new, others already exist")

        # 6. Staff
        cursor.execute(f"SELECT id FROM staff WHERE tenant_id = '{t_id}' LIMIT 1")
        stf_row = cursor.fetchone()
        if not stf_row:
            stf_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO staff (id, tenant_id, employee_id, first_name, last_name, designation, 
                    department_id, employment_type, joining_date, status, is_deleted, created_at, updated_at, experience_years)
                VALUES ('{stf_id}', '{t_id}', 'EMP001', 'Teacher', 'Demo', 'TEACHER', 
                    '{dept_id}', 'PERMANENT', '2024-01-01', 'ACTIVE', false, now(), now(), 5)
            """)
            print(f"Created Staff: {stf_id}")
        else:
            stf_id = str(stf_row[0])
            print(f"Staff exists: {stf_id}")

        # 7. Staff Attendance (5 days)
        att_created = 0
        for i in range(5):
            d = date.today() - timedelta(days=i)
            d_str = d.strftime('%Y-%m-%d')
            cursor.execute(f"SELECT id FROM staff_attendance WHERE staff_id = '{stf_id}' AND date = '{d_str}' LIMIT 1")
            if not cursor.fetchone():
                att_id = str(uuid.uuid4())
                cursor.execute(f"""
                    INSERT INTO staff_attendance (id, tenant_id, staff_id, date, status, is_deleted, created_at, updated_at, is_late, is_early_going, overtime_hours)
                    VALUES ('{att_id}', '{t_id}', '{stf_id}', '{d_str}', 'PRESENT', false, now(), now(), false, false, 0)
                """)
                att_created += 1
        print(f"Staff Attendance: {att_created} new records")

        # 8. Fee Category
        cursor.execute(f"SELECT id FROM fee_categories WHERE tenant_id = '{t_id}' LIMIT 1")
        fc_row = cursor.fetchone()
        if fc_row:
            fc_id = str(fc_row[0])
            print(f"Fee Category exists: {fc_id}")
        else:
            fc_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO fee_categories (id, tenant_id, name, code, description, is_active, is_deleted, created_at, updated_at)
                VALUES ('{fc_id}', '{t_id}', 'Tuition Fee', 'TUIT', 'Tuition Fee Category', true, false, now(), now())
            """)
            print(f"Created Fee Category: {fc_id}")

        # 9. Inventory Category
        cursor.execute(f"SELECT id FROM inventory_categories WHERE tenant_id = '{t_id}' LIMIT 1")
        ic_row = cursor.fetchone()
        if ic_row:
            ic_id = str(ic_row[0])
            print(f"Inventory Category exists: {ic_id}")
        else:
            ic_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO inventory_categories (id, tenant_id, name, description, is_deleted, created_at, updated_at)
                VALUES ('{ic_id}', '{t_id}', 'Stationery', 'Stationery Items', false, now(), now())
            """)
            print(f"Created Inventory Category: {ic_id}")

        # 10. Vendor
        cursor.execute(f"SELECT id FROM inventory_vendors WHERE tenant_id = '{t_id}' LIMIT 1")
        v_row = cursor.fetchone()
        if v_row:
            v_id = str(v_row[0])
            print(f"Vendor exists: {v_id}")
        else:
            v_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO inventory_vendors (id, tenant_id, name, is_active, is_deleted, created_at, updated_at)
                VALUES ('{v_id}', '{t_id}', 'Main Vendor', true, false, now(), now())
            """)
            print(f"Created Vendor: {v_id}")

        # 11. Item
        cursor.execute(f"SELECT id FROM inventory_items WHERE tenant_id = '{t_id}' LIMIT 1")
        it_row = cursor.fetchone()
        if not it_row:
            it_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO inventory_items (id, tenant_id, category_id, name, unit, price, cost_price, current_stock, 
                    low_stock_threshold, reorder_quantity, is_sellable, is_active, is_deleted, created_at, updated_at)
                VALUES ('{it_id}', '{t_id}', '{ic_id}', 'Notebook', 'PCS', 50.00, 30.00, 100, 10, 50, true, true, false, now(), now())
            """)
            print(f"Created Item: {it_id}")
        else:
            print(f"Item exists: {it_row[0]}")

    print("\n🏁 Complete Demo Data Seeding Done!")

if __name__ == "__main__":
    seed_complete()
