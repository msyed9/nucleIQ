import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from students.models import ParentUser
from users.models import User, UserRole

# Get the parent user
parent_user = User.objects.get(email="parent@test.com")

print(f"User: {parent_user.email}")
print(f"Is Staff: {parent_user.is_staff}")
print(f"Is Superuser: {parent_user.is_superuser}")
print(f"Is Platform Admin: {parent_user.is_platform_admin}")
print(f"Tenant: {parent_user.tenant}")

# Check roles
roles = UserRole.objects.filter(user=parent_user)
print(f"\nAssigned Roles: {roles.count()}")
for role in roles:
    print(f"  - {role.role.name} (Permissions: {role.role.permissions.count()})")

# Check parent profile
try:
    parent_profile = ParentUser.objects.get(user=parent_user)
    print(f"\nParent Profile:")
    print(f"  Relation: {parent_profile.relation_type}")
    print(f"  Portal Access: {parent_profile.portal_access_enabled}")
    print(f"  Students: {parent_profile.students.count()}")
    for student in parent_profile.students.all():
        print(f"    - {student.first_name} {student.last_name} ({student.admission_number})")
except ParentUser.DoesNotExist:
    print("\nNo parent profile found!")