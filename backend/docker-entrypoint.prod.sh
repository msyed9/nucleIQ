#!/bin/bash
set -e

echo "=========================================="
echo "NucleiQ Backend - Production Startup"
echo "=========================================="

# Wait for database to be ready
echo "⏳ Waiting for database..."
while ! python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
    echo "Database not ready, waiting..."
    sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
python manage.py migrate --no-input

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --no-input

# Setup Row Level Security if needed
if [ -f "/app/backend/scripts/setup_rls.py" ]; then
    echo "🔒 Setting up Row Level Security..."
    python scripts/setup_rls.py || echo "RLS setup skipped or already configured"
fi

# Create cache tables
echo "🗄️ Creating cache tables..."
python manage.py createcachetable 2>/dev/null || echo "Cache tables already exist"

echo "=========================================="
echo "🚀 Starting Gunicorn server..."
echo "=========================================="

# Start Gunicorn with production settings
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-2} \
    --threads ${GUNICORN_THREADS:-4} \
    --worker-class gthread \
    --worker-tmp-dir /dev/shm \
    --timeout ${GUNICORN_TIMEOUT:-120} \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --log-level ${LOG_LEVEL:-info}
