import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import Student, StudentEnrollment
from tenants.models import Section, AcademicYear, Tenant

# Get the student
student = Student.objects.get(admission_number="NMS-STU-001")
tenant = student.tenant

# Get or create academic year
academic_year = AcademicYear.objects.filter(tenant=tenant, is_current=True).first()
if not academic_year:
    print("No active academic year found. Let me check all academic years:")
    for ay in AcademicYear.objects.filter(tenant=tenant):
        print(f"  - {ay.name} (Current: {ay.is_current})")
    
# Get a section
section = Section.objects.filter(tenant=tenant).first()
if section:
    print(f"Found section: {section.name}")
    if section.grade_level:
        print(f"Grade: {section.grade_level.name}")
else:
    print("No sections found")
    sections = Section.objects.all()[:5]
    print(f"Total sections in DB: {Section.objects.count()}")

# Check if already enrolled
existing = student.get_current_enrollment()
if existing:
    print(f"\nStudent already enrolled:")
    print(f"  Section: {existing.section.name}")
    print(f"  Academic Year: {existing.academic_year.name}")
else:
    print("\nStudent not enrolled. Will need to create enrollment manually.")