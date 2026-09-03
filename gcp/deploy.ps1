# ============================================================================
# NucleiQ — Deploy to Google Cloud Run
# Run this every time you want to push a new version to production.
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$Region       = "asia-south1",
    [string]$Tag          = "latest",
    [string]$BackendUrl   = ""    # Auto-detected after first deploy
)

$ErrorActionPreference = "Stop"
$Registry = "$Region-docker.pkg.dev/$ProjectId/nucleiq"

Write-Host "`n=== NucleiQ Deploy — project: $ProjectId ===" -ForegroundColor Cyan

# ── Configure Docker auth ─────────────────────────────────────────────────────
Write-Host "`n[1/5] Configuring Docker authentication..." -ForegroundColor Yellow
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet

# ── Build and push backend ────────────────────────────────────────────────────
Write-Host "`n[2/5] Building backend image (this takes ~10 min first time due to dlib)..." -ForegroundColor Yellow
docker build `
    --target production `
    -t "$Registry/backend:$Tag" `
    -f backend/Dockerfile `
    ./backend

docker push "$Registry/backend:$Tag"

# ── Build and push frontend ───────────────────────────────────────────────────
Write-Host "`n[3/5] Building frontend image..." -ForegroundColor Yellow

# Detect backend URL if not provided
if (-not $BackendUrl) {
    $BackendUrl = gcloud run services describe nucleiq-backend `
        --region=$Region --project=$ProjectId `
        --format="value(status.url)" 2>$null
}

if ($BackendUrl) {
    $ApiUrl = "$BackendUrl/api"
    $WsUrl  = ($BackendUrl -replace "^https://","wss://") + "/ws"
} else {
    Write-Host "    Backend URL not found yet — using placeholder. Re-run after first backend deploy." -ForegroundColor Yellow
    $ApiUrl = "https://REPLACE_AFTER_FIRST_DEPLOY/api"
    $WsUrl  = "wss://REPLACE_AFTER_FIRST_DEPLOY/ws"
}

docker build `
    --target production `
    --build-arg "VITE_API_URL=$ApiUrl" `
    --build-arg "VITE_WS_URL=$WsUrl" `
    -t "$Registry/frontend:$Tag" `
    -f frontend/Dockerfile `
    ./frontend

docker push "$Registry/frontend:$Tag"

# ── Deploy backend to Cloud Run ───────────────────────────────────────────────
Write-Host "`n[4/5] Deploying backend to Cloud Run ($Region)..." -ForegroundColor Yellow
gcloud run deploy nucleiq-backend `
    --image="$Registry/backend:$Tag" `
    --region=$Region `
    --platform=managed `
    --service-account="nucleiq-sa@$ProjectId.iam.gserviceaccount.com" `
    --add-cloudsql-instances="$ProjectId`:$Region`:nucleiq-db" `
    --memory=1Gi `
    --cpu=1 `
    --concurrency=80 `
    --min-instances=0 `
    --max-instances=5 `
    --timeout=300 `
    --set-env-vars="DJANGO_SETTINGS_MODULE=config.settings.cloudrun,GCS_BUCKET_NAME=$ProjectId-nucleiq-media" `
    --update-secrets="SECRET_KEY=nucleiq-secret-key:latest,DATABASE_URL=nucleiq-database-url:latest,SCHEDULER_SECRET=nucleiq-scheduler-secret:latest" `
    --allow-unauthenticated `
    --project=$ProjectId

# Get backend URL for scheduler setup
$BackendUrl = gcloud run services describe nucleiq-backend `
    --region=$Region --project=$ProjectId `
    --format="value(status.url)"

Write-Host "    Backend URL: $BackendUrl" -ForegroundColor Gray

# ── Deploy frontend to Cloud Run ──────────────────────────────────────────────
Write-Host "`n[5/5] Deploying frontend to Cloud Run ($Region)..." -ForegroundColor Yellow
gcloud run deploy nucleiq-frontend `
    --image="$Registry/frontend:$Tag" `
    --region=$Region `
    --platform=managed `
    --memory=256Mi `
    --cpu=1 `
    --concurrency=200 `
    --min-instances=0 `
    --max-instances=3 `
    --allow-unauthenticated `
    --project=$ProjectId

$FrontendUrl = gcloud run services describe nucleiq-frontend `
    --region=$Region --project=$ProjectId `
    --format="value(status.url)"

# ── Set up / update Cloud Scheduler jobs ─────────────────────────────────────
Write-Host "`nSetting up Cloud Scheduler jobs..." -ForegroundColor Yellow

$SchedulerSecret = gcloud secrets versions access latest `
    --secret=nucleiq-scheduler-secret --project=$ProjectId

$jobs = @(
    @{ name="nucleiq-analytics-daily"; schedule="15 0 * * *"; task="analytics-daily";   desc="Daily analytics aggregation" },
    @{ name="nucleiq-analytics-churn"; schedule="30 0 * * *"; task="analytics-churn";   desc="Daily churn prediction" },
    @{ name="nucleiq-idcards-cleanup"; schedule="0 1 * * *";  task="idcards-cleanup";   desc="QR code cleanup" }
)

foreach ($job in $jobs) {
    $uri = "$BackendUrl/api/scheduler/$($job.task)/"
    # Try create, update if exists
    gcloud scheduler jobs create http $job.name `
        --location=$Region `
        --schedule=$job.schedule `
        --uri=$uri `
        --http-method=POST `
        --headers="X-Scheduler-Token=$SchedulerSecret,Content-Type=application/json" `
        --message-body="{}" `
        --time-zone="Asia/Kolkata" `
        --description=$job.desc `
        --project=$ProjectId 2>$null

    if ($LASTEXITCODE -ne 0) {
        gcloud scheduler jobs update http $job.name `
            --location=$Region `
            --uri=$uri `
            --headers="X-Scheduler-Token=$SchedulerSecret,Content-Type=application/json" `
            --project=$ProjectId
    }
    Write-Host "    Scheduled: $($job.name) at $($job.schedule) IST" -ForegroundColor Gray
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host " Deploy complete!" -ForegroundColor Green
Write-Host ""
Write-Host " Backend API:  $BackendUrl/api/"
Write-Host " Frontend:     $FrontendUrl"
Write-Host " API Docs:     $BackendUrl/api/docs/"
Write-Host " Admin Panel:  $BackendUrl/nq-admin-panel/"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "`nFirst deploy? Run the DB migration:" -ForegroundColor Yellow
Write-Host "  gcloud run jobs create nucleiq-migrate --image=$Registry/backend:$Tag --region=$Region --set-env-vars=DJANGO_SETTINGS_MODULE=config.settings.cloudrun --update-secrets=DATABASE_URL=nucleiq-database-url:latest,SECRET_KEY=nucleiq-secret-key:latest --add-cloudsql-instances=$ProjectId`:$Region`:nucleiq-db --service-account=nucleiq-sa@$ProjectId.iam.gserviceaccount.com --command=python --args='manage.py,migrate,--no-input' --project=$ProjectId"
Write-Host "  gcloud run jobs execute nucleiq-migrate --region=$Region --project=$ProjectId --wait"
