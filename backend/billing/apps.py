"""
Django app configuration for Billing
"""

from django.apps import AppConfig


class BillingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'billing'
    verbose_name = 'Billing & Subscriptions'
    
    def ready(self):
        """Import signals when app is ready."""
        import billing.signals  # noqa
