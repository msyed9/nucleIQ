# PowerShell version of Azure Infrastructure Setup
# For Windows users who prefer PowerShell over Bash
# =============================================================================
# NucleiQ Azure Infrastructure Setup Script (PowerShell)
# Creates all required Azure resources for production deployment
# 
# Prerequisites:
# - Azure CLI installed and logged in (az login)
# - Sufficient permissions to create resources
# 
# Usage: .\scripts\azure-setup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

# =============================================================================
# CONFIGURATION
# =============================================================================
$RESOURCE_GROUP = "nucleiq-production-rg"
$LOCATION = "centralindia"
$ACR_NAME = "nucleiqacr"
$POSTGRES_SERVER = "nucleiq-db-server"
$REDIS_NAME = "nucleiq-redis"
$STORAGE_ACCOUNT = "nucleiqstorage"
$CONTAINER_ENV = "nucleiq-production"
$KEYVAULT_NAME = "nucleiq-keyvault"

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host "`n=============================================="
Write-Host "NucleiQ Azure Infrastructure Setup"
Write-Host "==============================================`n"

# =============================================================================
# STEP 1: Create Resource Group
# =============================================================================
Write-Info "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create `
    --name $RESOURCE_GROUP `
    --location $LOCATION `
    --tags Environment=Production Project=NucleiQ

Write-Success "Resource Group created!"

# =============================================================================
# STEP 2: Create Azure Container Registry
# =============================================================================
Write-Info "Creating Azure Container Registry: $ACR_NAME..."
az acr create `
    --resource-group $RESOURCE_GROUP `
    --name $ACR_NAME `
    --sku Basic `
    --admin-enabled true `
    --location $LOCATION

Write-Success "Container Registry created!"

# Get ACR credentials
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query "username" -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv
Write-Info "ACR Username: $ACR_USERNAME"
Write-Warning "Save the ACR password securely - it will be needed for GitHub Secrets"

# =============================================================================
# STEP 3: Create Azure Key Vault
# =============================================================================
Write-Info "Creating Azure Key Vault: $KEYVAULT_NAME..."
az keyvault create `
    --name $KEYVAULT_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --enable-soft-delete true `
    --retention-days 7

Write-Success "Key Vault created!"

# =============================================================================
# STEP 4: Create Azure Database for PostgreSQL
# =============================================================================
Write-Info "Creating PostgreSQL Flexible Server: $POSTGRES_SERVER..."
Write-Warning "This may take 5-10 minutes..."

# Generate a strong password
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
$DB_PASSWORD = -join ((1..24) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

az postgres flexible-server create `
    --resource-group $RESOURCE_GROUP `
    --name $POSTGRES_SERVER `
    --location $LOCATION `
    --admin-user nucleiq_admin `
    --admin-password $DB_PASSWORD `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 16 `
    --high-availability Disabled `
    --public-access 0.0.0.0 `
    --yes

# Store password in Key Vault
az keyvault secret set `
    --vault-name $KEYVAULT_NAME `
    --name "db-password" `
    --value $DB_PASSWORD

Write-Success "PostgreSQL server created!"
Write-Warning "Database password stored in Key Vault"

# Create database
Write-Info "Creating database: nucleiq..."
az postgres flexible-server db create `
    --resource-group $RESOURCE_GROUP `
    --server-name $POSTGRES_SERVER `
    --database-name nucleiq

# Firewall rule
Write-Info "Configuring firewall rules..."
az postgres flexible-server firewall-rule create `
    --resource-group $RESOURCE_GROUP `
    --name $POSTGRES_SERVER `
    --rule-name allow-azure-services `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

Write-Success "Database configured!"

# =============================================================================
# STEP 5: Create Azure Cache for Redis
# =============================================================================
Write-Info "Creating Azure Cache for Redis: $REDIS_NAME..."
Write-Warning "This may take 10-15 minutes..."

az redis create `
    --resource-group $RESOURCE_GROUP `
    --name $REDIS_NAME `
    --location $LOCATION `
    --sku Basic `
    --vm-size C0 `
    --enable-non-ssl-port

Write-Success "Redis cache created!"

