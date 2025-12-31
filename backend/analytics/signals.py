"""
Signals for automatic usage logging
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from .models import UsageLog


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log user login."""
    if hasattr(user, 'tenant') and user.tenant:
        UsageLog.objects.create(
            tenant=user.tenant,
            user=user,
            action_type='LOGIN',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
        )


def get_client_ip(request):
    """Get client IP from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
