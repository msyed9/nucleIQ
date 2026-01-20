# NucleiQ Fresh Deployment Script
# ================================
# This script performs a complete fresh deployment with new containers
# Run from the project root directory
#
# Usage: 
#   .\scripts\fresh_deploy.ps1
#   .\scripts\fresh_deploy.ps1 -SkipCleanup
#   .\scripts\fresh_deploy.ps1 -SkipSeed

param(
    [switch]$SkipCleanup,
    [switch]$SkipSeed,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
NucleiQ Fresh Deployment Script
================================

Usage: .\scripts\fresh_deploy.ps1 [options]

Options:
    -SkipCleanup    Skip project cleanup step
    -SkipSeed       Skip seeding demo data
    -Help           Show this help message

This script will:
1. Clean up unnecessary files (optional)
2. Stop and remove existing containers and volumes
3. Rebuild all containers from scratch
4. Run database migrations
5. Apply RLS policies
6. Create a superuser
7. Seed initial data (optional)
8. Start all services

"@
    exit
}

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $ProjectRoot

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Header
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║           NucleiQ Fresh Deployment Script                    ║
║           Multi-Tenant School Management SaaS                ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Step 1: Project Cleanup (optional)
if (-not $SkipCleanup) {
    Write-Step "Step 1: Project Cleanup"
    
    $cleanupScript = Join-Path $ProjectRoot "scripts\cleanup_project.ps1"
    if (Test-Path $cleanupScript) {
        $response = Read-Host "Run project cleanup to remove unnecessary files? (y/n)"
        if ($response -eq 'y') {
            & $cleanupScript
            Write-Success "Cleanup complete"
        }
        else {
            Write-Warning "Cleanup skipped"
        }
    }
    else {
        Write-Warning "Cleanup script not found, skipping"
    }
}
else {
    Write-Warning "Step 1: Cleanup skipped (--SkipCleanup)"
}

# Step 2: Stop existing containers
Write-Step "Step 2: Stopping Existing Containers"

docker-compose down --remove-orphans 2>$null
Write-Success "Containers stopped"

# Step 3: Remove volumes
Write-Step "Step 3: Removing Docker Volumes"

$response = Read-Host "Remove all data volumes (database will be wiped)? (y/n)"
if ($response -eq 'y') {
    docker-compose down -v 2>$null
    docker volume prune -f 2>$null
    Write-Success "Volumes removed"
}
else {
    Write-Warning "Volumes preserved"
}

# Step 4: Clean migration files
Write-Step "Step 4: Cleaning Migration Files"

$response = Read-Host "Delete all migration files for fresh start? (y/n)"
if ($response -eq 'y') {
    Get-ChildItem -Path "backend" -Include "*.py" -Recurse | 
    Where-Object { $_.DirectoryName -match "migrations" -and $_.Name -ne "__init__.py" } | 
    Remove-Item -Force
    
    Get-ChildItem -Path "backend" -Include "__pycache__" -Recurse -Directory | 
    Where-Object { $_.FullName -match "migrations" } | 
    Remove-Item -Recurse -Force 2>$null
    
    Write-Success "Migration files cleaned"
}
else {
    Write-Warning "Migration files preserved"
}

# Step 5: Rebuild containers
Write-Step "Step 5: Rebuilding Docker Containers"

Write-Host "Building containers (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Success "Containers built successfully"
}
else {
    Write-Error "Container build failed!"
    exit 1
}

# Step 6: Start database and redis
Write-Step "Step 6: Starting Database Services"

docker-compose up -d db redis
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $attempt++
    $result = docker-compose exec -T db pg_isready -U nucleiq_user 2>$null
} while ($LASTEXITCODE -ne 0 -and $attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Error "PostgreSQL failed to start!"
    exit 1
}

Write-Success "Database is ready"

# Step 7: Create migrations
Write-Step "Step 7: Creating Database Migrations"

docker-compose run --rm backend python fresh_migrations_setup.py

if ($LASTEXITCODE -eq 0) {
    Write-Success "Migrations created"
}
else {
    Write-Error "Migration creation failed!"
    exit 1
}

# Step 8: Apply migrations
Write-Step "Step 8: Applying Database Migrations"

docker-compose run --rm backend python manage.py migrate --noinput

if ($LASTEXITCODE -eq 0) {
    Write-Success "Migrations applied"
}
else {
    Write-Error "Migration application failed!"
    exit 1
}

# Step 9: Apply RLS policies
Write-Step "Step 9: Applying Row Level Security Policies"

docker-compose exec -T db psql -U nucleiq_user -d nucleiq -f /docker-entrypoint-initdb.d/01_init_rls.sql 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "RLS policies applied"
}
else {
    Write-Warning "RLS policies may need manual application"
    Write-Host "Run: docker-compose exec db psql -U nucleiq_user -d nucleiq -f /docker-entrypoint-initdb.d/01_init_rls.sql"
}

# Step 10: Create superuser
Write-Step "Step 10: Creating Superuser"

Write-Host "Create a platform admin user:" -ForegroundColor Yellow
docker-compose run --rm backend python manage.py createsuperuser

# Step 11: Seed initial data
if (-not $SkipSeed) {
    Write-Step "Step 11: Seeding Initial Data"
    
    # Seed subscription plans
    Write-Host "Seeding subscription plans..." -ForegroundColor Yellow
    docker-compose run --rm backend python manage.py shell -c "exec(open('create_plans.py').read())" 2>$null
    
    # Ask about demo data
    $response = Read-Host "Seed demo data (for testing)? (y/n)"
    if ($response -eq 'y') {
        docker-compose run --rm backend python manage.py shell -c "exec(open('seed_all_demo_data.py').read())" 2>$null
        Write-Success "Demo data seeded"
    }
}
else {
    Write-Warning "Step 11: Data seeding skipped (--SkipSeed)"
}

# Step 12: Collect static files
Write-Step "Step 12: Collecting Static Files"

docker-compose run --rm backend python manage.py collectstatic --noinput
Write-Success "Static files collected"

# Step 13: Start all services
Write-Step "Step 13: Starting All Services"

docker-compose up -d
Write-Success "All services started"

# Final status
Write-Step "Deployment Complete!"

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║           NucleiQ Deployment Successful!                     ║
╚══════════════════════════════════════════════════════════════╝

Services are now running:

  Backend API:     http://localhost:8000
  Frontend:        http://localhost:5173
  PgAdmin:         http://localhost:8080
  
  API Documentation: http://localhost:8000/api/docs/

Default PgAdmin credentials:
  Email: admin@example.com
  Password: admin

To view logs:
  docker-compose logs -f backend
  docker-compose logs -f frontend

To stop services:
  docker-compose down

"@ -ForegroundColor Green

# Show container status
Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose ps
