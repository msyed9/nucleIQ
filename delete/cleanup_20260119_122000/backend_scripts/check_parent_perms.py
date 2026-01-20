import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from users.models import User, UserRole

user = User.objects.get(email="parent@test.com")
print(f"is_staff: {user.is_staff}")
print(f"is_superuser: {user.is_superuser}")
print(f"is_platform_admin: {user.is_platform_admin}")

roles = UserRole.objects.filter(user=user).values_list('role__name', flat=True)
print(f"Roles: {list(roles)}")