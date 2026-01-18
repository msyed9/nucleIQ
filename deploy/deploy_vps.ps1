<#
Simple PowerShell deploy script for nucleIQ.
Intended for PowerShell Core on Linux or Windows with compatible tools.
It mirrors the Bash script: pull, venv, install, build frontend, migrate, collectstatic, restart service.
#>
param(
  [string]$AppDir = '/home/deploy/apps/nucleIQ',
  [string]$RepoDir = '/home/deploy/apps/nucleIQ/repo',
  [string]$VenvDir = '/home/deploy/apps/nucleIQ/shared/venv',
  [string]$WWWRoot = '/var/www/nucleiq',
  [string]$ServiceName = 'nucleiq-gunicorn',
  [string]$Branch = 'master',
  [string]$EnvFile = '/home/deploy/apps/nucleIQ/shared/.env'
)

Write-Host "Deploy starting: repo=$RepoDir branch=$Branch"

if (-not (Test-Path $RepoDir)) {
  Write-Error "Repo dir not found: $RepoDir"
  exit 1
}

Set-Location $RepoDir

Write-Host "Fetching latest from origin/$Branch"
bash -lc "git fetch --all --prune && git checkout $Branch && git reset --hard origin/$Branch"

if (Test-Path $EnvFile) {
  Write-Host "Loading env from $EnvFile"
  # simple loader: lines like KEY=VALUE
  Get-Content $EnvFile | Where-Object {$_ -and -not $_.StartsWith('#')} | ForEach-Object {
    $parts = $_ -split '=',2
    if ($parts.Count -eq 2) { $envName=$parts[0].Trim(); $envValue=$parts[1].Trim(); $Env:$envName = $envValue }
  }
}

# create dirs
bash -lc "mkdir -p $VenvDir $WWWRoot"

Write-Host "Preparing Python virtualenv"
bash -lc "if [ ! -f '$VenvDir/bin/activate' ]; then python3 -m venv '$VenvDir'; fi"
bash -lc "source $VenvDir/bin/activate && python -m pip install --upgrade pip"
if (Test-Path "backend/requirements.txt") {
  bash -lc "source $VenvDir/bin/activate && pip install -r backend/requirements.txt"
}

Write-Host "Building frontend (if npm present)"
if (Test-Path frontend) {
  if (bash -lc "command -v npm >/dev/null 2>&1; echo $?") {
    bash -lc "cd frontend && npm ci && npm run build"
    bash -lc "if [ -d frontend/dist ]; then rsync -a --delete frontend/dist/ $WWWRoot/; elif [ -d frontend/build ]; then rsync -a --delete frontend/build/ $WWWRoot/; fi"
  } else {
    Write-Host "npm not found, skipping frontend build"
  }
}

Write-Host "Running Django migrations and collectstatic"
bash -lc "source $VenvDir/bin/activate && cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput"

Write-Host "Fixing permissions and restarting services"
bash -lc "sudo chown -R deploy:www-data $AppDir || true"
bash -lc "sudo chown -R www-data:www-data $WWWRoot || true"
bash -lc "sudo systemctl daemon-reload || true && sudo systemctl restart $ServiceName || true && sudo systemctl reload nginx || true"

Write-Host "Deploy complete"
