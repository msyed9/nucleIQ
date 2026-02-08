"""
WSGI config for NucleiQ project.
"""

import os

# Disable migration checks during startup for faster cold starts
os.environ.setdefault('DJANGO_SKIP_MIGRATION_CHECKS', 'true')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
