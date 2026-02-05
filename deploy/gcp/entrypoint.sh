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
    echo "🔄 Attempting database migrations..."
    # We use a subshell so if it fails, the script continues
    (python manage.py migrate --no-input) || echo "⚠️ Migration failed, but starting server anyway..."
fi

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --no-input --clear 2>/dev/null || true

# Create cache table
python manage.py createcachetable 2>/dev/null || true

# Auto-create superuser if credentials are set
if [[ -n "$ADMIN_USERNAME" && -n "$ADMIN_PASSWORD" ]]; then
    echo "👤 Creating admin user..."
    export DJANGO_SUPERUSER_USERNAME="$ADMIN_USERNAME"
    export DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD"
    export DJANGO_SUPERUSER_EMAIL="${ADMIN_EMAIL:-admin@nucleiq.io}"
    python manage.py createsuperuser --noinput 2>/dev/null || echo "Admin exists or skipped."
fi

echo "========================================"
echo "🚀 Starting on port $PORT..."
echo "========================================"

exec "$@"
