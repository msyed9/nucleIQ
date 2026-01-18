#!/usr/bin/env bash
set -euo pipefail

# Simple VPS deploy script for nucleIQ (Ubuntu/Debian)
# Run as the `deploy` user or as root (script will use sudo where needed).

### CONFIGURE THESE BEFORE RUNNING ###
APP_DIR=${APP_DIR:-/home/deploy/apps/nucleIQ}
REPO_DIR=${REPO_DIR:-$APP_DIR/repo}
VENV_DIR=${VENV_DIR:-$APP_DIR/shared/venv}
STATIC_DIR=${STATIC_DIR:-$APP_DIR/shared/static}
MEDIA_DIR=${MEDIA_DIR:-$APP_DIR/shared/media}
WWW_ROOT=${WWW_ROOT:-/var/www/nucleiq}
SERVICE_NAME=${SERVICE_NAME:-nucleiq-gunicorn}
BRANCH=${BRANCH:-master}
ENVFILE=${ENVFILE:-$APP_DIR/shared/.env}

echo "Deploy script starting: repo=$REPO_DIR branch=$BRANCH"

if [ ! -d "$REPO_DIR" ]; then
  echo "ERROR: repo directory not found: $REPO_DIR"
  exit 1
fi

cd "$REPO_DIR"

echo "Fetching latest from origin/$BRANCH"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# load environment file into shell (export variables)
if [ -f "$ENVFILE" ]; then
  echo "Loading env from $ENVFILE"
  set -a
  # shellcheck disable=SC1090
  . "$ENVFILE"
  set +a
fi

# create shared dirs
mkdir -p "$VENV_DIR" "$STATIC_DIR" "$MEDIA_DIR" "$WWW_ROOT"

echo "Preparing Python virtualenv"
if [ ! -f "$VENV_DIR/bin/activate" ]; then
  python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip
if [ -f backend/requirements.txt ]; then
  pip install -r backend/requirements.txt
fi

echo "Building frontend"
if [ -d frontend ]; then
  pushd frontend >/dev/null
  # prefer CI-build; if node not installed, skip frontend build
  if command -v npm >/dev/null 2>&1; then
    npm ci
    npm run build
    # copy build to web root (adjust if your build output differs)
    if [ -d dist ]; then
      rsync -a --delete dist/ "$WWW_ROOT/"
    elif [ -d build ]; then
      rsync -a --delete build/ "$WWW_ROOT/"
    else
      echo "Warning: no frontend build output (dist/ or build/) found"
    fi
  else
    echo "npm not found, skipping frontend build (consider building in CI)"
  fi
  popd >/dev/null
fi

echo "Running database migrations and collectstatic"
cd backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
cd - >/dev/null

echo "Fixing permissions"
sudo chown -R deploy:www-data "$APP_DIR" || true
sudo chown -R www-data:www-data "$WWW_ROOT" || true

echo "Restarting service: $SERVICE_NAME"
sudo systemctl daemon-reload || true
sudo systemctl restart "$SERVICE_NAME"

echo "Reloading nginx"
sudo systemctl reload nginx || true

echo "Deploy complete"
