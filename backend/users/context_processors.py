"""
RBAC Context Processors
Provides context variables for templates.
"""

from .utils import is_superadmin, get_user_permissions


def permissions_processor(request):
    """
    Add permission context to all templates.
    
    Returns:
        dict: Context dictionary with user permissions
    """
    if not request.user.is_authenticated:
        return {
            'user_permissions': {},
            'is_superadmin': False,
            'user_role': None,
            'user_roles': [],
        }
    
    permissions = getattr(request, 'user_permissions', None)
    if permissions is None:
        permissions = get_user_permissions(request.user)
    
    # Get user's roles
    user_roles = list(request.user.roles.filter(is_active=True).values('id', 'name', 'code'))
    primary_role = user_roles[0] if user_roles else None
    
    return {
        'user_permissions': permissions,
        'is_superadmin': is_superadmin(request.user),
        'user_role': primary_role,
        'user_roles': user_roles,
    }
