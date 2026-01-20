import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import ParentUser, Student
from users.models import User

# Get the parent user
parent_user = User.objects.get(email="parent@test.com")
parent_profile = ParentUser.objects.get(user=parent_user)

print(f"Parent: {parent_user.email}")
print(f"Tenant: {parent_profile.tenant.name}")
print(f"\nLinked Students:")

for student in parent_profile.students.all():
    enrollment = student.get_current_enrollment()
    print(f"\n  Student: {student.first_name} {student.last_name}")
    print(f"  Admission Number: {student.admission_number}")
    print(f"  Tenant: {student.tenant.name}")
    print(f"  Active: {student.is_active}")
    if enrollment:
        print(f"  Class: {enrollment.section.grade.name} - {enrollment.section.name}")
        print(f"  Academic Year: {enrollment.academic_year.name}")
    else:
        print(f"  Class: Not enrolled")
    
print(f"\nTotal Students Linked: {parent_profile.students.count()}")