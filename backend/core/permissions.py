"""
Core Permissions Module for NucleIQ
Provides custom permission classes and utility functions for RBAC.
"""

from rest_framework import permissions
from django.core.exceptions import PermissionDenied


class IsTenantUser(permissions.BasePermission):
    """
    Permission class to ensure user belongs to the current tenant.
    """
    
    message = "You do not have permission to access this tenant's resources."
    
    def has_permission(self, request, view):
        """Check if user belongs to current tenant."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Platform admins can access any tenant
        if request.user.is_platform_admin or request.user.is_superuser:
            return True
        
        # Check if user's tenant matches current tenant
        from core.middleware import get_current_tenant
        current_tenant = get_current_tenant()
        
        if not current_tenant:
            return False
        
        return request.user.tenant_id == current_tenant.id


class IsPlatformAdmin(permissions.BasePermission):
    """
    Permission class for platform administrators only.
    """
    
    message = "Only platform administrators can perform this action."
    
    def has_permission(self, request, view):
        """Check if user is platform admin."""
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_platform_admin or request.user.is_superuser)
        )


class HasModulePermission(permissions.BasePermission):
    """
    Permission class to check if user has permission for a specific module and action.
    
    Usage in views:
        permission_classes = [HasModulePermission]
        required_permission = ('student_module', 'create')
    """
    
    def has_permission(self, request, view):
        """Check if user has required permission."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Platform admins and superusers have all permissions
        if request.user.is_platform_admin or request.user.is_superuser:
            return True
        
        # Get required permission from view
        if not hasattr(view, 'required_permission'):
            # If no permission specified, allow (backward compatibility)
            return True
        
        resource, action = view.required_permission
        return check_permission(request.user, resource, action)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit.
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if user is owner or has read-only access."""
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only to owner
        return obj.created_by == request.user


def check_permission(user, resource, action):
    """
    Check if user has permission for a specific resource and action.
    
    Args:
        user: User instance
        resource: Resource/module name (e.g., 'student_module')
        action: Action name (e.g., 'create', 'read', 'update', 'delete')
    
    Returns:
        bool: True if user has permission, False otherwise
    
    Example:
        if check_permission(request.user, 'student_module', 'create'):
            # Allow student creation
    """
    if not user or not user.is_authenticated:
        return False
    
    # Platform admins and superusers have all permissions
    if user.is_platform_admin or user.is_superuser:
        return True
    
    # Check through user's roles
    return user.roles.filter(
        role_permissions__permission__resource=resource,
        role_permissions__permission__action=action,
        is_active=True
    ).exists()


def require_permission(resource, action):
    """
    Decorator to require specific permission for a view function.
    
    Args:
        resource: Resource/module name
        action: Action name
    
    Example:
        @require_permission('student_module', 'create')
        def create_student(request):
            # Create student logic
    """
    def decorator(view_func):
        def wrapped_view(request, *args, **kwargs):
            if not check_permission(request.user, resource, action):
                raise PermissionDenied(
                    f"You do not have permission to {action} {resource}"
                )
            return view_func(request, *args, **kwargs)
        return wrapped_view
    return decorator


def get_user_permissions(user):
    """
    Get all permissions for a user.
    
    Args:
        user: User instance
    
    Returns:
        list: List of permission codes (e.g., ['student_module.create', 'student_module.read'])
    """
    if not user or not user.is_authenticated:
        return []
    
    # Platform admins have all permissions
    if user.is_platform_admin or user.is_superuser:
        return ['*']
    
    from users.models import Permission
    
    permissions = Permission.objects.filter(
        role_permissions__role__users=user,
        role_permissions__role__is_active=True
    ).distinct()
    
    return [f"{p.resource}.{p.action}" for p in permissions]


def has_any_permission(user, permissions_list):
    """
    Check if user has any of the specified permissions.
    
    Args:
        user: User instance
        permissions_list: List of tuples [(resource, action), ...]
    
    Returns:
        bool: True if user has any of the permissions
    
    Example:
        if has_any_permission(user, [('student_module', 'create'), ('student_module', 'update')]):
            # User can create or update students
    """
    if not user or not user.is_authenticated:
        return False
    
    if user.is_platform_admin or user.is_superuser:
        return True
    
    for resource, action in permissions_list:
        if check_permission(user, resource, action):
            return True
    
    return False


def has_all_permissions(user, permissions_list):
    """
    Check if user has all of the specified permissions.
    
    Args:
        user: User instance
        permissions_list: List of tuples [(resource, action), ...]
    
    Returns:
        bool: True if user has all of the permissions
    
    Example:
        if has_all_permissions(user, [('student_module', 'create'), ('student_module', 'update')]):
            # User can both create and update students
    """
    if not user or not user.is_authenticated:
        return False
    
    if user.is_platform_admin or user.is_superuser:
        return True
    
    for resource, action in permissions_list:
        if not check_permission(user, resource, action):
            return False
    
    return True


class PermissionChecker:
    """
    Context manager for permission checking.
    
    Example:
        with PermissionChecker(request.user) as checker:
            if checker.can('student_module', 'create'):
                # Create student
            if checker.can_any([('student_module', 'update'), ('student_module', 'delete')]):
                # Update or delete student
    """
    
    def __init__(self, user):
        self.user = user
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
    
    def can(self, resource, action):
        """Check if user can perform action on resource."""
        return check_permission(self.user, resource, action)
    
    def can_any(self, permissions_list):
        """Check if user has any of the permissions."""
        return has_any_permission(self.user, permissions_list)
    
    def can_all(self, permissions_list):
        """Check if user has all of the permissions."""
        return has_all_permissions(self.user, permissions_list)
    
    def require(self, resource, action):
        """Require permission or raise PermissionDenied."""
        if not self.can(resource, action):
            raise PermissionDenied(
                f"You do not have permission to {action} {resource}"
            )
