#!/bin/bash
# Docker Entrypoint Script for NucleiQ Backend
# =============================================
# This script handles automated startup tasks for the Django backend.
# It should be used as the entrypoint in docker-compose.yml
#
# Tasks performed:
# 1. Wait for database to be ready
# 2. Run database migrations
# 3. Apply RLS policies
# 4. Collect static files
# 5. Create superuser (if configured)
# 6. Seed initial data (if configured)
# 7. Start the application server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo_step() {
    echo -e "${CYAN}==>${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           NucleiQ Backend Startup                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Configuration from environment
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-nucleiq_user}"
DB_NAME="${DB_NAME:-nucleiq}"
WAIT_FOR_DB="${WAIT_FOR_DB:-true}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
RUN_RLS_SETUP="${RUN_RLS_SETUP:-true}"
RUN_COLLECTSTATIC="${RUN_COLLECTSTATIC:-true}"
CREATE_SUPERUSER="${CREATE_SUPERUSER:-false}"
SEED_DATA="${SEED_DATA:-false}"
DJANGO_SUPERUSER_EMAIL="${DJANGO_SUPERUSER_EMAIL:-}"
DJANGO_SUPERUSER_PASSWORD="${DJANGO_SUPERUSER_PASSWORD:-}"

# Step 1: Wait for database
if [ "$WAIT_FOR_DB" = "true" ]; then
    echo_step "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
    
    max_attempts=30
    attempt=0
    
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo_error "PostgreSQL did not become ready in time!"
            exit 1
        fi
        echo "  Waiting... ($attempt/$max_attempts)"
        sleep 2
    done
    
    echo_success "PostgreSQL is ready!"
fi

# Step 2: Run database migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo_step "Running database migrations..."
    
    python manage.py migrate --noinput
    
    if [ $? -eq 0 ]; then
        echo_success "Migrations applied successfully!"
    else
        echo_error "Migration failed!"
        exit 1
    fi
fi

# Step 3: Apply RLS policies
if [ "$RUN_RLS_SETUP" = "true" ]; then
    echo_step "Applying RLS policies..."
    
    # Check if management command exists
    if python manage.py help create_rls_policies > /dev/null 2>&1; then
        python manage.py create_rls_policies
        echo_success "RLS policies applied via management command!"
    else
        # Fall back to SQL script
        RLS_SCRIPT="/app/backend/scripts/init_rls.sql"
        if [ -f "$RLS_SCRIPT" ]; then
            PGPASSWORD="${DB_PASSWORD:-nucleiq_pass_dev_only}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$RLS_SCRIPT" > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo_success "RLS policies applied via SQL script!"
            else
                echo_warning "RLS policy application had issues (may already exist)"
            fi
        else
            echo_warning "RLS script not found, skipping..."
        fi
    fi
fi

# Step 4: Collect static files
if [ "$RUN_COLLECTSTATIC" = "true" ]; then
    echo_step "Collecting static files..."
    
    python manage.py collectstatic --noinput --clear > /dev/null 2>&1
    
    echo_success "Static files collected!"
fi

# Step 5: Create superuser (if configured)
if [ "$CREATE_SUPERUSER" = "true" ]; then
    if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
        echo_step "Creating superuser..."
        
        python manage.py shell << EOF
from users.models import User
if not User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists():
    User.objects.create_superuser(
        email='$DJANGO_SUPERUSER_EMAIL',
        password='$DJANGO_SUPERUSER_PASSWORD'
    )
    print('Superuser created!')
else:
    print('Superuser already exists')
EOF
        echo_success "Superuser setup complete!"
    else
        echo_warning "Superuser creation skipped (credentials not provided)"
    fi
fi

# Step 6: Seed initial data (if configured)
if [ "$SEED_DATA" = "true" ]; then
    echo_step "Seeding initial data..."
    
    # Seed subscription plans
    if [ -f "create_plans.py" ]; then
        python manage.py shell -c "exec(open('create_plans.py').read())" > /dev/null 2>&1 || true
        echo_success "Subscription plans seeded!"
    fi
    
    # Seed permissions (if command exists)
    if python manage.py help seed_permissions > /dev/null 2>&1; then
        python manage.py seed_permissions > /dev/null 2>&1 || true
        echo_success "Permissions seeded!"
    fi
fi

# Step 7: Start application server
echo_step "Starting application server..."
echo ""

# Check which server to use
if [ "$DJANGO_ENV" = "production" ] || [ "$DEBUG" = "False" ]; then
    echo "Starting Gunicorn (production mode)..."
    exec gunicorn config.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers ${GUNICORN_WORKERS:-4} \
        --threads ${GUNICORN_THREADS:-2} \
        --worker-class gthread \
        --access-logfile - \
        --error-logfile - \
        --capture-output \
        --timeout 120
else
    echo "Starting Django development server..."
    exec python manage.py runserver 0.0.0.0:8000
fi
