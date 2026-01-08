# PowerShell Container Deployment Script
# =============================================================================
# NucleIQ Container Apps Deployment Script (PowerShell)
# Deploys all container applications to Azure
# 
# Prerequisites:
# - Azure infrastructure created (run azure-setup.ps1 first)
# - Docker Desktop running
# 
# Usage: .\scripts\deploy-containers.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

# =============================================================================
# CONFIGURATION
# =============================================================================
$RESOURCE_GROUP = "nucleiq-production-rg"
$LOCATION = "centralindia"
$ACR_NAME = "nucleiqacr"
$REGISTRY_URL = "nucleiqacr.azurecr.io"
$CONTAINER_ENV = "nucleiq-production"
$KEYVAULT_NAME = "nucleiq-keyvault"

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

Write-Host "`n=============================================="
Write-Host "NucleIQ Container Deployment"
Write-Host "==============================================`n"

# =============================================================================
# GET CREDENTIALS
# =============================================================================
Write-Info "Retrieving credentials from Key Vault..."

$ACR_USERNAME = az acr credential show --name $ACR_NAME --query "username" -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv
$DJANGO_SECRET = az keyvault secret show --vault-name $KEYVAULT_NAME --name "django-secret-key" --query "value" -o tsv
$DB_PASSWORD = az keyvault secret show --vault-name $KEYVAULT_NAME --name "db-password" --query "value" -o tsv
$REDIS_URL = az keyvault secret show --vault-name $KEYVAULT_NAME --name "redis-url" --query "value" -o tsv

$POSTGRES_HOST = "nucleiq-db-server.postgres.database.azure.com"

Write-Success "Credentials retrieved!"

# =============================================================================
# BUILD AND PUSH IMAGES
# =============================================================================
Write-Info "Building and pushing Docker images..."

# Login to ACR
az acr login --name $ACR_NAME

# Build backend
Write-Info "Building backend image..."
docker build --target production `
    -t "$REGISTRY_URL/nucleiq-backend:latest" `
    -t "$REGISTRY_URL/nucleiq-backend:v1" `
    .\backend

docker push "$REGISTRY_URL/nucleiq-backend:latest"
docker push "$REGISTRY_URL/nucleiq-backend:v1"

# Build frontend
Write-Info "Building frontend image..."
docker build --target production `
    --build-arg VITE_API_URL=https://api.nucleiq.io/api `
    --build-arg VITE_WS_URL=wss://api.nucleiq.io/ws `
    -t "$REGISTRY_URL/nucleiq-frontend:latest" `
    -t "$REGISTRY_URL/nucleiq-frontend:v1" `
    .\frontend

docker push "$REGISTRY_URL/nucleiq-frontend:latest"
docker push "$REGISTRY_URL/nucleiq-frontend:v1"

Write-Success "Images built and pushed!"

# =============================================================================
# DEPLOY BACKEND
# =============================================================================
Write-Info "Deploying Backend Container App..."

az containerapp create `
    --name nucleiq-backend `
    --resource-group $RESOURCE_GROUP `
    --environment $CONTAINER_ENV `
    --image "$REGISTRY_URL/nucleiq-backend:v1" `
    --registry-server $REGISTRY_URL `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --target-port 8000 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 10 `
    --cpu 0.5 `
    --memory 1Gi `
    --env-vars `
        DJANGO_SETTINGS_MODULE=config.settings.prod `
        SECRET_KEY="$DJANGO_SECRET" `
        DB_HOST=$POSTGRES_HOST `
        DB_NAME=nucleiq `
        DB_USER=nucleiq_admin `
        DB_PASSWORD="$DB_PASSWORD" `
        DB_PORT=5432 `
        REDIS_URL="$REDIS_URL" `
        CELERY_BROKER_URL="$REDIS_URL" `
        ALLOWED_HOSTS="nucleiq-backend.*.azurecontainerapps.io,api.nucleiq.io" `
        CORS_ALLOWED_ORIGINS="https://nucleiq.io,https://www.nucleiq.io" `
        FRONTEND_URL="https://nucleiq.io" `
        DEBUG=False

Write-Success "Backend deployed!"

# =============================================================================
# DEPLOY FRONTEND
# =============================================================================
Write-Info "Deploying Frontend Container App..."

