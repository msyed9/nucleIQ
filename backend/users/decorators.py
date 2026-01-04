"""
RBAC Permission Decorators
Provides decorators for view-level permission checking.
"""

import functools
import logging
from django.shortcuts import redirect
from django.contrib import messages
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status

from .utils import has_permission, is_superadmin, is_role

logger = logging.getLogger(__name__)


def permission_required(module, action):
    """
    Decorator to check if user has permission for a specific module and action.
    
    Usage:
        @permission_required('employee', 'read')
        def employee_list_view(request):
            ...
    
    Args:
        module: Module/resource name (e.g., 'employee', 'student')
        action: Action name (e.g., 'create', 'read', 'update', 'delete')
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                   request.content_type == 'application/json':
                    return JsonResponse(
                        {'error': 'Authentication required'},
                        status=401
                    )
                return redirect('login')
            
            # Check permission
            if not has_permission(request.user, module, action):
                # Log permission denial
                logger.warning(
                    f'Permission denied for user {request.user.email}: '
                    f'{module}.{action}'
                )
                
                # Handle AJAX/API requests
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                   request.content_type == 'application/json':
                    return JsonResponse(
                        {'error': 'Access denied. You do not have permission to perform this action.'},
                        status=403
                    )
                
                # Handle regular requests
                messages.error(
                    request,
                    'Access denied. You do not have permission to access this resource.'
                )
                return redirect('dashboard:index')
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def role_required(*roles):
    """
    Decorator to check if user has one of the specified roles.
    
    Usage:
        @role_required('admin', 'teacher')
        def admin_or_teacher_view(request):
            ...
    
    Args:
        *roles: Variable number of role codes
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                   request.content_type == 'application/json':
                    return JsonResponse(
                        {'error': 'Authentication required'},
                        status=401
                    )
                return redirect('login')
            
            # Check if user has any of the required roles
            has_role = any(is_role(request.user, role) for role in roles)
            
            if not has_role:
                logger.warning(
                    f'Role check failed for user {request.user.email}: '
                    f'Required roles: {roles}'
                )
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                   request.content_type == 'application/json':
                    return JsonResponse(
                        {'error': 'Access denied. Required role not found.'},
                        status=403
                    )
                
                messages.error(
                    request,
                    'Access denied. You do not have the required role.'
                )
                return redirect('dashboard:index')
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def superadmin_required(view_func):
    """
    Decorator to check if user is a superadmin.
    
    Usage:
        @superadmin_required
        def superadmin_only_view(request):
            ...
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
               request.content_type == 'application/json':
                return JsonResponse(
                    {'error': 'Authentication required'},
                    status=401
                )
            return redirect('login')
        
        # Check if user is superadmin
        if not is_superadmin(request.user):
            logger.warning(
                f'Superadmin access denied for user {request.user.email}'
            )
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
               request.content_type == 'application/json':
                return JsonResponse(
                    {'error': 'Access denied. Superadmin access required.'},
                    status=403
                )
            
            messages.error(
                request,
                'Access denied. This area is restricted to platform administrators.'
            )
            return redirect('dashboard:index')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def any_permission(*permissions):
    """
    Decorator to check if user has ANY of the specified permissions.
    
    Usage:
        @any_permission(('employee', 'read'), ('student', 'read'))
        def dashboard_view(request):
            ...
    
    Args:
        *permissions: Variable number of (module, action) tuples
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                   request.content_type == 'application/json':
                    return JsonResponse(
                        {'error': 'Authentication required'},
                        status=401
                    )
                return redirect('login')
            
            # Check if user has any of the permissions
            has_any = any(
                has_permission(request.user, perm[0], perm[1])
                for perm in permissions
            )
            
            if not has_any:
                logger.warning(
                    f'Permission check failed for user {request.user.email}: '
                    f'Required any of: {permissions}'
                )
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                   request.content_type == 'application/json':
                    return JsonResponse(
                        {'error': 'Access denied. Required permission not found.'},
                        status=403
                    )
                
                messages.error(
                    request,
                    'Access denied. You do not have the required permissions.'
                )
                return redirect('dashboard:index')
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# DRF-specific permission decorators
from rest_framework.decorators import permission_classes
from rest_framework.permissions import BasePermission


class HasModulePermission(BasePermission):
    """
    DRF permission class for checking module-level permissions.
    
    Usage in ViewSet:
        class EmployeeViewSet(ModelViewSet):
            permission_classes = [HasModulePermission]
            required_module = 'employee'
            required_actions = {
                'list': 'read',
                'retrieve': 'read',
                'create': 'create',
                'update': 'update',
                'partial_update': 'update',
                'destroy': 'delete',
            }
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Get the required module from the view
        module = getattr(view, 'required_module', None)
        if not module:
            return True  # If no module specified, allow
        
        # Get the required action based on the view action
        action_map = getattr(view, 'required_actions', {})
        action = action_map.get(view.action, view.action)
        
        return has_permission(request.user, module, action)
