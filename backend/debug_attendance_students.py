#!/usr/bin/env python
"""Debug script to check why students don't appear in attendance module"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from students.models import Student, StudentEnrollment

# The students that don't appear in attendance
admission_numbers = ['STU20240176', 'STU20240177', 'STU20240454']

print("=" * 70)
print("DEBUGGING ATTENDANCE VISIBILITY FOR STUDENTS")
print("=" * 70)

for adm_no in admission_numbers:
    print(f"\n[STUDENT] {adm_no}")
    print("-" * 50)
    
    try:
        student = Student.objects.get(admission_number=adm_no)
        print(f"  Found: {student.get_full_name()}")
        print(f"  ID: {student.id}")
        print(f"  is_active: {student.is_active}")
        print(f"  Tenant: {student.tenant}")
        
        # Check enrollments
        enrollments = StudentEnrollment.objects.filter(student=student)
        print(f"\n  [ENROLLMENTS] Total: {enrollments.count()}")
        
        for enrollment in enrollments:
            print(f"\n    Enrollment ID: {enrollment.id}")
            print(f"    Status: {enrollment.status}")
            print(f"    Academic Year: {enrollment.academic_year}")
            print(f"    Section: {enrollment.section}")
            if enrollment.section:
                print(f"    Section Name: {enrollment.section.name}")
                if enrollment.section.grade_level:
                    print(f"    Grade Level: {enrollment.section.grade_level.name}")
                else:
                    print(f"    Grade Level: NONE!")
            else:
                print(f"    Section: NONE!")
            print(f"    Enrollment Date: {enrollment.enrollment_date}")
            print(f"    Exit Date: {enrollment.exit_date}")
            print(f"    Roll Number: {enrollment.roll_number}")
        
        # Check what get_current_enrollment returns
        current = student.get_current_enrollment()
        print(f"\n  [CURRENT ENROLLMENT]")
        if current:
            print(f"    Status: {current.status}")
            print(f"    Section: {current.section.name if current.section else 'NONE'}")
            print(f"    Grade: {current.section.grade_level.name if current.section and current.section.grade_level else 'NONE'}")
        else:
            print(f"    >>> NO ACTIVE ENROLLMENT FOUND! <<<")
            print(f"    This is likely why the student doesn't appear in attendance!")
            
    except Student.DoesNotExist:
        print(f"  ERROR: Student with admission number {adm_no} not found!")

# Also check total students with and without active enrollments
print("\n" + "=" * 70)
print("STATISTICS")
print("=" * 70)

total_students = Student.objects.filter(is_active=True).count()
students_with_active_enrollment = Student.objects.filter(
    is_active=True,
    enrollments__status='ACTIVE'
).distinct().count()

print(f"Total active students: {total_students}")
print(f"Students with ACTIVE enrollment: {students_with_active_enrollment}")
print(f"Students WITHOUT active enrollment: {total_students - students_with_active_enrollment}")

if total_students != students_with_active_enrollment:
    print("\n[WARNING] Some active students don't have ACTIVE enrollments!")
    missing = Student.objects.filter(is_active=True).exclude(
        enrollments__status='ACTIVE'
    )[:10]
    print(f"\nFirst 10 students without active enrollment:")
    for s in missing:
        print(f"  - {s.admission_number}: {s.get_full_name()}")
