"""
Tenant Middleware for NucleIQ
Handles tenant detection, RLS context setting, and branding injection.
"""

import logging
from threading import local
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# Thread-local storage for tenant context
_thread_locals = local()


def get_current_tenant():
    """
    Get the current tenant from thread-local storage.
    
    Returns:
        Tenant instance or None
    """
    return getattr(_thread_locals, 'tenant', None)


def set_current_tenant(tenant):
    """
    Set the current tenant in thread-local storage.
    
    Args:
        tenant: Tenant instance
    """
    _thread_locals.tenant = tenant


def get_current_user():
    """
    Get the current user from thread-local storage.
    
    Returns:
        User instance or None
    """
    return getattr(_thread_locals, 'user', None)


def set_current_user(user):
    """
    Set the current user in thread-local storage.
    
    Args:
        user: User instance
    """
    _thread_locals.user = user


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to detect tenant and set PostgreSQL RLS context.
    
    Tenant Detection Strategy:
    1. Check X-Tenant-ID header (for API requests)
    2. Extract subdomain from hostname (e.g., school1.nucleiq.com)
    3. Check custom domain mapping
    
    After detection:
    - Sets PostgreSQL session variable for RLS
    - Stores tenant in thread-local storage
    - Attaches branding to request object
    """
    
    def process_request(self, request):
        """
        Process incoming request to detect and set tenant context.
        """
        tenant = None

        # Skip tenant detection for Django admin to allow platform admin login
        try:
            if request.path.startswith('/admin/'):
                # Ensure no tenant context is set for admin
                set_current_tenant(None)
                request.tenant = None
                request.branding = None
                # Clear any RLS context for admin requests
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT set_config('app.current_tenant_id', '', FALSE)")
                except Exception:
                    # Non-fatal - continue without RLS context
                    logger.debug('Failed to clear RLS context for admin request')

                logger.debug('Skipping tenant detection for admin path')
                return None
        except Exception:
            # If request has no path or similar, continue with detection
            pass
        
        try:
            # Strategy 1: Check X-Tenant-ID header
            tenant_id = request.headers.get('X-Tenant-ID')
            if tenant_id:
                tenant = self._get_tenant_by_id(tenant_id)
                logger.debug(f"Tenant detected from header: {tenant}")
            
            # Strategy 2: Extract from subdomain
            if not tenant:
                tenant = self._get_tenant_from_subdomain(request)
                logger.debug(f"Tenant detected from subdomain: {tenant}")
            
            # Strategy 3: Check custom domain
            if not tenant:
                tenant = self._get_tenant_from_domain(request)
                logger.debug(f"Tenant detected from domain: {tenant}")
            
            # Set tenant context
            if tenant:
                if not tenant.is_active:
                    return JsonResponse(
                        {'error': 'Tenant is inactive'},
                        status=403
                    )
                
                # Set thread-local tenant
                set_current_tenant(tenant)
                
                # Set PostgreSQL RLS context
                self._set_rls_context(tenant)
                
                # Attach branding to request
                request.tenant = tenant
                request.branding = self._get_tenant_branding(tenant)
                
                logger.info(f"Tenant context set: {tenant.name} ({tenant.id})")
            else:
                # No tenant detected - allow for public endpoints
                # Debug: log host and headers so we can see what Django receives
                try:
                    logger.debug(f"request.get_host(): {request.get_host()}")
                    logger.debug(f"request.headers: {dict(request.headers)}")
                except Exception:
                    logger.debug("Failed to read request host/headers for debugging")

                set_current_tenant(None)
                request.tenant = None
                request.branding = None
                logger.debug("No tenant context set")
            
            # Set current user in thread-local
            if request.user.is_authenticated:
                set_current_user(request.user)
            
        except Exception as e:
            logger.error(f"Error in TenantMiddleware: {str(e)}", exc_info=True)
            return JsonResponse(
                {'error': 'Tenant detection failed'},
                status=500
            )
    
    def process_response(self, request, response):
        """
        Clean up thread-local storage after request.
        """
        # Clear thread-local storage
        set_current_tenant(None)
        set_current_user(None)
        
        return response
    
    def _get_tenant_by_id(self, tenant_id):
        """Get tenant by UUID."""
        from tenants.models import Tenant
        try:
            return Tenant.objects.get(id=tenant_id, is_active=True)
        except Tenant.DoesNotExist:
            return None
    
    def _get_tenant_from_subdomain(self, request):
        """Extract tenant from subdomain."""
        from tenants.models import Tenant
        
        hostname = request.get_host().split(':')[0]  # Remove port
        parts = hostname.split('.')
        
        # Check if subdomain exists (e.g., school1.nucleiq.com)
        if len(parts) >= 3:
            subdomain = parts[0]
            try:
                return Tenant.objects.get(subdomain=subdomain, is_active=True)
            except Tenant.DoesNotExist:
                return None
        
        return None
    
    def _get_tenant_from_domain(self, request):
        """Get tenant from custom domain mapping."""
        from tenants.models import Domain
        
        hostname = request.get_host().split(':')[0]
        
        try:
            domain = Domain.objects.select_related('tenant').get(
                domain=hostname,
                is_active=True
            )
            return domain.tenant if domain.tenant.is_active else None
        except Domain.DoesNotExist:
            return None
    
    def _set_rls_context(self, tenant):
        """
        Set PostgreSQL session variable for Row Level Security.
        
        This sets the app.current_tenant_id variable that RLS policies use.
        """
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT set_config('app.current_tenant_id', %s, FALSE)",
                [str(tenant.id)]
            )
            logger.debug(f"RLS context set for tenant: {tenant.id}")
    
    def _get_tenant_branding(self, tenant):
        """
        Get tenant branding configuration.
        
        Returns branding object or None if not configured.
        """
        try:
            return tenant.branding
        except Exception:
            return None
