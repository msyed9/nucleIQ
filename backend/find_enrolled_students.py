import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import Student, StudentEnrollment

# Find enrolled students
enrolled = StudentEnrollment.objects.filter(status='ACTIVE').select_related('student', 'section__grade', 'academic_year')[:5]

print(f"Found {enrolled.count()} enrolled students:\n")

for enrollment in enrolled:
    student = enrollment.student
    print(f"Student: {student.first_name} {student.last_name}")
    print(f"  Admission: {student.admission_number}")
    print(f"  Class: {enrollment.section.grade.name} - {enrollment.section.name}")
    print(f"  Academic Year: {enrollment.academic_year.name}")
    print(f"  Father: {student.father_name} ({student.father_phone})")
    print(f"  Mother: {student.mother_name} ({student.mother_phone})")
    print()