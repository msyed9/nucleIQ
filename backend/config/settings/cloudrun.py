"""
Google Cloud Run Settings for nucleIQ
Production-ready settings with Cloud SQL PostgreSQL
"""

import os
from pathlib import Path

from .base import *

# =============================================================================
# CORE SETTINGS
# =============================================================================

print("✅ Cloud Run settings loaded - Scale to Zero enabled!")

DEBUG = False

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required!")

ALLOWED_HOSTS = ['*']  # Cloud Run handles SSL/host verification

# =============================================================================
# DATABASE - Cloud SQL (PostgreSQL) - REQUIRED
# =============================================================================

DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required for Cloud Run!")

import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# =============================================================================
# CACHE - In-Memory (no Redis needed for MVP)
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'nucleiq-cache',
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# =============================================================================
# CELERY - Synchronous (no separate worker for MVP)
# =============================================================================

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# =============================================================================
# STATIC & MEDIA FILES
# =============================================================================

# Static files served by WhiteNoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files - use Google Cloud Storage for persistence
GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME', '')

if GCS_BUCKET_NAME:
    DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
    GS_BUCKET_NAME = GCS_BUCKET_NAME
    GS_DEFAULT_ACL = 'publicRead'
    MEDIA_URL = f'https://storage.googleapis.com/{GCS_BUCKET_NAME}/'
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = Path('/tmp/media')  # Ephemeral in Cloud Run

# =============================================================================
# SECURITY
# =============================================================================

# Cloud Run handles HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False  # Cloud Run redirects automatically
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
