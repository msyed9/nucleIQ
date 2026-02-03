"""
RBAC Permission Utilities
Provides core functions for permission checking and management.
"""

import base64
import hashlib
import hmac
import struct
import time
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


def _normalize_login_identifier(identifier):
    """Normalize a login identifier for cache keys."""
    return (identifier or '').strip().lower()


def get_tenant_security_settings(tenant=None):
    """Resolve tenant security settings with safe defaults."""
    defaults = {
        'max_login_attempts': 5,
        'lockout_duration_minutes': 30,
        'two_factor_auth_required': False,
    }

    if tenant is None:
        return defaults

    try:
        from tenants.models import TenantSettings
        tenant_settings, _ = TenantSettings.objects.get_or_create(tenant=tenant)
        return {
            'max_login_attempts': tenant_settings.max_login_attempts,
            'lockout_duration_minutes': tenant_settings.lockout_duration_minutes,
            'two_factor_auth_required': tenant_settings.two_factor_auth_required,
        }
    except Exception:
        return defaults


def _login_cache_keys(tenant_id, identifier):
    tenant_key = str(tenant_id) if tenant_id else 'global'
    normalized = _normalize_login_identifier(identifier)
    return (
        f'login_failures:{tenant_key}:{normalized}',
        f'login_lock:{tenant_key}:{normalized}'
    )


def is_login_locked(tenant_id, identifier):
    """Return remaining lockout seconds if locked, otherwise 0."""
    _, lock_key = _login_cache_keys(tenant_id, identifier)
    lock_until = cache.get(lock_key)
    if not lock_until:
        return 0

    remaining = int(lock_until - time.time())
    if remaining <= 0:
        cache.delete(lock_key)
        return 0
    return remaining


def record_login_failure(tenant_id, identifier, max_attempts=5, lockout_minutes=30):
    """Record a failed login attempt and set lockout if threshold reached."""
    fail_key, lock_key = _login_cache_keys(tenant_id, identifier)
    attempts = cache.get(fail_key, 0) + 1

    timeout_seconds = max(lockout_minutes, 1) * 60
    cache.set(fail_key, attempts, timeout=timeout_seconds)

    if attempts >= max_attempts:
        lock_until = time.time() + timeout_seconds
        cache.set(lock_key, lock_until, timeout=timeout_seconds)
    return attempts


def clear_login_failures(tenant_id, identifier):
    """Clear login failure and lockout counters."""
    fail_key, lock_key = _login_cache_keys(tenant_id, identifier)
    cache.delete_many([fail_key, lock_key])


def verify_totp(token, secret, window=1, step=30, digits=6):
    """Verify a TOTP token using the shared secret."""
    if not token or not secret:
        return False

    try:
        key = base64.b32decode(secret.upper(), casefold=True)
    except Exception:
        return False

    token = str(token).strip()
    if not token.isdigit():
        return False

    def _hotp(counter):
        msg = struct.pack('>Q', counter)
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        offset = digest[-1] & 0x0F
        code = struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff
        return str(code % (10 ** digits)).zfill(digits)

    current_counter = int(time.time() // step)
    for offset in range(-window, window + 1):
        if _hotp(current_counter + offset) == token:
            return True

    return False


class PermissionDenied(Exception):
    """
    Custom exception for permission denials.
    """
    
    def __init__(self, message="Permission denied", redirect_url=None):
        self.message = message
        self.redirect_url = redirect_url
        super().__init__(self.message)
