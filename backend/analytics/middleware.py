"""
Middleware for logging API usage into analytics.UsageLog
"""

import time
import logging
from django.utils.deprecation import MiddlewareMixin
from core.middleware import get_current_tenant

logger = logging.getLogger(__name__)


class UsageLoggingMiddleware(MiddlewareMixin):
    """Log API calls for analytics and platform usage insights."""

    EXCLUDED_PREFIXES = (
        '/admin/',
        '/static/',
        '/media/',
        '/health',
    )

    def process_request(self, request):
        request._usage_start_time = time.perf_counter()
        return None

    def process_response(self, request, response):
        try:
            path = getattr(request, 'path', '') or ''

            if not path.startswith('/api/'):
                return response

            for prefix in self.EXCLUDED_PREFIXES:
                if path.startswith(prefix):
                    return response

            tenant = get_current_tenant()
            if not tenant:
                return response

            from analytics.models import UsageLog

            start = getattr(request, '_usage_start_time', None)
            duration_ms = None
            if start is not None:
                duration_ms = int((time.perf_counter() - start) * 1000)

            status_code = getattr(response, 'status_code', None)
            is_error = bool(status_code and status_code >= 400)

            # Determine module from API path: /api/<module>/...
            module = ''
            try:
                parts = path.split('/')
                if len(parts) > 2:
                    module = parts[2]
            except Exception:
                module = ''

            UsageLog.objects.create(
                tenant=tenant,
                user=request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
                action_type='API_CALL',
                module=module,
                endpoint=path[:200],
                method=getattr(request, 'method', '')[:10],
                status_code=status_code,
                response_time_ms=duration_ms,
                is_error=is_error,
                ip_address=self._get_client_ip(request),
                user_agent=(request.META.get('HTTP_USER_AGENT', '') or '')[:500]
            )
        except Exception as e:
            logger.debug(f"Usage logging failed: {e}")

        return response

    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')