#!/bin/bash
# =============================================================================
# NucleiQ Container Apps Deployment Script
# Deploys all container applications to Azure
# 
# Prerequisites:
# - Azure infrastructure created (run azure-setup.sh first)
# - Docker images built and pushed to ACR
# 
# Usage: ./scripts/deploy-containers.sh
# =============================================================================

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================
RESOURCE_GROUP="nucleiq-production-rg"
LOCATION="centralindia"
ACR_NAME="nucleiqacr"
REGISTRY_URL="nucleiqacr.azurecr.io"
CONTAINER_ENV="nucleiq-production"
KEYVAULT_NAME="nucleiq-keyvault"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
echo_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# GET CREDENTIALS
# =============================================================================
echo_info "Retrieving credentials..."

ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
DJANGO_SECRET=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name "django-secret-key" --query "value" -o tsv)
DB_PASSWORD=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name "db-password" --query "value" -o tsv)
REDIS_URL=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name "redis-url" --query "value" -o tsv)

POSTGRES_HOST="nucleiq-db-server.postgres.database.azure.com"

# =============================================================================
# BUILD AND PUSH IMAGES
# =============================================================================
echo_info "Building and pushing Docker images..."

# Login to ACR
az acr login --name $ACR_NAME

# Build backend
echo_info "Building backend image..."
docker build --target production \
  -t $REGISTRY_URL/nucleiq-backend:latest \
  -t $REGISTRY_URL/nucleiq-backend:v1 \
  ../backend

docker push $REGISTRY_URL/nucleiq-backend:latest
docker push $REGISTRY_URL/nucleiq-backend:v1

# Build frontend
echo_info "Building frontend image..."
docker build --target production \
  --build-arg VITE_API_URL=https://api.nucleiq.io/api \
  --build-arg VITE_WS_URL=wss://api.nucleiq.io/ws \
  -t $REGISTRY_URL/nucleiq-frontend:latest \
  -t $REGISTRY_URL/nucleiq-frontend:v1 \
  ../frontend

docker push $REGISTRY_URL/nucleiq-frontend:latest
docker push $REGISTRY_URL/nucleiq-frontend:v1

echo_success "Images built and pushed!"

# =============================================================================
# DEPLOY BACKEND CONTAINER APP
# =============================================================================
echo_info "Deploying Backend Container App..."

az containerapp create \
  --name nucleiq-backend \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image $REGISTRY_URL/nucleiq-backend:v1 \
  --registry-server $REGISTRY_URL \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY="$DJANGO_SECRET" \
    DB_HOST=$POSTGRES_HOST \
    DB_NAME=nucleiq \
    DB_USER=nucleiq_admin \
    DB_PASSWORD="$DB_PASSWORD" \
    DB_PORT=5432 \
    REDIS_URL="$REDIS_URL" \
    CELERY_BROKER_URL="$REDIS_URL" \
    ALLOWED_HOSTS="nucleiq-backend.*.azurecontainerapps.io,api.nucleiq.io" \
    CORS_ALLOWED_ORIGINS="https://nucleiq.io,https://www.nucleiq.io" \
    FRONTEND_URL="https://nucleiq.io" \
    DEBUG=False

echo_success "Backend deployed!"

# =============================================================================
# DEPLOY FRONTEND CONTAINER APP
# =============================================================================
echo_info "Deploying Frontend Container App..."

az containerapp create \
  --name nucleiq-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image $REGISTRY_URL/nucleiq-frontend:v1 \
  --registry-server $REGISTRY_URL \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 80 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.25 \
  --memory 0.5Gi

echo_success "Frontend deployed!"

# =============================================================================
# DEPLOY CELERY WORKER
# =============================================================================
echo_info "Deploying Celery Worker..."

az containerapp create \
  --name nucleiq-celery-worker \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image $REGISTRY_URL/nucleiq-backend:v1 \
  --registry-server $REGISTRY_URL \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1Gi \
  --command "celery" "-A" "config" "worker" "-l" "info" "--pool=solo" \
  --env-vars \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY="$DJANGO_SECRET" \
    DB_HOST=$POSTGRES_HOST \
    DB_NAME=nucleiq \
    DB_USER=nucleiq_admin \
    DB_PASSWORD="$DB_PASSWORD" \
    DB_PORT=5432 \
    REDIS_URL="$REDIS_URL" \
    CELERY_BROKER_URL="$REDIS_URL"

echo_success "Celery Worker deployed!"

# =============================================================================
# DEPLOY CELERY BEAT
# =============================================================================
echo_info "Deploying Celery Beat..."

az containerapp create \
  --name nucleiq-celery-beat \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image $REGISTRY_URL/nucleiq-backend:v1 \
  --registry-server $REGISTRY_URL \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --command "celery" "-A" "config" "beat" "-l" "info" "--scheduler" "django_celery_beat.schedulers:DatabaseScheduler" \
  --env-vars \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY="$DJANGO_SECRET" \
    DB_HOST=$POSTGRES_HOST \
    DB_NAME=nucleiq \
    DB_USER=nucleiq_admin \
    DB_PASSWORD="$DB_PASSWORD" \
    DB_PORT=5432 \
    REDIS_URL="$REDIS_URL" \
    CELERY_BROKER_URL="$REDIS_URL"

echo_success "Celery Beat deployed!"

# =============================================================================
# RUN DATABASE MIGRATIONS
# =============================================================================
echo_info "Running database migrations..."

az containerapp exec \
  --name nucleiq-backend \
  --resource-group $RESOURCE_GROUP \
  --command "python manage.py migrate --noinput"

echo_info "Collecting static files..."

az containerapp exec \
  --name nucleiq-backend \
  --resource-group $RESOURCE_GROUP \
  --command "python manage.py collectstatic --noinput"

echo_success "Migrations and static files complete!"

# =============================================================================
# GET APPLICATION URLs
# =============================================================================
BACKEND_FQDN=$(az containerapp show --name nucleiq-backend --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)
FRONTEND_FQDN=$(az containerapp show --name nucleiq-frontend --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "=============================================="
echo -e "${GREEN}CONTAINER APPS DEPLOYED!${NC}"
echo "=============================================="
echo ""
echo "📌 APPLICATION URLs (Azure):"
echo "============================="
echo "• Frontend: https://$FRONTEND_FQDN"
echo "• Backend API: https://$BACKEND_FQDN"
echo ""
echo "📝 NEXT STEPS - Configure Custom Domains:"
echo "==========================================="
echo ""
echo "1. Add custom domain to Frontend:"
echo "   az containerapp hostname add --name nucleiq-frontend --resource-group $RESOURCE_GROUP --hostname nucleiq.io"
echo "   az containerapp hostname add --name nucleiq-frontend --resource-group $RESOURCE_GROUP --hostname www.nucleiq.io"
echo ""
echo "2. Add custom domain to Backend:"
echo "   az containerapp hostname add --name nucleiq-backend --resource-group $RESOURCE_GROUP --hostname api.nucleiq.io"
echo ""
echo "3. Configure DNS in Hostinger (see setup-dns.md for details)"
echo ""
echo "4. Enable managed certificates:"
echo "   az containerapp hostname bind --name nucleiq-frontend --resource-group $RESOURCE_GROUP --hostname nucleiq.io --validation-method CNAME"
echo ""
