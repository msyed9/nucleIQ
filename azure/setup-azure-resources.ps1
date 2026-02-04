# ============================================================================
# Azure Resources Setup Script for nucleIQ
# ============================================================================
# Run this script to create all required Azure resources for nucleIQ deployment
# Prerequisites: Azure CLI installed and logged in (az login)
# ============================================================================

param(
    [string]$ResourceGroup = "nucleiq-rg",
    [string]$Location = "eastus",
    [string]$AcrName = "nucleiqacr",
    [string]$DbServerName = "nucleiq-db-server",
    [string]$DbName = "nucleiq",
    [string]$DbAdminUser = "nucleiqadmin",
    [string]$DbAdminPassword = "",  # Will prompt if empty
    [string]$RedisName = "nucleiq-redis",
    [string]$StorageAccountName = "nucleiqstorage",
    [string]$ContainerEnvName = "nucleiq-env"
)

# Colors for output
function Write-Step { param($Message) Write-Host "`n➡️  $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# ============================================================================
# Check Prerequisites
# ============================================================================
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  nucleIQ Azure Setup Script" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta

Write-Step "Checking prerequisites..."

# Check Azure CLI
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it first."
    Write-Host "Run: winget install Microsoft.AzureCLI"
    exit 1
}

# Check if logged in
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warning "Not logged in to Azure. Running 'az login'..."
    az login
}

Write-Success "Azure CLI is ready. Subscription: $($account.name)"

# Prompt for database password if not provided
if ([string]::IsNullOrEmpty($DbAdminPassword)) {
    $securePassword = Read-Host "Enter PostgreSQL admin password (min 8 chars, uppercase, lowercase, number)" -AsSecureString
    $DbAdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
}

# ============================================================================
# Step 1: Create Resource Group
# ============================================================================
Write-Step "Creating Resource Group: $ResourceGroup..."

az group create --name $ResourceGroup --location $Location --output none
Write-Success "Resource Group created"

# ============================================================================
# Step 2: Create Azure Container Registry
# ============================================================================
Write-Step "Creating Azure Container Registry: $AcrName..."

az acr create `
    --resource-group $ResourceGroup `
    --name $AcrName `
    --sku Basic `
    --admin-enabled true `
    --output none

$acrCredentials = az acr credential show --name $AcrName | ConvertFrom-Json
$acrLoginServer = az acr show --name $AcrName --query loginServer -o tsv

Write-Success "ACR created: $acrLoginServer"
Write-Host "   Username: $($acrCredentials.username)" -ForegroundColor Gray
Write-Host "   Password: $($acrCredentials.passwords[0].value)" -ForegroundColor Gray

# ============================================================================
# Step 3: Create PostgreSQL Flexible Server
# ============================================================================
Write-Step "Creating PostgreSQL Flexible Server: $DbServerName..."
Write-Warning "This may take 5-10 minutes..."

az postgres flexible-server create `
    --resource-group $ResourceGroup `
    --name $DbServerName `
    --location $Location `
    --admin-user $DbAdminUser `
    --admin-password $DbAdminPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 16 `
    --yes `
    --output none

# Create database
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $DbServerName `
    --database-name $DbName `
    --output none

# Configure firewall to allow Azure services
az postgres flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $DbServerName `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    --output none

$dbHost = "$DbServerName.postgres.database.azure.com"
$databaseUrl = "postgresql://${DbAdminUser}:${DbAdminPassword}@${dbHost}:5432/${DbName}?sslmode=require"

Write-Success "PostgreSQL created: $dbHost"

# ============================================================================
# Step 4: Create Azure Cache for Redis
# ============================================================================
Write-Step "Creating Azure Cache for Redis: $RedisName..."
Write-Warning "This may take 10-20 minutes..."

az redis create `
    --resource-group $ResourceGroup `
    --name $RedisName `
    --location $Location `
    --sku Basic `
    --vm-size c0 `
    --redis-version 6 `
    --output none

