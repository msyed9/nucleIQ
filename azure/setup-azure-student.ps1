# ============================================================================
# Azure Student Credits Setup Script
# Optimized for Azure for Students ($100 free credits)
# Creates minimal resources to maximize credit usage
# ============================================================================

param(
    [string]$ResourceGroup = "nucleiq-student-rg",
    [string]$Location = "eastus",
    [string]$AcrName = "nucleiqstudent",  # Must be globally unique
    [string]$DbServerName = "",  # Leave empty to skip managed DB
    [switch]$UseFreeTierDb = $false,  # Use Azure PostgreSQL Free tier
    [switch]$SkipDatabase = $true  # Skip database (use SQLite in container)
)

function Write-Step { param($Message) Write-Host "`n➡️  $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Yellow }

Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  nucleIQ Student Edition - Azure Setup" -ForegroundColor Magenta
Write-Host "  Optimized for Free Credits!" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta

# Check if logged in
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Step "Logging in to Azure..."
    az login
    $account = az account show | ConvertFrom-Json
}

Write-Success "Logged in as: $($account.user.name)"
Write-Info "Subscription: $($account.name)"

# Make ACR name unique
$AcrName = "$AcrName$(Get-Random -Maximum 9999)"

# ============================================================================
# Step 1: Create Resource Group
# ============================================================================
Write-Step "Creating Resource Group: $ResourceGroup..."

az group create --name $ResourceGroup --location $Location --output none
Write-Success "Resource Group created"

# ============================================================================
# Step 2: Create Azure Container Registry (Basic tier - ~$5/month)
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

# ============================================================================
# Step 3: Database Setup (Optional)
# ============================================================================
$databaseUrl = "sqlite:///db.sqlite3"

if ($UseFreeTierDb -and -not $SkipDatabase) {
    Write-Step "Creating Azure PostgreSQL Free Tier..."
    Write-Info "Note: Free tier has limitations - 32GB storage, 750 hours/month"
    
    if ([string]::IsNullOrEmpty($DbServerName)) {
        $DbServerName = "nucleiq-db-$(Get-Random -Maximum 9999)"
    }
    
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "!1"
    
    az postgres flexible-server create `
        --resource-group $ResourceGroup `
        --name $DbServerName `
        --location $Location `
        --admin-user nucleiqadmin `
        --admin-password $dbPassword `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 32 `
        --version 16 `
        --yes `
        --output none
    
    az postgres flexible-server db create `
        --resource-group $ResourceGroup `
        --server-name $DbServerName `
        --database-name nucleiq `
        --output none
    
    az postgres flexible-server firewall-rule create `
        --resource-group $ResourceGroup `
        --name $DbServerName `
        --rule-name AllowAzure `
        --start-ip-address 0.0.0.0 `
        --end-ip-address 0.0.0.0 `
        --output none
    
    $databaseUrl = "postgresql://nucleiqadmin:${dbPassword}@${DbServerName}.postgres.database.azure.com:5432/nucleiq?sslmode=require"
    Write-Success "PostgreSQL Free Tier created"
} else {
    Write-Info "Skipping managed database - will use SQLite in container (FREE!)"
    Write-Info "This is fine for demos and learning. For production, add PostgreSQL later."
}

# ============================================================================
# Step 4: Generate Django Secret Key
# ============================================================================
$secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})

# ============================================================================
# Step 5: Create Service Principal for GitHub Actions
# ============================================================================
Write-Step "Creating Service Principal for GitHub Actions..."

$subscriptionId = (az account show | ConvertFrom-Json).id
$spCredentials = az ad sp create-for-rbac `
    --name "nucleiq-student-github" `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup" `
    --sdk-auth | ConvertFrom-Json

Write-Success "Service Principal created"

# ============================================================================
# Output Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 Student Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`n💰 Estimated Monthly Cost:" -ForegroundColor Yellow
Write-Host "   ACR Basic tier: ~`$5" -ForegroundColor Gray
Write-Host "   Container Instance (1 vCPU, 2GB): ~`$15-25" -ForegroundColor Gray
if (-not $SkipDatabase) {
    Write-Host "   PostgreSQL Burstable: ~`$15-25" -ForegroundColor Gray
}
Write-Host "   ─────────────────────────" -ForegroundColor Gray
Write-Host "   Total: ~`$20-50/month" -ForegroundColor White
Write-Host "   (FREE with Azure Student `$100 credits!)" -ForegroundColor Green

Write-Host "`n📋 Add these secrets to GitHub:" -ForegroundColor Yellow
Write-Host "   (Repo > Settings > Secrets and variables > Actions)" -ForegroundColor Gray

$secrets = @{
    "AZURE_CREDENTIALS" = ($spCredentials | ConvertTo-Json -Compress)
    "ACR_LOGIN_SERVER" = $acrLoginServer
    "ACR_USERNAME" = $acrCredentials.username
    "ACR_PASSWORD" = $acrCredentials.passwords[0].value
    "DATABASE_URL" = $databaseUrl
    "SECRET_KEY" = $secretKey
}

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "`n   $($secret.Key):" -ForegroundColor Cyan
    if ($secret.Key -eq "AZURE_CREDENTIALS") {
        Write-Host "   (JSON - copy from file below)" -ForegroundColor Gray
    } else {
        Write-Host "   $($secret.Value)" -ForegroundColor White
    }
}

# Save to file
$outputFile = "student-secrets-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$secrets | ConvertTo-Json -Depth 10 | Out-File $outputFile
Write-Host "`n💾 Secrets saved to: $outputFile" -ForegroundColor Yellow
Write-Host "⚠️  Delete this file after adding secrets to GitHub!" -ForegroundColor Red

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Add the secrets to GitHub repository" -ForegroundColor Gray
Write-Host "   2. Push your code to trigger deployment" -ForegroundColor Gray
Write-Host "   3. Your app will be live in ~5 minutes!" -ForegroundColor Gray
