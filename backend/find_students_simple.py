import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import Student, ParentUser
from users.models import User

# Find all students
students = Student.objects.filter(is_active=True)[:10]

print(f"Total active students: {Student.objects.filter(is_active=True).count()}\n")

for student in students:
    enrollment = student.get_current_enrollment()
    print(f"Student: {student.first_name} {student.last_name}")
    print(f"  Admission: {student.admission_number}")
    if enrollment:
        print(f"  Class: {enrollment.section.grade_level.name if enrollment.section.grade_level else 'N/A'} - {enrollment.section.name}")
        print(f"  Academic Year: {enrollment.academic_year.name}")
    else:
        print(f"  Class: Not enrolled")
    print(f"  Father: {student.father_name} ({student.father_phone})")
    print()

# Now link the first enrolled student to parent
parent_user = User.objects.get(email="parent@test.com")
parent_profile = ParentUser.objects.get(user=parent_user)

# Clear existing links
parent_profile.students.clear()

# Find a student with enrollment
for student in students:
    if student.get_current_enrollment():
        parent_profile.students.add(student)
        print(f"\nLinked {student.first_name} {student.last_name} to parent")
        break
else:
    # If no enrolled student, just link the first one
    if students.exists():
        parent_profile.students.add(students.first())
        print(f"\nLinked {students.first().first_name} {students.first().last_name} to parent (not enrolled)")