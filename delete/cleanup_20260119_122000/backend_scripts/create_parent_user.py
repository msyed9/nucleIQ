import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import Student, ParentUser
from users.models import User
from tenants.models import Tenant

# Get the first tenant
tenant = Tenant.objects.first()
print(f"Using tenant: {tenant.name}")

# Get the first student
student = Student.objects.first()
print(f"Using student: {student.first_name} {student.last_name} (Admission: {student.admission_number})")

# Create a user for the parent
try:
    parent_user = User.objects.get(email="parent@test.com")
    print(f"Found existing parent user: {parent_user.email}")
except User.DoesNotExist:
    parent_user = User.objects.create_user(
        email="parent@test.com",
        username="parent_test",
        password="parent123",
        first_name="Test",
        last_name="Parent",
        phone="+919876543210",
        tenant=tenant,
        user_type="PARENT"
    )
    print(f"Created parent user: {parent_user.email}")

# Create or get ParentUser profile
try:
    parent_profile = ParentUser.objects.get(user=parent_user)
    print(f"Found existing parent profile")
except ParentUser.DoesNotExist:
    parent_profile = ParentUser.objects.create(
        user=parent_user,
        tenant=tenant,
        relation_type="FATHER",
        occupation="Engineer",
        portal_access_enabled=True
    )
    parent_profile.students.add(student)
    parent_profile.save()
    print(f"Created parent profile and linked to student")

print(f"\nParent Login Details:")
print(f"Email: parent@test.com")
print(f"Password: parent123")
print(f"Linked Students: {parent_profile.students.count()}")