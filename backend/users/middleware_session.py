"""
Session Timeout Middleware for Django Admin
Applies tenant-specific session timeouts for Django admin sessions.
"""

import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class AdminSessionTimeoutMiddleware(MiddlewareMixin):
    """
    Middleware to apply tenant-specific session timeout for Django admin.
    
    When a user logs into the Django admin, this middleware will:
    1. Check if the user belongs to a tenant
    2. Apply the tenant's admin_session_timeout_minutes setting
    3. Set the session expiry accordingly
    """
    
    def process_request(self, request):
        """
        Process the request and set session timeout if applicable.
        """
        # Only apply to authenticated users in Django admin
        if not request.path.startswith('/admin/') and not request.path.startswith('/nq-admin-panel/'):
            return None
            
        # Skip for logout requests to ensure session flushes properly
        if request.path.endswith('/logout/'):
            return None
        
        if not request.user.is_authenticated:
            return None
        
        # Check if user has a tenant
        if not hasattr(request.user, 'tenant') or not request.user.tenant:
            # No tenant - use default Django session timeout (2 weeks)
            return None
        
        try:
            tenant = request.user.tenant
            
            # Get tenant-specific admin session timeout (in minutes)
            admin_session_timeout_minutes = getattr(
                tenant, 
                'admin_session_timeout_minutes', 
                120  # default 2 hours
            )
            
            # Convert to seconds for Django session
            session_timeout_seconds = admin_session_timeout_minutes * 60
            
            # Set session expiry
            # Setting to 0 would expire on browser close, 
            # so we set a specific number of seconds
            request.session.set_expiry(session_timeout_seconds)
            
            logger.debug(
                f"Applied admin session timeout of {admin_session_timeout_minutes} "
                f"minutes for tenant {tenant.name}"
            )
            
        except Exception as e:
            logger.error(
                f"Error setting admin session timeout: {str(e)}", 
                exc_info=True
            )
            # Continue without custom timeout on error
            pass
        
        return None