# Get Redis connection
$REDIS_HOST = az redis show --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query "hostName" -o tsv
$REDIS_KEY = az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query "primaryKey" -o tsv
$REDIS_URL = "redis://:${REDIS_KEY}@${REDIS_HOST}:6379/0"

# Store in Key Vault
az keyvault secret set `
    --vault-name $KEYVAULT_NAME `
    --name "redis-url" `
    --value $REDIS_URL

Write-Success "Redis connection stored in Key Vault!"

# =============================================================================
# STEP 6: Create Storage Account
# =============================================================================
Write-Info "Creating Storage Account: $STORAGE_ACCOUNT..."
az storage account create `
    --resource-group $RESOURCE_GROUP `
    --name $STORAGE_ACCOUNT `
    --location $LOCATION `
    --sku Standard_LRS `
    --kind StorageV2 `
    --access-tier Hot

# Get storage key
$STORAGE_KEY = az storage account keys list --account-name $STORAGE_ACCOUNT --query "[0].value" -o tsv

# Create containers
az storage container create `
    --account-name $STORAGE_ACCOUNT `
    --account-key $STORAGE_KEY `
    --name media `
    --public-access blob

az storage container create `
    --account-name $STORAGE_ACCOUNT `
    --account-key $STORAGE_KEY `
    --name static `
    --public-access blob

az storage container create `
    --account-name $STORAGE_ACCOUNT `
    --account-key $STORAGE_KEY `
    --name backups `
    --public-access off

Write-Success "Storage account created!"

# =============================================================================
# STEP 7: Create Container Apps Environment
# =============================================================================
Write-Info "Creating Container Apps Environment: $CONTAINER_ENV..."

az containerapp env create `
    --name $CONTAINER_ENV `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION

Write-Success "Container Apps Environment created!"

# =============================================================================
# STEP 8: Generate Django Secret Key
# =============================================================================
$DJANGO_SECRET_KEY = -join ((1..50) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
az keyvault secret set `
    --vault-name $KEYVAULT_NAME `
    --name "django-secret-key" `
    --value $DJANGO_SECRET_KEY

Write-Success "Django secret key generated!"

# =============================================================================
# STEP 9: Create Service Principal for GitHub Actions
# =============================================================================
Write-Info "Creating Service Principal for GitHub Actions..."
$SUBSCRIPTION_ID = az account show --query id -o tsv

$SP_OUTPUT = az ad sp create-for-rbac `
    --name "nucleiq-github-actions" `
    --role contributor `
    --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP `
    --sdk-auth

az keyvault secret set `
    --vault-name $KEYVAULT_NAME `
    --name "github-sp-credentials" `
    --value $SP_OUTPUT

Write-Success "Service Principal created!"

# =============================================================================
# OUTPUT SUMMARY
# =============================================================================
Write-Host "`n=============================================="
Write-Host "INFRASTRUCTURE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==============================================`n"

Write-Host "GITHUB SECRETS TO CONFIGURE:" -ForegroundColor Cyan
Write-Host "================================`n"

Write-Host "1. AZURE_CREDENTIALS:" -ForegroundColor Yellow
az keyvault secret show --vault-name $KEYVAULT_NAME --name "github-sp-credentials" --query "value" -o tsv
Write-Host ""

Write-Host "2. ACR_USERNAME: $ACR_USERNAME" -ForegroundColor Yellow
Write-Host "3. ACR_PASSWORD: $ACR_PASSWORD" -ForegroundColor Yellow
Write-Host ""

Write-Host "RESOURCES CREATED:" -ForegroundColor Cyan
Write-Host "==================="
Write-Host "- Resource Group: $RESOURCE_GROUP"
Write-Host "- Container Registry: $ACR_NAME.azurecr.io"
Write-Host "- PostgreSQL Server: $POSTGRES_SERVER.postgres.database.azure.com"
Write-Host "- Redis Cache: $REDIS_HOST"
Write-Host "- Storage Account: $STORAGE_ACCOUNT"
Write-Host "- Container Apps Env: $CONTAINER_ENV"
Write-Host "- Key Vault: $KEYVAULT_NAME"
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "============"
Write-Host "1. Add the GitHub secrets listed above to your repository"
Write-Host "2. Run: .\scripts\deploy-containers.ps1"
Write-Host "3. Configure DNS records in Hostinger"
Write-Host ""
