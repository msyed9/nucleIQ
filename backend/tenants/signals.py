"""
Tenant Signals for NucleiQ
Handles automatic user creation when a new tenant is created.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender='tenants.Tenant')
def create_tenant_admin_user(sender, instance, created, **kwargs):
    """
    Automatically create an admin user when a new tenant is created.
    
    This signal:
    1. Creates a User with the tenant's admin_email
    2. Links the user to the tenant
    3. Sets an unusable password (admin must set it)
    4. Creates/assigns a 'School Admin' role if available
    """
    if not created:
        return
    
    if not instance.admin_email:
        return
    
    # Check if user already exists with this email
    email = instance.admin_email.lower().strip()
    if User.objects.filter(email=email).exists():
        # User exists, just link them to this tenant if not already linked
        existing_user = User.objects.get(email=email)
        if existing_user.tenant_id is None:
            existing_user.tenant = instance
            existing_user.save(update_fields=['tenant'])
        return
    
    # Create new user for this tenant
    user = User(
        email=email,
        tenant=instance,
        first_name='Admin',
        last_name=instance.name[:30] if instance.name else '',
        is_active=True,
        is_staff=True,  # Allow Django admin access
    )
    # Set unusable password - admin will set it via the admin interface
    user.set_unusable_password()
    
    # Use update_or_create pattern to avoid save() tenant validation
    # We bypass the normal save to avoid middleware tenant context issues
    from django.db import connection
    user.save(using=connection.alias)
    
    # Try to assign a default role
    try:
        from users.models import Role
        
        # Look for an existing admin role or create one
        admin_role, role_created = Role.objects.get_or_create(
            tenant=instance,
            code='school_admin',
            defaults={
                'name': 'School Admin',
                'description': 'Full administrative access to the school/institution',
                'is_active': True,
            }
        )
        
        # Assign role to user
        from users.models import UserRole
        UserRole.objects.get_or_create(
            user=user,
            role=admin_role,
        )
    except Exception as e:
        # Role assignment failed, but user is still created
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Could not assign default role to tenant admin: {e}")
    
    # Store the created user ID on the instance for admin redirect
    # This is a transient attribute, not saved to DB
    instance._created_admin_user_id = user.pk