az containerapp create `
    --name nucleiq-frontend `
    --resource-group $RESOURCE_GROUP `
    --environment $CONTAINER_ENV `
    --image "$REGISTRY_URL/nucleiq-frontend:v1" `
    --registry-server $REGISTRY_URL `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --target-port 80 `
    --ingress external `
    --min-replicas 0 `
    --max-replicas 10 `
    --cpu 0.25 `
    --memory 0.5Gi

Write-Success "Frontend deployed!"

# =============================================================================
# DEPLOY CELERY WORKER
# =============================================================================
Write-Info "Deploying Celery Worker..."

az containerapp create `
    --name nucleiq-celery-worker `
    --resource-group $RESOURCE_GROUP `
    --environment $CONTAINER_ENV `
    --image "$REGISTRY_URL/nucleiq-backend:v1" `
    --registry-server $REGISTRY_URL `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --min-replicas 1 `
    --max-replicas 5 `
    --cpu 0.5 `
    --memory 1Gi `
    --command "celery" "-A" "config" "worker" "-l" "info" "--pool=solo" `
    --env-vars `
        DJANGO_SETTINGS_MODULE=config.settings.prod `
        SECRET_KEY="$DJANGO_SECRET" `
        DB_HOST=$POSTGRES_HOST `
        DB_NAME=nucleiq `
        DB_USER=nucleiq_admin `
        DB_PASSWORD="$DB_PASSWORD" `
        DB_PORT=5432 `
        REDIS_URL="$REDIS_URL" `
        CELERY_BROKER_URL="$REDIS_URL"

Write-Success "Celery Worker deployed!"

# =============================================================================
# DEPLOY CELERY BEAT
# =============================================================================
Write-Info "Deploying Celery Beat..."

az containerapp create `
    --name nucleiq-celery-beat `
    --resource-group $RESOURCE_GROUP `
    --environment $CONTAINER_ENV `
    --image "$REGISTRY_URL/nucleiq-backend:v1" `
    --registry-server $REGISTRY_URL `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --min-replicas 1 `
    --max-replicas 1 `
    --cpu 0.25 `
    --memory 0.5Gi `
    --command "celery" "-A" "config" "beat" "-l" "info" "--scheduler" "django_celery_beat.schedulers:DatabaseScheduler" `
    --env-vars `
        DJANGO_SETTINGS_MODULE=config.settings.prod `
        SECRET_KEY="$DJANGO_SECRET" `
        DB_HOST=$POSTGRES_HOST `
        DB_NAME=nucleiq `
        DB_USER=nucleiq_admin `
        DB_PASSWORD="$DB_PASSWORD" `
        DB_PORT=5432 `
        REDIS_URL="$REDIS_URL" `
        CELERY_BROKER_URL="$REDIS_URL"

Write-Success "Celery Beat deployed!"

# =============================================================================
# RUN MIGRATIONS
# =============================================================================
Write-Info "Running database migrations..."

az containerapp exec `
    --name nucleiq-backend `
    --resource-group $RESOURCE_GROUP `
    --command "python manage.py migrate --noinput"

Write-Info "Collecting static files..."

az containerapp exec `
    --name nucleiq-backend `
    --resource-group $RESOURCE_GROUP `
    --command "python manage.py collectstatic --noinput"

Write-Success "Migrations complete!"

# =============================================================================
# GET URLs
# =============================================================================
$BACKEND_FQDN = az containerapp show --name nucleiq-backend --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv
$FRONTEND_FQDN = az containerapp show --name nucleiq-frontend --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "`n=============================================="
Write-Host "CONTAINER APPS DEPLOYED!" -ForegroundColor Green
Write-Host "==============================================`n"

Write-Host "APPLICATION URLs (Azure):" -ForegroundColor Cyan
Write-Host "========================="
Write-Host "- Frontend: https://$FRONTEND_FQDN"
Write-Host "- Backend API: https://$BACKEND_FQDN"
Write-Host ""

Write-Host "NEXT STEPS - Custom Domains:" -ForegroundColor Cyan
Write-Host "============================="
Write-Host "Run the following commands to add custom domains:`n"

Write-Host "# Add frontend domains" -ForegroundColor Yellow
Write-Host "az containerapp hostname add --name nucleiq-frontend --resource-group $RESOURCE_GROUP --hostname nucleiq.io"
Write-Host "az containerapp hostname add --name nucleiq-frontend --resource-group $RESOURCE_GROUP --hostname www.nucleiq.io"
Write-Host ""

Write-Host "# Add backend domain" -ForegroundColor Yellow
Write-Host "az containerapp hostname add --name nucleiq-backend --resource-group $RESOURCE_GROUP --hostname api.nucleiq.io"
Write-Host ""

Write-Host "See HOSTINGER_DNS_SETUP.md for DNS configuration details.`n"
