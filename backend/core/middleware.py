"""
Tenant Middleware for NucleiQ
Handles tenant detection, RLS context setting, and branding injection.
"""

import logging
from threading import local
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.http import JsonResponse
from django.conf import settings

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
                if not tenant:
                    return JsonResponse(
                        {'error': 'Invalid tenant identifier'},
                        status=400
                    )
            
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
            user = None
            if request.user.is_authenticated:
                user = request.user
                set_current_user(user)

                enforcement_response = self._enforce_authenticated_tenant(request, tenant)
                if enforcement_response:
                    return enforcement_response
            
            # Set PostgreSQL RLS context (after user is available for super admin check)
            if tenant:
                self._set_rls_context(tenant, user)
            
        except Exception as e:
            logger.error(f"Error in TenantMiddleware: {str(e)}", exc_info=True)
            return JsonResponse(
                {'error': 'Tenant detection failed'},
                status=500
            )
    
    def process_response(self, request, response):
        """
        Clean up thread-local storage and PostgreSQL session context after request.
        CRITICAL: This prevents tenant context leakage between requests with connection pooling.
        """
        # Clear thread-local storage
        set_current_tenant(None)
        set_current_user(None)
        
        # Clear PostgreSQL RLS context to prevent leakage with connection pooling
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT set_config('app.current_tenant_id', '', TRUE)")
                cursor.execute("SELECT set_config('app.is_super_admin', 'false', TRUE)")
        except Exception as e:
            logger.debug(f'Failed to clear RLS context: {e}')
        
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
    
    def _set_rls_context(self, tenant, user=None):
        """
        Set PostgreSQL session variables for Row Level Security.
        
        Sets:
        - app.current_tenant_id: The current tenant UUID for RLS policies
        - app.is_super_admin: Boolean flag for super admin RLS bypass
        
        Note: Using TRUE for set_config makes it transaction-scoped,
        which is safer with connection pooling.
        """
        with connection.cursor() as cursor:
            # Set tenant context
            cursor.execute(
                "SELECT set_config('app.current_tenant_id', %s, TRUE)",
                [str(tenant.id)]
            )
            
            # Set super admin flag for RLS bypass
            is_super_admin = 'false'
            if user and hasattr(user, 'is_platform_admin') and user.is_platform_admin:
                is_super_admin = 'true'
            elif user and hasattr(user, 'is_superuser') and user.is_superuser:
                is_super_admin = 'true'
            
            cursor.execute(
                "SELECT set_config('app.is_super_admin', %s, TRUE)",
                [is_super_admin]
            )
            
            logger.debug(f"RLS context set for tenant: {tenant.id}, is_super_admin: {is_super_admin}")
    
    def _get_tenant_branding(self, tenant):
        """
        Get tenant branding configuration.
        
        Returns branding object or None if not configured.
        """
        try:
            return tenant.branding
        except Exception:
            return None

    def _enforce_authenticated_tenant(self, request, tenant):
        """Enforce tenant context for authenticated non-platform users."""
        if not request.user or not request.user.is_authenticated:
            return None

        if request.user.is_platform_admin or request.user.is_superuser:
            return None

        if not request.user.tenant_id:
            return None

        if not tenant:
            if request.path.startswith('/api/') and not self._is_tenant_optional_path(request.path):
                return JsonResponse(
                    {'error': 'Tenant context required'},
                    status=400
                )
            return None

        if request.user.tenant_id != tenant.id:
            return JsonResponse(
                {'error': 'Tenant mismatch'},
                status=403
            )

        return None

    def _is_tenant_optional_path(self, path):
        """Paths that can operate without tenant context for authenticated users."""
        optional_prefixes = [
            '/api/health/',
            '/api/schema/',
            '/api/docs/',
            '/api/redoc/',
        ]

        return any(path.startswith(prefix) for prefix in optional_prefixes)


class ApiVersionRoutingMiddleware(MiddlewareMixin):
    """
    Middleware to transparently route /api/ requests to tenant-specific versions.

    - Skips explicit versioned paths (/api/v1/, /api/v2/)
    - Resolves module-based version overrides per tenant
    - Rewrites request.path_info for internal routing without redirecting
    """

    def process_request(self, request):
        path = request.path_info or request.path

        if not path.startswith('/api/'):
            return None

        if path.startswith('/api/v1/') or path.startswith('/api/v2/'):
            return None

        if path in ['/api', '/api/']:
            return None

        # Skip non-versioned API utility endpoints
        excluded_prefixes = getattr(settings, 'API_VERSION_EXCLUDED_PREFIXES', [])
        remainder = path[len('/api/'):]
        if not remainder:
            return None

        first_segment = remainder.split('/', 1)[0]
        if first_segment in excluded_prefixes:
            return None

        module_aliases = getattr(settings, 'API_MODULE_VERSION_ALIASES', {})
        module_key = module_aliases.get(first_segment, first_segment)
        allowed_modules = set(getattr(settings, 'API_VERSION_ALLOWED_MODULES', []))

        if allowed_modules:
            if module_key not in allowed_modules:
                if first_segment in allowed_modules:
                    module_key = first_segment
                else:
                    module_key = None

        default_version = settings.REST_FRAMEWORK.get('DEFAULT_VERSION', 'v1')
        allowed_versions = settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS', [default_version])

        tenant = getattr(request, 'tenant', None)
        resolved_version = default_version

        if tenant:
            try:
                from tenants.models import TenantSettings
                tenant_settings, _ = TenantSettings.objects.get_or_create(tenant=tenant)
                module_versions = tenant_settings.api_module_versions or {}

                module_version = None
                if module_key:
                    module_version = module_versions.get(module_key)

                if module_version not in allowed_versions:
                    module_version = None

                resolved_version = (
                    module_version or
                    tenant_settings.api_default_version or
                    default_version
                )
            except Exception:
                resolved_version = default_version

        if resolved_version not in allowed_versions:
            resolved_version = default_version

        new_path = f"/api/{resolved_version}/" + remainder
        request.path_info = new_path
        request.META['PATH_INFO'] = new_path
        request.resolved_api_version = resolved_version
        logger.info(
            "API version resolved: %s (module=%s, path=%s)",
            resolved_version,
            module_key or first_segment,
            path
        )
