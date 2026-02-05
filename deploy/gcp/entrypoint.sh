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
    echo "🔄 Running database migrations..."
    python manage.py migrate --no-input || echo "Migration skipped"
fi

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --no-input --clear 2>/dev/null || true

# Create cache table
python manage.py createcachetable 2>/dev/null || true

# Auto-create superuser if credentials are set (runs only once per database)
if [[ -n "$ADMIN_USERNAME" && -n "$ADMIN_PASSWORD" ]]; then
    echo "👤 Checking for admin user..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$ADMIN_USERNAME').exists():
    User.objects.create_superuser('$ADMIN_USERNAME', '${ADMIN_EMAIL:-admin@nucleiq.io}', '$ADMIN_PASSWORD')
    print('✅ Admin user created successfully!')
else:
    print('ℹ️ Admin user already exists.')
" 2>/dev/null || echo "Admin creation skipped."
fi

echo "========================================"
echo "🚀 Starting on port $PORT..."
echo "========================================"

exec "$@"
