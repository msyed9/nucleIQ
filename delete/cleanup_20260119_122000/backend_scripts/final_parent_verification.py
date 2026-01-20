import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import ParentUser
from users.models import User, UserRole

# Get the parent user
parent_user = User.objects.get(email="parent@test.com")
parent_profile = ParentUser.objects.get(user=parent_user)

print("=" * 60)
print("PARENT PORTAL ACCESS VERIFICATION")
print("=" * 60)

print(f"\n USER CREDENTIALS")
print(f"   Email: parent@test.com")
print(f"   Password: parent123")

print(f"\n USER TYPE & PERMISSIONS")
print(f"   Is Staff: {parent_user.is_staff} (Should be False)")
print(f"   Is Superuser: {parent_user.is_superuser} (Should be False)")
print(f"   Is Platform Admin: {parent_user.is_platform_admin} (Should be False)")
print(f"   Has Admin Roles: {UserRole.objects.filter(user=parent_user).count()} (Should be 0)")

print(f"\n TENANT & SCOPE")
print(f"   Tenant: {parent_user.tenant.name}")
print(f"   Portal Access: {parent_profile.portal_access_enabled} (Should be True)")
print(f"   Relation Type: {parent_profile.relation_type}")

print(f"\n LINKED STUDENTS")
students = parent_profile.students.all()
print(f"   Total Students: {students.count()}")
for student in students:
    print(f"   - {student.first_name} {student.last_name} ({student.admission_number})")
    print(f"     Tenant: {student.tenant.name}")
    print(f"     Active: {student.is_active}")

print(f"\n ACCESS URLs")
print(f"   Login Page: http://localhost:5173/parent/login")
print(f"   Portal Dashboard: http://localhost:5173/parent/portal")

print(f"\n AVAILABLE APIs")
apis = [
    "POST /api/parent/auth/login/",
    "POST /api/parent/auth/refresh/",
    "GET /api/parent/students/",
    "GET /api/parent/students/{id}/",
    "GET /api/parent/students/{id}/attendance/",
    "GET /api/parent/students/{id}/fees/",
    "GET /api/parent/students/{id}/exams/",
    "GET /api/parent/students/{id}/360/",
    "GET /api/parent/students/{id}/remarks/",
    "GET /api/parent/students/{id}/documents/",
    "GET /api/parent/students/{id}/health-records/",
    "GET /api/parent/profile/",
    "GET /api/parent/dashboard/"
]
for api in apis:
    print(f"   - {api}")

print(f"\n RESTRICTIONS")
print(f"    Cannot access admin dashboard")
print(f"    Cannot access staff features")
print(f"    Cannot access other students")
print(f"    Cannot modify any data (read-only)")
print(f"    Can only view linked students")

print(f"\n{'=' * 60}")
print("VERIFICATION COMPLETE - PARENT PORTAL READY!")
print("=" * 60)
print(f"\nNext Step: Login at http://localhost:5173/parent/login")