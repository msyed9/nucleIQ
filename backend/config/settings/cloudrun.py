"""
Google Cloud Run Settings for nucleIQ
Optimized for serverless, scale-to-zero deployment.
Cost: ~$0-15/month (scale to zero = FREE when not used!)
"""

import os
from pathlib import Path

from .base import *

# =============================================================================
# CORE SETTINGS
# =============================================================================

DEBUG = False

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable required")

ALLOWED_HOSTS = ['*']  # Cloud Run handles SSL/host verification

# =============================================================================
# DATABASE - Cloud SQL (PostgreSQL) or SQLite
# =============================================================================

DATABASE_URL = os.environ.get('DATABASE_URL', '')

if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
    
    # Cloud SQL uses Unix socket
    if '/cloudsql/' in DATABASE_URL:
        # Format: postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance
        pass
else:
    # SQLite for testing/demo
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': Path('/tmp/db.sqlite3'),  # Cloud Run has /tmp writable
        }
    }

# =============================================================================
# CACHE - In-Memory (no Redis needed)
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'nucleiq-cache',
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# =============================================================================
# CELERY - Synchronous (no separate worker)
# For async, use Cloud Tasks instead
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
# CLOUD RUN OPTIMIZATIONS
# =============================================================================

# Reduce memory usage
REST_FRAMEWORK['PAGE_SIZE'] = 25

# Optimize for cold starts
CONN_MAX_AGE = 0  # Don't persist connections (Cloud Run may scale down)

# Logging (Cloud Run captures stdout)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Disable heavy features
FACE_RECOGNITION_ENABLED = False

print("✅ Cloud Run settings loaded - Scale to Zero enabled!")
