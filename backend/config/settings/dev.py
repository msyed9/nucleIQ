"""
Development Settings
Extends base settings with development-specific configurations.
"""

from .base import *

# Debug mode
DEBUG = True

# Additional development apps
INSTALLED_APPS += [
    'django_extensions',
    'debug_toolbar',
]

# Debug toolbar middleware
MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Internal IPs for debug toolbar
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable password hashing for faster tests (development only)
# PASSWORD_HASHERS = [
#     'django.contrib.auth.hashers.MD5PasswordHasher',
# ]

# Allow all CORS origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Logging - More verbose in development
LOGGING['loggers']['core']['level'] = 'DEBUG'
LOGGING['loggers']['tenants']['level'] = 'DEBUG'
LOGGING['root']['level'] = 'DEBUG'
