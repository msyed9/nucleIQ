"""
Middleware for subscription enforcement
Checks subscription status and limits before allowing access
"""

from django.http import JsonResponse
from django.utils import timezone
from .models import Subscription


class SubscriptionEnforcementMiddleware:
    """
    Middleware to enforce subscription status and limits.
    Blocks access if subscription is expired or inactive.
    """
    
    # Paths that should bypass subscription checks
    EXEMPT_PATHS = [
        '/api/auth/',
        '/api/billing/',
        '/admin/',
        '/api/docs/',
        '/api/schema/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if path is exempt
        if any(request.path.startswith(path) for path in self.EXEMPT_PATHS):
            return self.get_response(request)
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return self.get_response(request)
        
        # Platform admins bypass all checks
        if request.user.is_platform_admin:
            return self.get_response(request)
        
        # Check if user has a tenant
        if not request.user.tenant:
            return self.get_response(request)
        
        # Check subscription status
        try:
            subscription = Subscription.objects.get(tenant=request.user.tenant)
            
            # Check if subscription is active
            if not subscription.is_active:
                return JsonResponse({
                    'error': 'Subscription expired or inactive',
                    'message': 'Please renew your subscription to continue using the platform',
                    'subscription_status': subscription.status,
                    'expired_at': subscription.current_period_end,
                }, status=402)  # 402 Payment Required
            
        except Subscription.DoesNotExist:
            return JsonResponse({
                'error': 'No subscription found',
                'message': 'Please subscribe to a plan to access the platform',
            }, status=402)
        
        # Proceed with request
        response = self.get_response(request)
        return response


def require_subscription_limit(resource_type):
    """
    Decorator to check subscription limits before allowing resource creation.
    
    Usage:
        @require_subscription_limit('students')
        def create_student(request):
            ...
    
    Args:
        resource_type: 'students', 'staff', or 'storage_gb'
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            # Skip check for platform admins
            if request.user.is_platform_admin:
                return view_func(request, *args, **kwargs)
            
            # Get subscription
            try:
                subscription = Subscription.objects.get(tenant=request.user.tenant)
            except Subscription.DoesNotExist:
                return JsonResponse({
                    'error': 'No subscription found',
                }, status=402)
            
            # Get current count (this would be implemented based on actual models)
            current_count = 0
            # Example: current_count = request.user.tenant.students.count()
            
            # Check limit
            if not subscription.is_within_limit(resource_type, current_count):
                max_limit = getattr(subscription.plan, f'max_{resource_type}', 0)
                return JsonResponse({
                    'error': 'Subscription limit reached',
                    'message': f'Your plan allows maximum {max_limit} {resource_type}',
                    'current_count': current_count,
                    'max_limit': max_limit,
                    'upgrade_url': '/billing/plans',
                }, status=403)
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator
