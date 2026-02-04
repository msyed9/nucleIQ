"""
Django Base Settings for NucleiQ Multi-Tenant SaaS
This file contains settings common to all environments.
"""

import os
from pathlib import Path
from decouple import config
from corsheaders.defaults import default_headers

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Security
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'django_celery_beat',
    'django_celery_results',
    'simple_history',  # Audit trail
    'storages',  # Cloud storage backends (Azure, S3, etc.)
    
    # Local apps
    'core',
    'tenants',
    'users',
    'billing',
    'dashboard',
    'search',
    'students',
    'analytics',
    'idcards',  # New ID Card system with templates and QR codes
    'staff',
    'attendance',
    'fees',
    'finance',
    'timetable',
    'academics',
    'exams',
    'hr',
    'payroll',
    'communication',
    'crm',
    'cms',
    'library',
    'transport',
    'inventory',
    'hostel',
    'salah_tracker',
    'habit_tracker',
    # 'alumni',  # Moved to students app
    'lms',
    'certificates',
    'security',
    'placement',
    'helpdesk',
    'reports',
    'data_management',
    # 'notifications',  # Using communication app instead
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',  # Audit trail - must be after auth
    
    # Custom middleware - MUST be after authentication
    'core.middleware.TenantMiddleware',
    'core.middleware.ApiVersionRoutingMiddleware',
    'analytics.middleware.UsageLoggingMiddleware',
    'users.middleware_session.AdminSessionTimeoutMiddleware',  # Must be after TenantMiddleware
    'users.middleware.PermissionMiddleware',
    'users.middleware.RoleCheckMiddleware',
    'billing.middleware.SubscriptionEnforcementMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'users.context_processors.permissions_processor',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='nucleiq'),
        'USER': config('DB_USER', default='nucleiq_user'),
        'PASSWORD': config('DB_PASSWORD', default='nucleiq_pass_dev_only'),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
        'ATOMIC_REQUESTS': True,
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload settings (52MB to accommodate photo ZIPs up to 50MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50 MB
# Increase max form fields for large admin inlines (e.g., tenant config)
DATA_UPLOAD_MAX_NUMBER_FIELDS = config('DATA_UPLOAD_MAX_NUMBER_FIELDS', default=20000, cast=int)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'users.backends.RoleBasedAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.NamespaceVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1', 'v2'],
    'VERSION_PARAM': 'version',
}

# API Version Routing (Tenant-Aware)
API_VERSION_EXCLUDED_PREFIXES = [
    'health', 'schema', 'docs', 'redoc', 'mobile'
]

# Map URL path prefixes to module keys for per-tenant version overrides
API_MODULE_VERSION_ALIASES = {
    # Users/auth module
    'auth': 'users',
    'users': 'users',
    'roles': 'users',
    'permissions': 'users',
    'impersonate': 'users',
    'permissions-matrix': 'users',

    # Admin utilities
    'recycle-bin': 'admin',
    'audit-logs': 'admin',
    'advanced-reports': 'admin',

    # Students/parent portal
    'parent': 'students',
}

# Canonical module keys allowed in api_module_versions
API_VERSION_ALLOWED_MODULES = [
    'users',
    'admin',
    'communication',
    'billing',
    'dashboard',
    'search',
    'students',
    'analytics',
    'idcards',
    'staff',
    'attendance',
    'fees',
    'finance',
    'tenants',
    'timetable',
    'academics',
    'exams',
    'hr',
    'payroll',
    'crm',
    'cms',
    'library',
    'transport',
    'inventory',
    'hostel',
    'salah',
    'habits',
    'lms',
    'certificates',
    'security',
    'placement',
    'helpdesk',
    'reports',
    'data-management',
    'data_management',
    'mobile',
    # Alias keys allowed for convenience
    'auth',
    'roles',
    'permissions',
    'impersonate',
    'permissions-matrix',
    'parent',
    'recycle-bin',
    'audit-logs',
    'advanced-reports',
]

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://localhost:3000'
).split(',')

# Allow custom tenant header for CORS preflight
CORS_ALLOW_HEADERS = list(default_headers) + [
    'X-Tenant-ID',
]

# Celery Configuration
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://redis:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_CACHE_BACKEND = 'django-cache'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://redis:6379/1'),
        'OPTIONS': {
        },
        'KEY_PREFIX': 'nucleiq',
        'TIMEOUT': 300,
    }
}

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'NucleiQ API',
    'DESCRIPTION': 'Multi-Tenant School Management SaaS Platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
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
        'core': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'tenants': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Multi-Tenancy Settings
TENANT_MODEL = 'tenants.Tenant'
TENANT_DOMAIN_MODEL = 'tenants.Domain'

# Email Configuration (for password reset)
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='NucleiQ <noreply@nucleiq.com>')

# Frontend URL (for password reset links)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# Payment Gateway Settings
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='')

STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# SMS Provider Settings
SMS_PROVIDER = config('SMS_PROVIDER', default='twilio')  # 'twilio', 'msg91', 'textlocal'

# Twilio Settings
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')
TWILIO_PHONE_NUMBER = config('TWILIO_PHONE_NUMBER', default='')

# MSG91 Settings
MSG91_AUTH_KEY = config('MSG91_AUTH_KEY', default='')
MSG91_SENDER_ID = config('MSG91_SENDER_ID', default='')
MSG91_ROUTE = config('MSG91_ROUTE', default='4')  # 4 for transactional

# TextLocal Settings
TEXTLOCAL_API_KEY = config('TEXTLOCAL_API_KEY', default='')
TEXTLOCAL_SENDER = config('TEXTLOCAL_SENDER', default='TXTLCL')

# WhatsApp Provider Settings
WHATSAPP_PROVIDER = config('WHATSAPP_PROVIDER', default='twilio')  # 'twilio', 'official'

# Twilio WhatsApp Settings (uses same Twilio credentials as above)
TWILIO_WHATSAPP_NUMBER = config('TWILIO_WHATSAPP_NUMBER', default='whatsapp:+14155238886')  # Twilio Sandbox

# Official WhatsApp Business API Settings
WHATSAPP_BUSINESS_ACCOUNT_ID = config('WHATSAPP_BUSINESS_ACCOUNT_ID', default='')
WHATSAPP_ACCESS_TOKEN = config('WHATSAPP_ACCESS_TOKEN', default='')
WHATSAPP_PHONE_NUMBER_ID = config('WHATSAPP_PHONE_NUMBER_ID', default='')
WHATSAPP_VERIFY_TOKEN = config('WHATSAPP_VERIFY_TOKEN', default='nucleiq_webhook_token')
