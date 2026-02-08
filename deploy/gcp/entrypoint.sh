#!/bin/bash
set -e

echo "========================================"
echo " nucleIQ - Cloud Run Startup (Fast Mode)"
echo "========================================"

cd /app/backend

# Cloud Run sets PORT environment variable
export PORT=${PORT:-8080}

echo "🚀 Starting web server immediately..."
echo "📊 Database setup will run in background..."

# Start the web server in background
exec "$@" &
SERVER_PID=$!

# Now do database work in background (won't block startup)
(
    sleep 5  # Give server time to start
    
    if [[ -n "$DATABASE_URL" ]]; then
        echo "🔄 Running database migrations..."
        timeout 120s python manage.py migrate --no-input 2>&1 || echo "⚠️ Migration failed"
        
        timeout 10s python manage.py createcachetable 2>&1 || true
        
        if [[ -n "$ADMIN_USERNAME" && -n "$ADMIN_PASSWORD" ]]; then
            echo "👤 Creating admin user..."
            export DJANGO_SUPERUSER_USERNAME="$ADMIN_USERNAME"
            export DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD"
            export DJANGO_SUPERUSER_EMAIL="${ADMIN_EMAIL:-admin@nucleiq.io}"
            timeout 30s python manage.py createsuperuser --noinput 2>&1 || echo "Admin exists or creation failed"
        fi
        
        echo "✅ Background database setup complete"
    fi
) &

# Wait for the main server process
wait $SERVER_PID
