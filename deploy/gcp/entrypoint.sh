#!/bin/bash
set -e

echo "========================================"
echo " nucleIQ Cloud Run - Fast Start"
echo "========================================"

cd /app/backend
export PORT=${PORT:-8080}

# Launch database setup in completely detached background
if [[ -n "$DATABASE_URL" ]]; then
    (
        sleep 10  # Wait for server to be fully up
        echo "[BACKGROUND] Starting database setup..."
        
        # Migrations
        python manage.py migrate --no-input 2>&1 | sed 's/^/[MIGRATE] /' || echo "[MIGRATE] Failed"
        
        # Cache table
        python manage.py createcachetable 2>&1 | sed 's/^/[CACHE] /' || true
        
        # Admin user
        if [[ -n "$ADMIN_USERNAME" && -n "$ADMIN_PASSWORD" ]]; then
            export DJANGO_SUPERUSER_USERNAME="$ADMIN_USERNAME"
            export DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD"
            export DJANGO_SUPERUSER_EMAIL="${ADMIN_EMAIL:-admin@nucleiq.io}"
            python manage.py createsuperuser --noinput 2>&1 | sed 's/^/[ADMIN] /' || echo "[ADMIN] Exists or failed"
        fi
        
        echo "[BACKGROUND] Database setup complete"
    ) >> /tmp/db-setup.log 2>&1 &
    
    echo "Database setup running in background (check logs)"
fi

echo "Starting Nginx + Gunicorn..."
exec "$@"
