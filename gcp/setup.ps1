# ============================================================================
# NucleiQ — One-time GCP Infrastructure Setup
# Region: asia-south1 (Mumbai) — lowest latency for Indian schools
# Run this ONCE when setting up a new GCP project.
# ============================================================================
# Prerequisites:
#   1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
#   2. Run: gcloud auth login
#   3. Set your project: gcloud config set project YOUR_PROJECT_ID
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$Region = "asia-south1",
    [string]$DbPassword = "",
    [string]$SecretKey = ""
)

$ErrorActionPreference = "Stop"

# Auto-generate secrets if not provided
if (-not $DbPassword) {
    $DbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
}
if (-not $SecretKey) {
    $SecretKey = -join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45) | Get-Random -Count 50 | ForEach-Object {[char]$_})
}
$SchedulerSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "`n=== NucleiQ GCP Setup for project: $ProjectId ===" -ForegroundColor Cyan

# ── Enable required APIs ──────────────────────────────────────────────────────
Write-Host "`n[1/9] Enabling GCP APIs..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    sql-component.googleapis.com `
    sqladmin.googleapis.com `
    storage.googleapis.com `
    secretmanager.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    cloudscheduler.googleapis.com `
    --project=$ProjectId

# ── Artifact Registry ─────────────────────────────────────────────────────────
Write-Host "`n[2/9] Creating Artifact Registry repository..." -ForegroundColor Yellow
gcloud artifacts repositories create nucleiq `
    --repository-format=docker `
    --location=$Region `
    --description="NucleiQ container images" `
    --project=$ProjectId

# ── Service Account ───────────────────────────────────────────────────────────
Write-Host "`n[3/9] Creating service account..." -ForegroundColor Yellow
gcloud iam service-accounts create nucleiq-sa `
    --display-name="NucleiQ Cloud Run Service Account" `
    --project=$ProjectId

$SA = "nucleiq-sa@$ProjectId.iam.gserviceaccount.com"

# Grant necessary roles to the service account
foreach ($role in @(
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent"
)) {
    gcloud projects add-iam-policy-binding $ProjectId `
        --member="serviceAccount:$SA" `
        --role=$role
}

# ── Cloud SQL (PostgreSQL) ────────────────────────────────────────────────────
Write-Host "`n[4/9] Creating Cloud SQL PostgreSQL instance (asia-south1)..." -ForegroundColor Yellow
Write-Host "    This takes 5-10 minutes..." -ForegroundColor Gray
gcloud sql instances create nucleiq-db `
    --database-version=POSTGRES_16 `
    --tier=db-f1-micro `
    --region=$Region `
    --storage-type=SSD `
    --storage-size=20GB `
    --storage-auto-increase `
    --backup-start-time=02:00 `
    --maintenance-window-day=SUN `
    --maintenance-window-hour=3 `
    --deletion-protection `
    --project=$ProjectId

Write-Host "    Creating database and user..." -ForegroundColor Gray
gcloud sql databases create nucleiq --instance=nucleiq-db --project=$ProjectId
gcloud sql users create nucleiq_user `
    --instance=nucleiq-db `
    --password=$DbPassword `
    --project=$ProjectId

$DatabaseUrl = "postgresql://nucleiq_user:$DbPassword@/nucleiq?host=/cloudsql/$ProjectId`:$Region`:nucleiq-db"

# ── Cloud Storage (media bucket) ──────────────────────────────────────────────
Write-Host "`n[5/9] Creating Cloud Storage bucket for media files..." -ForegroundColor Yellow
$BucketName = "$ProjectId-nucleiq-media"
gcloud storage buckets create "gs://$BucketName" `
    --location=$Region `
    --uniform-bucket-level-access `
    --project=$ProjectId

# Allow public read for media (profile photos, ID cards etc.)
gcloud storage buckets add-iam-policy-binding "gs://$BucketName" `
    --member=allUsers `
    --role=roles/storage.objectViewer

# ── Secret Manager ────────────────────────────────────────────────────────────
Write-Host "`n[6/9] Storing secrets in Secret Manager..." -ForegroundColor Yellow

function New-GcpSecret($Name, $Value) {
    $tmpFile = [System.IO.Path]::GetTempFileName()
    $Value | Out-File -FilePath $tmpFile -Encoding ascii -NoNewline
    gcloud secrets create $Name --data-file=$tmpFile --project=$ProjectId 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Secret exists, add new version
        gcloud secrets versions add $Name --data-file=$tmpFile --project=$ProjectId
    }
    Remove-Item $tmpFile
    Write-Host "    Stored: $Name" -ForegroundColor Gray
}

New-GcpSecret "nucleiq-secret-key"       $SecretKey
New-GcpSecret "nucleiq-database-url"     $DatabaseUrl
New-GcpSecret "nucleiq-scheduler-secret" $SchedulerSecret

# ── Cloud Scheduler jobs ──────────────────────────────────────────────────────
Write-Host "`n[7/9] Creating Cloud Scheduler jobs (will be updated after first deploy)..." -ForegroundColor Yellow
Write-Host "    Scheduler jobs will be created by deploy.ps1 after the backend URL is known." -ForegroundColor Gray

# ── Cloud Build trigger (optional — manual deploy is fine to start) ───────────
Write-Host "`n[8/9] Skipping Cloud Build trigger (use deploy.ps1 for manual deploys)." -ForegroundColor Gray

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n[9/9] Setup complete!" -ForegroundColor Green
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " Project:          $ProjectId"
Write-Host " Region:           $Region (Mumbai)"
Write-Host " DB Instance:      nucleiq-db"
Write-Host " Media Bucket:     $BucketName"
Write-Host " Service Account:  $SA"
Write-Host ""
Write-Host " SAVE THESE — they are not shown again:" -ForegroundColor Yellow
Write-Host " DB Password:      $DbPassword"
Write-Host " Secret Key:       $SecretKey"
Write-Host " Scheduler Secret: $SchedulerSecret"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`nNext: run .\gcp\deploy.ps1 -ProjectId $ProjectId" -ForegroundColor Green
