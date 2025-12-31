"""
Django app configuration for Analytics
"""

from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analytics'
    verbose_name = 'Platform Analytics'
    
    def ready(self):
        """Import signals when app is ready."""
        import analytics.signals  # noqa
