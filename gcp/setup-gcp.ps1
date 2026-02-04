# ============================================================================
# Google Cloud Platform Setup Script for nucleIQ
# Optimized for cost savings with Cloud Run (scale to zero)
# Estimated Cost: $0-15/month (or FREE with $300 credits!)
# ============================================================================

param(
    [string]$ProjectName = "nucleiq-app",
    [string]$Region = "us-central1",
    [string]$ProjectId = "",        # Reuse an existing project or specify a custom ID
    [switch]$UseCloudSQL = $false,  # Add managed PostgreSQL (adds ~$10/month)
    [switch]$UseCloudStorage = $false  # Add GCS bucket for media (adds ~$1/month)
)

function Write-Step { param($Message) Write-Host "`n➡️  $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Yellow }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  nucleIQ - Google Cloud Setup" -ForegroundColor Magenta
Write-Host "  Scale to Zero = Pay Only When Used!" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta

# ============================================================================
# Prerequisites Check
# ============================================================================
Write-Step "Checking prerequisites..."

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Warning "Google Cloud SDK not installed!"
    Write-Host "Install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Gray
    Write-Host "Or run: winget install Google.CloudSDK" -ForegroundColor Gray
    exit 1
}

# Check if logged in
$account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $account) {
    Write-Info "Not logged in. Running 'gcloud auth login'..."
    gcloud auth login
}

Write-Success "Logged in as: $account"

# ============================================================================
# Step 1: Create or Select Project
# ============================================================================
Write-Step "Setting up GCP Project..."

# If ProjectId not provided, generate one
if (-not $ProjectId) {
    $ProjectId = "$ProjectName-$(Get-Random -Maximum 9999)"
    Write-Info "Generated unique Project ID: $ProjectId"
}

# Check if billing is enabled
$billingAccount = gcloud billing accounts list --format="value(name)" 2>$null | Select-Object -First 1

if (-not $billingAccount) {
    Write-Warning "No billing account found!"
    Write-Host "Please set up billing at: https://console.cloud.google.com/billing" -ForegroundColor Gray
    Write-Host "Free tier: `$300 credits for new accounts!" -ForegroundColor Green
    exit 1
}

# Check if project exists
$projectExists = gcloud projects list --filter="projectId:$ProjectId" --format="value(projectId)"

if (-not $projectExists) {
    Write-Info "Creating project: $ProjectId"
    gcloud projects create $ProjectId --name=$ProjectName
    
    # Link billing
    gcloud billing projects link $ProjectId --billing-account=$billingAccount
} else {
    Write-Info "Using existing project: $ProjectId"
}

# Set as default
gcloud config set project $ProjectId

Write-Success "Project ready: $ProjectId"

# ============================================================================
# Step 2: Enable Required APIs
# ============================================================================
Write-Step "Enabling required APIs..."

$apis = @(
    "run.googleapis.com",           # Cloud Run
    "artifactregistry.googleapis.com",  # Container Registry
    "cloudbuild.googleapis.com"     # Cloud Build
)

if ($UseCloudSQL) {
    $apis += "sqladmin.googleapis.com"
}

if ($UseCloudStorage) {
    $apis += "storage.googleapis.com"
}

# COMBINE INTO ONE CALL TO AVOID RATE LIMITS (Error 429)
Write-Info "Enabling APIs: $($apis -join ', ') (this may take a minute)..."
gcloud services enable $apis --quiet

Write-Success "APIs enabled"

# ============================================================================
# Step 3: Create Artifact Registry Repository
# ============================================================================
Write-Step "Creating Artifact Registry repository..."

# Check if repository exists
$repoExists = gcloud artifacts repositories list --location=$Region --filter="name:projects/$ProjectId/locations/$Region/repositories/nucleiq" --format="value(name)"

if (-not $repoExists) {
    gcloud artifacts repositories create nucleiq `
        --repository-format=docker `
        --location=$Region `
        --description="nucleIQ Docker images" `
        --quiet
} else {
    Write-Info "Artifact Registry repository already exists."
}

$registryUrl = "$Region-docker.pkg.dev/$ProjectId/nucleiq"
Write-Success "Registry created: $registryUrl"

# ============================================================================
# Step 4: Create Service Account for GitHub Actions
# ============================================================================
Write-Step "Creating Service Account for CI/CD..."

$saName = "github-actions"
$saEmail = "$saName@$ProjectId.iam.gserviceaccount.com"

# Check if SA exists
$saExists = gcloud iam service-accounts list --filter="email:$saEmail" --format="value(email)"

if (-not $saExists) {
    gcloud iam service-accounts create $saName `
        --display-name="GitHub Actions" `
        --quiet
} else {
    Write-Info "Service Account $saName already exists."
}

# Grant roles
$roles = @(
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountUser"
)

