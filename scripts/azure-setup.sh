#!/bin/bash
# =============================================================================
# NucleiQ Azure Infrastructure Setup Script
# Creates all required Azure resources for production deployment
# 
# Prerequisites:
# - Azure CLI installed and logged in (az login)
# - Sufficient permissions to create resources
# 
# Usage: ./scripts/azure-setup.sh
# =============================================================================

set -e  # Exit on error

# =============================================================================
# CONFIGURATION
# =============================================================================
RESOURCE_GROUP="nucleiq-production-rg"
LOCATION="centralindia"
ACR_NAME="nucleiqacr"
POSTGRES_SERVER="nucleiq-db-server"
REDIS_NAME="nucleiq-redis"
STORAGE_ACCOUNT="nucleiqstorage"
CONTAINER_ENV="nucleiq-production"
KEYVAULT_NAME="nucleiq-keyvault"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
echo_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# STEP 1: Create Resource Group
# =============================================================================
echo_info "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=Production Project=NucleiQ

echo_success "Resource Group created!"

# =============================================================================
# STEP 2: Create Azure Container Registry
# =============================================================================
echo_info "Creating Azure Container Registry: $ACR_NAME..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true \
  --location $LOCATION

echo_success "Container Registry created!"

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
echo_info "ACR Username: $ACR_USERNAME"
echo_warning "Save the ACR password securely - it will be needed for GitHub Secrets"

# =============================================================================
# STEP 3: Create Azure Key Vault
# =============================================================================
echo_info "Creating Azure Key Vault: $KEYVAULT_NAME..."
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-soft-delete true \
  --retention-days 7

echo_success "Key Vault created!"

# =============================================================================
# STEP 4: Create Azure Database for PostgreSQL Flexible Server
# =============================================================================
echo_info "Creating PostgreSQL Flexible Server: $POSTGRES_SERVER..."
echo_warning "This may take 5-10 minutes..."

# Generate a strong password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user nucleiq_admin \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --high-availability Disabled \
  --public-access 0.0.0.0 \
  --yes

# Store password in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "db-password" \
  --value "$DB_PASSWORD"

echo_success "PostgreSQL server created!"
echo_warning "Database password stored in Key Vault"

# Create the database
echo_info "Creating database: nucleiq..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name nucleiq

# Allow Azure services to connect
echo_info "Configuring firewall rules..."
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name allow-azure-services \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo_success "Database and firewall configured!"

# =============================================================================
# STEP 5: Create Azure Cache for Redis
# =============================================================================
echo_info "Creating Azure Cache for Redis: $REDIS_NAME..."
echo_warning "This may take 10-15 minutes..."

az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Basic \
  --vm-size C0 \
  --enable-non-ssl-port

echo_success "Redis cache created!"

# Get Redis connection string
REDIS_HOST=$(az redis show --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query "hostName" -o tsv)
REDIS_KEY=$(az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query "primaryKey" -o tsv)
REDIS_URL="redis://:${REDIS_KEY}@${REDIS_HOST}:6379/0"

# Store Redis URL in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "redis-url" \
  --value "$REDIS_URL"

echo_success "Redis connection stored in Key Vault!"

# =============================================================================
# STEP 6: Create Azure Blob Storage
# =============================================================================
echo_info "Creating Storage Account: $STORAGE_ACCOUNT..."
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_ACCOUNT \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# Create containers
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --query "[0].value" -o tsv)

az storage container create \
  --account-name $STORAGE_ACCOUNT \
  --account-key "$STORAGE_KEY" \
  --name media \
  --public-access blob

az storage container create \
  --account-name $STORAGE_ACCOUNT \
  --account-key "$STORAGE_KEY" \
  --name static \
  --public-access blob

az storage container create \
  --account-name $STORAGE_ACCOUNT \
  --account-key "$STORAGE_KEY" \
  --name backups \
  --public-access off

echo_success "Storage account and containers created!"

# =============================================================================
# STEP 7: Create Container Apps Environment
# =============================================================================
echo_info "Creating Container Apps Environment: $CONTAINER_ENV..."

az containerapp env create \
  --name $CONTAINER_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo_success "Container Apps Environment created!"

# =============================================================================
# STEP 8: Generate Django Secret Key
# =============================================================================
DJANGO_SECRET_KEY=$(openssl rand -base64 48 | tr -d '/+=' | cut -c1-50)
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "django-secret-key" \
  --value "$DJANGO_SECRET_KEY"

echo_success "Django secret key generated and stored!"

# =============================================================================
# STEP 9: Create Service Principal for GitHub Actions
# =============================================================================
echo_info "Creating Service Principal for GitHub Actions..."
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "nucleiq-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth)

# Store in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "github-sp-credentials" \
  --value "$SP_OUTPUT"

echo_success "Service Principal created and stored in Key Vault!"

# =============================================================================
# OUTPUT SUMMARY
# =============================================================================
echo ""
echo "=============================================="
echo -e "${GREEN}INFRASTRUCTURE SETUP COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "📋 GITHUB SECRETS TO CONFIGURE:"
echo "================================"
echo ""
echo "1. AZURE_CREDENTIALS:"
az keyvault secret show --vault-name $KEYVAULT_NAME --name "github-sp-credentials" --query "value" -o tsv
echo ""
echo "2. ACR_USERNAME: $ACR_USERNAME"
echo "3. ACR_PASSWORD: $ACR_PASSWORD"
echo ""
echo "📌 RESOURCES CREATED:"
echo "====================="
echo "• Resource Group: $RESOURCE_GROUP"
echo "• Container Registry: $ACR_NAME.azurecr.io"
echo "• PostgreSQL Server: $POSTGRES_SERVER.postgres.database.azure.com"
echo "• Redis Cache: $REDIS_HOST"
echo "• Storage Account: $STORAGE_ACCOUNT"
echo "• Container Apps Env: $CONTAINER_ENV"
echo "• Key Vault: $KEYVAULT_NAME"
echo ""
echo "📝 NEXT STEPS:"
echo "=============="
echo "1. Add the GitHub secrets listed above to your repository"
echo "2. Run: ./scripts/deploy-containers.sh"
echo "3. Configure DNS records in Hostinger"
echo ""
