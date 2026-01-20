import os
import django
from django.db import connection
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

def run_sql(sql):
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql)
            print(f"Executed: {sql[:100]}...")
        except Exception as e:
            print(f"Failed: {sql[:100]}... | Error: {e}")

def seed_raw_v2():
    print("🚀 Seeding via RAW SQL v2...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM tenants WHERE subdomain = 'school'")
        row = cursor.fetchone()
        if not row:
            t_id = str(uuid.uuid4())
            cursor.execute(f"INSERT INTO tenants (id, subdomain, name, admin_email, is_active, plan, created_at, updated_at, max_students, max_staff, metadata) VALUES ('{t_id}', 'school', 'NucleiQ School', 'admin@school.com', true, 'premium', now(), now(), 1000, 100, '{{}}')")
        else:
            t_id = row[0]
    
    # Insert Student (Minimum fields, let DB handle defaults)
    stu_id = str(uuid.uuid4())
    run_sql(f"INSERT INTO students (id, tenant_id, admission_number, first_name, last_name, date_of_birth, gender, admission_date, is_active) VALUES ('{stu_id}', '{t_id}', 'S{uuid.uuid4().hex[:4]}', 'Demo', 'Student', '2015-01-01', 'M', '2024-01-01', true)")

if __name__ == "__main__":
    seed_raw_v2()
