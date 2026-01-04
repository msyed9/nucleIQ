"""
RBAC Permission Utilities
Provides core functions for permission checking and management.
"""

from django.core.cache import cache
from django.db.models import Q


def has_permission(user, module_prefix, action):
    """
    Check if user has permission for a specific module and action.
    
    Args:
        user: User instance
        module_prefix: string (e.g., 'employee', 'student')
        action: string ('create', 'read', 'update', 'delete')
    
    Returns:
        bool: True if user has permission, False otherwise
    """
    if user is None or not user.is_authenticated:
        return False
    
    # Platform admins and superusers have all permissions
    if user.is_platform_admin or user.is_superuser:
        return True
    
    # Check if user has any roles
    if not user.roles.exists():
        return False
    
    # Check permission through user's roles
    return user.roles.filter(
        role_permissions__permission__resource=module_prefix,
        role_permissions__permission__action=action,
        is_active=True
    ).exists()


def get_user_permissions(user):
    """
    Get all permissions for a user as a dictionary.
    
    Returns:
        dict: Dictionary of permissions by resource
        {
            'employee': {'create': True, 'read': True, 'update': False, 'delete': False},
            'student': {'create': True, 'read': True, 'update': True, 'delete': False},
            ...
        }
    """
    if user is None or not user.is_authenticated:
        return {}
    
    # Platform admins have all permissions
    if user.is_platform_admin or user.is_superuser:
        # Cache key for all permissions
        cache_key = 'all_permissions_dict'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        from .models import Permission
        all_perms = {}
        for perm in Permission.objects.all():
            if perm.resource not in all_perms:
                all_perms[perm.resource] = {}
            all_perms[perm.resource][perm.action] = True
        
        cache.set(cache_key, all_perms, 300)  # Cache for 5 minutes
        return all_perms
    
    # Cache key for user permissions
    cache_key = f'user_permissions_{user.id}'
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Build permissions dictionary from user's roles
    permissions_dict = {}
    
    from .models import RolePermission
    role_perms = RolePermission.objects.filter(
        role__in=user.roles.filter(is_active=True)
    ).select_related('permission')
    
    for role_perm in role_perms:
        resource = role_perm.permission.resource
        action = role_perm.permission.action
        
        if resource not in permissions_dict:
            permissions_dict[resource] = {}
        
        permissions_dict[resource][action] = True
    
    # Cache for 5 minutes
    cache.set(cache_key, permissions_dict, 300)
    
    return permissions_dict


def is_superadmin(user):
    """
    Check if user is a superadmin (platform admin).
    
    Args:
        user: User instance
    
    Returns:
        bool: True if user is superadmin, False otherwise
    """
    if user is None or not user.is_authenticated:
        return False
    
    return user.is_platform_admin or user.is_superuser


def is_role(user, role_code):
    """
    Check if user has a specific role.
    
    Args:
        user: User instance
        role_code: string (role code, e.g., 'teacher', 'admin')
    
    Returns:
        bool: True if user has the role, False otherwise
    """
    if user is None or not user.is_authenticated:
        return False
    
    return user.roles.filter(code=role_code, is_active=True).exists()


def clear_user_permissions_cache(user):
    """
    Clear cached permissions for a user.
    
    Args:
        user: User instance
    """
    cache_key = f'user_permissions_{user.id}'
    cache.delete(cache_key)


class PermissionDenied(Exception):
    """
    Custom exception for permission denials.
    """
    
    def __init__(self, message="Permission denied", redirect_url=None):
        self.message = message
        self.redirect_url = redirect_url
        super().__init__(self.message)
