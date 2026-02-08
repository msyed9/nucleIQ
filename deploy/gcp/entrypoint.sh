#!/bin/bash
set -e

echo "========================================"
echo " nucleIQ - Cloud Run Startup"
echo "========================================"

cd /app/backend

# Cloud Run sets PORT environment variable
export PORT=${PORT:-8080}

# Database migration (if using Cloud SQL)
if [[ -n "$DATABASE_URL" ]]; then
    echo "🔄 Attempting database migrations (60s timeout)..."
    # timeout 60 ensures we don't block startup forever
    (timeout 60s python manage.py migrate --no-input) || echo "⚠️ Migration timed out or failed, starting server anyway..."
fi

# Static files are now collected during build

# Create cache table (quick)
(timeout 10s python manage.py createcachetable 2>/dev/null) || true

# Auto-create superuser if credentials are set
if [[ -n "$ADMIN_USERNAME" && -n "$ADMIN_PASSWORD" ]]; then
    echo "👤 Creating admin user (30s timeout)..."
    export DJANGO_SUPERUSER_USERNAME="$ADMIN_USERNAME"
    export DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD"
    export DJANGO_SUPERUSER_EMAIL="${ADMIN_EMAIL:-admin@nucleiq.io}"
    (timeout 30s python manage.py createsuperuser --noinput 2>/dev/null) || echo "Admin exists or skipped."
fi

echo "========================================"
echo "🚀 Starting on port $PORT..."
echo "========================================"

exec "$@"