$redisHost = az redis show --resource-group $ResourceGroup --name $RedisName --query hostName -o tsv
$redisKey = (az redis list-keys --resource-group $ResourceGroup --name $RedisName | ConvertFrom-Json).primaryKey
$redisUrl = "rediss://:${redisKey}@${redisHost}:6380/0"

Write-Success "Redis created: $redisHost"

# ============================================================================
# Step 5: Create Storage Account
# ============================================================================
Write-Step "Creating Storage Account: $StorageAccountName..."

az storage account create `
    --resource-group $ResourceGroup `
    --name $StorageAccountName `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --output none

# Create containers
$storageConnStr = (az storage account show-connection-string --resource-group $ResourceGroup --name $StorageAccountName | ConvertFrom-Json).connectionString

az storage container create `
    --account-name $StorageAccountName `
    --name media `
    --public-access blob `
    --output none

az storage container create `
    --account-name $StorageAccountName `
    --name static `
    --public-access blob `
    --output none

$storageKey = (az storage account keys list --resource-group $ResourceGroup --account-name $StorageAccountName | ConvertFrom-Json)[0].value

Write-Success "Storage Account created: $StorageAccountName"

# ============================================================================
# Step 6: Create Container Apps Environment
# ============================================================================
Write-Step "Creating Container Apps Environment: $ContainerEnvName..."

az containerapp env create `
    --resource-group $ResourceGroup `
    --name $ContainerEnvName `
    --location $Location `
    --output none

Write-Success "Container Apps Environment created"

# ============================================================================
# Step 7: Generate GitHub Secrets
# ============================================================================
Write-Step "Generating GitHub Actions secrets..."

# Generate Django secret key
$secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})

# Create Azure service principal for GitHub Actions
Write-Host "   Creating Service Principal for GitHub Actions..." -ForegroundColor Gray
$subscriptionId = (az account show | ConvertFrom-Json).id

$spCredentials = az ad sp create-for-rbac `
    --name "nucleiq-github-actions" `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup" `
    --sdk-auth | ConvertFrom-Json

# ============================================================================
# Output Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 Azure Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`n📋 GitHub Repository Secrets to Configure:" -ForegroundColor Yellow
Write-Host "   Go to: GitHub Repo > Settings > Secrets and variables > Actions" -ForegroundColor Gray

$secrets = @{
    "AZURE_CREDENTIALS" = ($spCredentials | ConvertTo-Json -Compress)
    "ACR_LOGIN_SERVER" = $acrLoginServer
    "ACR_USERNAME" = $acrCredentials.username
    "ACR_PASSWORD" = $acrCredentials.passwords[0].value
    "DATABASE_URL" = $databaseUrl
    "REDIS_URL" = $redisUrl
    "SECRET_KEY" = $secretKey
    "ALLOWED_HOSTS" = "*.azurecontainerapps.io,nucleiq.io"
    "CORS_ALLOWED_ORIGINS" = "https://*.azurecontainerapps.io"
    "AZURE_STORAGE_ACCOUNT_NAME" = $StorageAccountName
    "AZURE_STORAGE_ACCOUNT_KEY" = $storageKey
    "VITE_API_URL" = "https://nucleiq-backend.<region>.azurecontainerapps.io/api"
    "VITE_WS_URL" = "wss://nucleiq-backend.<region>.azurecontainerapps.io/ws"
}

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "`n   $($secret.Key):" -ForegroundColor Cyan
    Write-Host "   $($secret.Value)" -ForegroundColor White
}

# Save to file for reference
$outputFile = "azure-secrets-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$secrets | ConvertTo-Json | Out-File $outputFile
Write-Host "`n💾 Secrets saved to: $outputFile" -ForegroundColor Yellow
Write-Warning "Delete this file after configuring GitHub secrets!"

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Configure the above secrets in GitHub" -ForegroundColor Gray
Write-Host "   2. Push your code to trigger the deployment workflow" -ForegroundColor Gray
Write-Host "   3. Monitor the deployment in GitHub Actions" -ForegroundColor Gray
