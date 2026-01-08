"""
RBAC Middleware
Provides middleware for permission loading and role checking.
"""

import logging
from django.shortcuts import redirect
from django.contrib import messages
from django.utils.deprecation import MiddlewareMixin

from .utils import get_user_permissions

logger = logging.getLogger(__name__)


class PermissionMiddleware(MiddlewareMixin):
    """
    Middleware to load user permissions into request object for easy access.
    """
    
    def process_request(self, request):
        """
        Load permissions for authenticated users.
        """
        if request.user.is_authenticated:
            # Load permissions into request
            request.user_permissions = get_user_permissions(request.user)
        else:
            request.user_permissions = {}
        
        return None


class RoleCheckMiddleware(MiddlewareMixin):
    """
    Middleware to ensure authenticated users have active roles.
    """
    
    # Paths that don't require role checking
    EXEMPT_PATHS = [
        '/admin/',
        '/api/auth/login/',
        '/api/auth/logout/',
        '/api/auth/register/',
        '/static/',
        '/media/',
        '/health/',
    ]
    
    def process_request(self, request):
        """
        Check if authenticated user has active roles.
        """
        # Skip for exempt paths
        for exempt_path in self.EXEMPT_PATHS:
            if request.path.startswith(exempt_path):
                return None
        
        # Skip for unauthenticated users
        if not request.user.is_authenticated:
            return None
        
        # Platform admins don't need role assignments
        if request.user.is_platform_admin or request.user.is_superuser:
            return None
        
        # Check if user has any active roles
        if not request.user.roles.filter(is_active=True).exists():
            logger.warning(
                f'User {request.user.email} has no active roles assigned'
            )
            
            # Handle API requests differently
            if request.path.startswith('/api/'):
                from django.http import JsonResponse
                return JsonResponse(
                    {
                        'error': 'No role assigned',
                        'message': 'Your account has no active role assigned. Please contact your administrator.'
                    },
                    status=403
                )
            
            # For web requests, redirect to a no-role page
            messages.warning(
                request,
                'Your account has no active role assigned. Please contact your administrator.'
            )
            # You might want to create a dedicated view for this
            return redirect('dashboard:index')
        
        return None
