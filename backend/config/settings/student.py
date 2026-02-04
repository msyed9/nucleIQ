"""
Student Edition Settings for nucleIQ backend.
Optimized for Azure Student Credits - Single Container Deployment.
Cost Target: ~$15-30/month or FREE with student credits.
"""

import os
from pathlib import Path

# Import base settings
from .base import *

# =============================================================================
# CORE SETTINGS
# =============================================================================

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

SECRET_KEY = os.environ.get('SECRET_KEY', 'student-dev-key-change-in-production')

# Allow all hosts for simplicity (single container)
ALLOWED_HOSTS = ['*']

# =============================================================================
# DATABASE - Use PostgreSQL or SQLite for cost savings
# =============================================================================

DATABASE_URL = os.environ.get('DATABASE_URL', '')

if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
        )
    }
    # Add SSL for Azure PostgreSQL
    if 'postgres.database.azure.com' in DATABASE_URL:
        DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
else:
    # Fallback to SQLite for development/testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': Path('/app/data/db.sqlite3') if os.path.exists('/app/data') else BASE_DIR / 'db.sqlite3',
        }
    }

# =============================================================================
# CACHE - Use Local Memory Cache (no Redis needed = cost savings)
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'nucleiq-cache',
    }
}

# Session backend - use database (no Redis)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# =============================================================================
# CELERY - Run Tasks Synchronously (no separate worker = cost savings)
# =============================================================================

# When CELERY_TASK_ALWAYS_EAGER is True, tasks run in the same process
# No need for Redis broker or separate Celery workers
CELERY_TASK_ALWAYS_EAGER = os.environ.get('CELERY_ALWAYS_EAGER', 'True').lower() == 'true'
CELERY_TASK_EAGER_PROPAGATES = True

# If you want async tasks, set CELERY_ALWAYS_EAGER=False and provide Redis
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'memory://')
CELERY_RESULT_BACKEND = 'django-db'

# =============================================================================
# STATIC & MEDIA FILES - Local Storage (Container Volume)
# =============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Use WhiteNoise for static file serving (no separate CDN needed)
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =============================================================================
# SECURITY - Relaxed for Student/Development
# =============================================================================

SECURE_SSL_REDIRECT = False  # Azure handles SSL termination
SESSION_COOKIE_SECURE = os.environ.get('HTTPS_ENABLED', 'False').lower() == 'true'
CSRF_COOKIE_SECURE = os.environ.get('HTTPS_ENABLED', 'False').lower() == 'true'

# CORS - Allow all for simplicity
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# EMAIL - Use Console Backend (Free, for debugging)
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# =============================================================================
# LOGGING - Simple Console Logging
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {message}',
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
}

# =============================================================================
# PERFORMANCE OPTIMIZATIONS FOR LIMITED RESOURCES
# =============================================================================

# Reduce pagination for lower memory usage
REST_FRAMEWORK['PAGE_SIZE'] = 25

# Limit file upload size (reduce memory usage)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Disable unnecessary features for student tier
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(hours=2)  # Longer tokens = fewer refreshes
SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=14)

# =============================================================================
# FEATURE FLAGS - Disable Heavy Features
# =============================================================================

# Disable face recognition (saves ~500MB+ in container size)
FACE_RECOGNITION_ENABLED = False

# Disable real-time WebSocket features
WEBSOCKET_ENABLED = False

# Use simpler report generation
ADVANCED_REPORTS_ENABLED = False

print("✅ Student Edition settings loaded - Optimized for Azure Student Credits")
