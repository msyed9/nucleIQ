"""
Create admin user script
"""
from users.models import User

# Create platform admin (superuser without tenant)
try:
    # Check if admin exists
    if User.objects.filter(email='admin@nucleiq.com').exists():
        print("Admin user already exists!")
        admin = User.objects.get(email='admin@nucleiq.com')
        # Update password
        admin.set_password('admin123')
        admin.save()
        print(f"Password updated for: {admin.email}")
    else:
        # Create new admin
        admin = User(
            email='admin@nucleiq.com',
            first_name='Platform',
            last_name='Admin',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_platform_admin=True,
            tenant=None  # Platform admin has no tenant
        )
        admin.set_password('admin123')
        admin.save()
        print(f"Admin created successfully: {admin.email}")
        
    print(f"\nLogin credentials:")
    print(f"Email: {admin.email}")
    print(f"Password: admin123")
    print(f"Is superuser: {admin.is_superuser}")
    print(f"Is staff: {admin.is_staff}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
