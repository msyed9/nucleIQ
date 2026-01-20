"""
Simple database check script
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.db import connection

# Check students table columns
cursor = connection.cursor()
cursor.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'students'
    ORDER BY ordinal_position
""")
columns = cursor.fetchall()
print("Students table columns:")
for col in columns:
    print(f"  - {col[0]} ({col[1]})")

print("\n")

# Try a simple query on students
try:
    cursor.execute("SELECT id, admission_number, first_name FROM students LIMIT 3")
    rows = cursor.fetchall()
    print(f"Students query OK, found {len(rows)} rows")
    for r in rows:
        print(f"  - {r}")
except Exception as e:
    print(f"Students query FAILED: {e}")

# Check if there are missing columns that the ORM expects
print("\nChecking ORM vs Database...")
from students.models import Student
model_fields = [f.column for f in Student._meta.fields]
db_columns = [c[0] for c in columns]
missing = set(model_fields) - set(db_columns)
if missing:
    print(f"MISSING columns in database: {missing}")
else:
    print("All model fields exist in database")