foreach ($role in $roles) {
    gcloud projects add-iam-policy-binding $ProjectId `
        --member="serviceAccount:$saEmail" `
        --role=$role `
        --quiet 2>$null
}

# Create key (we'll always create a new key or the user can use the existing one if they saved it)
# Note: creating many keys might also hit limits, but usually less frequent.
$keyFile = "gcp-sa-key-$(Get-Date -Format 'yyyyMMdd_HHmm').json"
Write-Info "Creating new Service Account key: $keyFile"
gcloud iam service-accounts keys create $keyFile `
    --iam-account=$saEmail `
    --quiet

Write-Success "Service Account created"

# ============================================================================
# Step 5: Optional - Cloud SQL PostgreSQL
# ============================================================================
$databaseUrl = ""

if ($UseCloudSQL) {
    Write-Step "Creating Cloud SQL PostgreSQL instance..."
    Write-Info "This adds ~`$10/month but provides persistent database"
    
    $instanceName = "nucleiq-db"
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 20 | ForEach-Object {[char]$_})
    
    gcloud sql instances create $instanceName `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$Region `
        --root-password=$dbPassword `
        --quiet 2>$null
    
    gcloud sql databases create nucleiq --instance=$instanceName --quiet 2>$null
    
    $connectionName = gcloud sql instances describe $instanceName --format="value(connectionName)"
    $databaseUrl = "postgresql://postgres:${dbPassword}@/nucleiq?host=/cloudsql/${connectionName}"
    
    Write-Success "Cloud SQL created"
}

# ============================================================================
# Step 6: Optional - Cloud Storage Bucket
# ============================================================================
$bucketName = ""

if ($UseCloudStorage) {
    Write-Step "Creating Cloud Storage bucket..."
    
    $bucketName = "nucleiq-media-$(Get-Random -Maximum 9999)"
    
    gcloud storage buckets create gs://$bucketName `
        --location=$Region `
        --uniform-bucket-level-access `
        --quiet 2>$null
    
    # Make public
    gcloud storage buckets add-iam-policy-binding gs://$bucketName `
        --member=allUsers `
        --role=roles/storage.objectViewer `
        --quiet 2>$null
    
    Write-Success "Bucket created: $bucketName"
}

# ============================================================================
# Step 7: Generate Secret Key
# ============================================================================
$secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})

# ============================================================================
# Output Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 GCP Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`n💰 Estimated Monthly Cost:" -ForegroundColor Yellow
Write-Host "   Cloud Run (scale to zero): `$0-15" -ForegroundColor Gray
Write-Host "   Artifact Registry:         ~`$0.10/GB" -ForegroundColor Gray
if ($UseCloudSQL) {
    Write-Host "   Cloud SQL (micro):         ~`$10" -ForegroundColor Gray
}
if ($UseCloudStorage) {
    Write-Host "   Cloud Storage:             ~`$1" -ForegroundColor Gray
}
Write-Host "   ─────────────────────────" -ForegroundColor Gray
$totalMin = 0
$totalMax = 15
if ($UseCloudSQL) { $totalMax += 10 }
if ($UseCloudStorage) { $totalMax += 1 }
Write-Host "   Total: ~`$$totalMin-$totalMax/month" -ForegroundColor White
Write-Host "   (FREE with `$300 credits!)" -ForegroundColor Green

Write-Host "`n📋 Add these secrets to GitHub:" -ForegroundColor Yellow
Write-Host "   (Repo > Settings > Secrets and variables > Actions)" -ForegroundColor Gray

$secrets = @{
    "GCP_PROJECT_ID" = $ProjectId
    "GCP_SA_KEY" = "(content of $keyFile)"
    "SECRET_KEY" = $secretKey
}

if ($databaseUrl) {
    $secrets["DATABASE_URL"] = $databaseUrl
}

if ($bucketName) {
    $secrets["GCS_BUCKET_NAME"] = $bucketName
}

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "`n   $($secret.Key):" -ForegroundColor Cyan
    Write-Host "   $($secret.Value)" -ForegroundColor White
}

Write-Host "`n💾 Service Account key saved to: $keyFile" -ForegroundColor Yellow
Write-Host "⚠️  Add the CONTENT of this file as GCP_SA_KEY secret" -ForegroundColor Red

Write-Host "`n🚀 Deploy Commands:" -ForegroundColor Yellow
Write-Host "   # Build and push image:" -ForegroundColor Gray
Write-Host "   docker build -f Dockerfile.cloudrun -t $registryUrl/nucleiq-app:latest ." -ForegroundColor White
Write-Host "   docker push $registryUrl/nucleiq-app:latest" -ForegroundColor White
Write-Host ""
Write-Host "   # Deploy to Cloud Run:" -ForegroundColor Gray
Write-Host "   gcloud run deploy nucleiq --image $registryUrl/nucleiq-app:latest --region $Region" -ForegroundColor White
