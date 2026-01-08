"""
Quick test script to verify permissions matrix implementation.
Run this after migrations to create test roles and permissions.
"""
from users.models import Role, Permission, RolePermission
from tenants.models import Tenant

print("=== Permissions Matrix Test Setup ===\n")

# Get first tenant (adjust if needed)
tenant = Tenant.objects.first()
if not tenant:
    print("ERROR: No tenant found. Please create a tenant first.")
    exit(1)

print(f"Using tenant: {tenant.name}\n")

# Count existing permissions
perm_count = Permission.objects.count()
print(f"Total permissions in database: {perm_count}")
if perm_count == 0:
    print("WARNING: No permissions found. Run: python manage.py seed_permissions")
    exit(1)

# Create test roles
roles_data = [
    {
        'name': 'Super Admin',
        'code': 'super_admin',
        'description': 'Full system access',
        'perm_filter': {}  # All permissions
    },
    {
        'name': 'Principal',
        'code': 'principal',
        'description': 'School principal with comprehensive access',
        'perm_filter': {'group__in': ['Dashboard', 'Students', 'Staff', 'Attendance', 'Fees', 'Reports']}
    },
    {
        'name': 'Teacher',
        'code': 'teacher',
        'description': 'Teaching staff access',
        'perm_filter': {'resource__in': ['student', 'attendance', 'exam', 'result']}
    },
    {
        'name': 'Accountant',
        'code': 'accountant',
        'description': 'Finance department access',
        'perm_filter': {'group__in': ['Fees', 'Finance', 'Reports']}
    },
    {
        'name': 'Librarian',
        'code': 'librarian',
        'description': 'Library management access',
        'perm_filter': {'group': 'Library'}
    },
]

print("\nCreating test roles...\n")
for role_data in roles_data:
    # Create or get role
    role, created = Role.objects.get_or_create(
        code=role_data['code'],
        tenant=tenant,
        defaults={
            'name': role_data['name'],
            'description': role_data['description']
        }
    )
    
    if created:
        print(f" Created role: {role.name}")
    else:
        print(f" Role already exists: {role.name}")
    
    # Clear existing permissions
    RolePermission.objects.filter(role=role).delete()
    
    # Assign permissions based on filter
    if role_data['perm_filter']:
        permissions = Permission.objects.filter(**role_data['perm_filter'])
    else:
        permissions = Permission.objects.all()
    
    # Bulk create role permissions
    role_perms = [
        RolePermission(role=role, permission=perm)
        for perm in permissions
    ]
    RolePermission.objects.bulk_create(role_perms)
    print(f"   Assigned {len(role_perms)} permissions\n")

print("=== Test Setup Complete ===\n")
print("Summary:")
print(f"   Tenant: {tenant.name}")
print(f"   Total Permissions: {Permission.objects.count()}")
print(f"   Total Roles: {Role.objects.filter(tenant=tenant).count()}")
print(f"   Permission Groups: {Permission.objects.values_list('group', flat=True).distinct().count()}")
print("\nNext steps:")
print("1. Access the frontend at: /settings/permissions")
print("2. Test the permissions matrix UI")
print("3. Try bulk updating permissions for different roles")

