#!/usr/bin/env python
"""Debug script to test attendance marking"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from attendance.models import AttendanceRecord
from students.models import Student
from tenants.models import AcademicYear, Tenant
from users.models import User
from datetime import date

print("=" * 60)
print("TESTING ATTENDANCE MARKING")
print("=" * 60)

# Get tenant and academic year
tenant = Tenant.objects.first()
print(f"Tenant: {tenant.name}")

academic_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
print(f"Academic Year: {academic_year.name if academic_year else 'NONE - THIS IS THE PROBLEM!'}")

if not academic_year:
    print("\n[ERROR] No active academic year found!")
    exit(1)

# Get a test student
student = Student.objects.filter(tenant=tenant, is_active=True).first()
print(f"Test Student: {student.get_full_name()} (ID: {student.id})")

# Get a user for marked_by
user = User.objects.filter(tenant=tenant).first()
print(f"Marked by user: {user.email if user else 'NONE'}")

# Try to create an attendance record
print("\n[TEST] Creating attendance record...")
try:
    record, created = AttendanceRecord.objects.update_or_create(
        tenant=tenant,
        student=student,
        date=date.today(),
        defaults={
            'status': 'PRESENT',
            'method': 'MANUAL',
            'record_type': 'STUDENT',
            'academic_year': academic_year,
            'marked_by': user
        }
    )
    print(f"[SUCCESS] {'Created' if created else 'Updated'} record: {record}")
except Exception as e:
    print(f"[ERROR] Failed to create record: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n[CHECK] Existing attendance records count:", AttendanceRecord.objects.filter(tenant=tenant).count())
