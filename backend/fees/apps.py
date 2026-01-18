"""
Fees app configuration
"""

from django.apps import AppConfig


class FeesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fees'
    verbose_name = 'Fee Collection'
    
    def ready(self):
        """Import signals when app is ready."""
        import fees.signals  # noqa: F401
