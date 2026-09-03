# NucleiQ — Single-School Deployment Guide

## Suitability Analysis

**Short answer: Yes, NucleiQ is production-ready for a single school on either platform.**

### Tech stack summary
| Component | Technology |
|-----------|-----------|
| Backend | Django 5.1, Python 3.12, Gunicorn |
| Frontend | React + TypeScript, Vite, Nginx |
| Database | PostgreSQL 16 |
| Cache / queue broker | Redis 7 |
| Background jobs | Celery + Celery Beat |
| Media storage | Cloud Storage (GCP) or local volume (VPS) |
| Containerization | Docker (multi-stage builds, production-ready Dockerfiles already exist) |

### Key deployment requirement
The backend compiles **dlib / face_recognition** (C++ library for biometric features).  
This requires at minimum **4 GB RAM** at Docker build time even if you do not use the biometric module.

---

## Option A — Hostinger VPS (Docker Compose)

### Suitability verdict
✅ Fully suitable. Docker Compose deployment is already supported in the repository.  
Recommended plan: **KVM 2** (2 vCPU, 8 GB RAM, 100 GB NVMe SSD, ~$12–15/month).  
KVM 1 (4 GB RAM) is the absolute minimum and may struggle during the first Docker build.

### Monthly cost estimate
| Item | Cost |
|------|------|
| KVM 2 VPS | ~$12–15/month |
| Domain name (if needed) | ~$1–2/month |
| SSL certificate | Free (Let's Encrypt) |
| **Total** | **~$13–17/month** |

---

### Part 1 — Prepare your Hostinger VPS

#### 1.1 Purchase and access the VPS
1. Buy **KVM 2** (or higher) from [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting).
2. Choose **Ubuntu 22.04 LTS** as the OS.
3. In the Hostinger hPanel, go to **VPS → Manage → Access** and note your server IP address.
4. Open a terminal and connect via SSH:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

#### 1.2 Create a non-root user
```bash
adduser deploy
usermod -aG sudo deploy
# Copy SSH keys to the new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```
From now on, use the `deploy` user:
```bash
ssh deploy@YOUR_SERVER_IP
```

#### 1.3 Update the system
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

#### 1.4 Configure the firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 1.5 Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo bash

# Add deploy user to docker group
sudo usermod -aG docker deploy
newgrp docker

# Verify
docker --version
docker compose version
```

---

### Part 2 — Install Nginx and Certbot (SSL)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Start and enable Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Part 3 — Deploy the application

#### 3.1 Clone the repository
```bash
cd /home/deploy
git clone https://github.com/msyed9/nucleIQ.git nucleiq
cd nucleiq
```

#### 3.2 Create the backend environment file
```bash
cp backend/.env.example backend/.env.prod
nano backend/.env.prod
```

Set these values (replace every placeholder):
```env
SECRET_KEY=GENERATE_A_LONG_RANDOM_STRING_HERE_AT_LEAST_50_CHARS
DEBUG=False
ALLOWED_HOSTS=YOUR_DOMAIN_OR_IP,www.YOUR_DOMAIN_OR_IP
DATABASE_URL=postgresql://nucleiq_user:STRONG_DB_PASSWORD@db:5432/nucleiq
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
DJANGO_SETTINGS_MODULE=config.settings.prod
CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN_OR_IP
```

> **Tip — generate a secret key:**
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(60))"
> ```

#### 3.3 Create a production Docker Compose override file
Create `/home/deploy/nucleiq/docker-compose.prod.yml`:
```bash
nano docker-compose.prod.yml
```

Paste the following:
```yaml
version: '3.9'

services:
  db:
    restart: always
    environment:
      POSTGRES_DB: nucleiq
      POSTGRES_USER: nucleiq_user
      POSTGRES_PASSWORD: STRONG_DB_PASSWORD   # same as DATABASE_URL above

  redis:
    restart: always

  backend:
    build:
      target: production
    restart: always
    command: ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
    env_file:
      - ./backend/.env.prod
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.prod

  celery:
    build:
      target: production
    restart: always
    env_file:
      - ./backend/.env.prod

  celery-beat:
    build:
      target: production
    restart: always
    env_file:
      - ./backend/.env.prod

  frontend:
    build:
      target: production
      args:
        - VITE_API_URL=https://YOUR_DOMAIN_OR_IP/api
        - VITE_WS_URL=wss://YOUR_DOMAIN_OR_IP/ws
    restart: always
    ports:
      - "5173:80"    # nginx inside the container serves on port 80
```

#### 3.4 Build and start the containers

> The first build will take **15–30 minutes** because dlib is compiled from source.

```bash
cd /home/deploy/nucleiq
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Wait for all containers to be healthy:
```bash
docker compose ps
```

#### 3.5 Run database migrations and create the first admin
```bash
# Run migrations
docker compose exec backend python manage.py migrate --no-input

# Collect static files
docker compose exec backend python manage.py collectstatic --no-input

# Create admin account
docker compose exec backend python manage.py createsuperuser
```

---

### Part 4 — Configure Nginx as a reverse proxy

#### 4.1 Create the Nginx site configuration
```bash
sudo nano /etc/nginx/sites-available/nucleiq
```

Paste (replace `YOUR_DOMAIN_OR_IP`):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP www.YOUR_DOMAIN_OR_IP;

    # Django API and WebSocket
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        client_max_body_size 50M;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    location /nq-admin-panel/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:8000;
    }

    # React SPA
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nucleiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4.2 Enable HTTPS with Let's Encrypt (requires a real domain name)
```bash
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
# Certbot auto-renews; verify the timer
sudo systemctl status certbot.timer
```

---

### Part 5 — Configure automatic restarts on reboot

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Create a systemd service for the stack
sudo nano /etc/systemd/system/nucleiq.service
```

Paste:
```ini
[Unit]
Description=NucleiQ School Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/deploy/nucleiq
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300
User=deploy

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nucleiq
```

---

### Part 6 — Verify the deployment

| URL | Expected result |
|-----|----------------|
| `https://YOUR_DOMAIN/` | React app loads |
| `https://YOUR_DOMAIN/api/` | DRF API root JSON |
| `https://YOUR_DOMAIN/api/docs/` | Swagger UI |
| `https://YOUR_DOMAIN/nq-admin-panel/` | Django admin login |

---

### Part 7 — Updating the application (Hostinger)

```bash
cd /home/deploy/nucleiq
git pull origin master
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose exec backend python manage.py migrate --no-input
docker compose exec backend python manage.py collectstatic --no-input
```

---

---

## Option B — Google Cloud Run (Recommended)

### Suitability verdict
✅ **Best option.** The repository already includes complete GCP deployment scripts  
(`gcp/setup.ps1` and `gcp/deploy.ps1`). Cloud Run scales to zero at night and weekends,  
making it the cheapest choice for a school's bursty usage pattern.

### Monthly cost estimate
| Service | Cost (INR) |
|---------|-----------|
| Cloud Run (backend + frontend) | ₹0–₹170 |
| Cloud SQL db-f1-micro | ₹700–₹1,000 |
| Cloud Storage (media) | ₹20–₹50 |
| Cloud Scheduler | ₹0 |
| **Total** | **₹720–₹1,220/month (~$9–15)** |

---

### Part 1 — Prerequisites (one-time, done from your Windows machine)

#### 1.1 Install Google Cloud SDK
Download from: https://cloud.google.com/sdk/docs/install  
After installation, open a new PowerShell window and run:
```powershell
gcloud --version
```

#### 1.2 Install Docker Desktop
Download from: https://www.docker.com/products/docker-desktop/  
Ensure Docker Desktop is running before deployment.

#### 1.3 Sign in to Google Cloud
```powershell
gcloud auth login
gcloud auth application-default login
```

#### 1.4 Create a GCP project
Go to: https://console.cloud.google.com/projectcreate  
Note your **Project ID** (e.g., `nucleiq-school-2024`).

#### 1.5 Enable billing
Attach a billing account at: https://console.cloud.google.com/billing  
Cloud Run has a generous free tier; billing is only triggered above the free limits.

---

### Part 2 — One-time infrastructure setup

Open PowerShell in the repository root:
```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Run the setup script:
```powershell
.\gcp\setup.ps1 -ProjectId "YOUR_GCP_PROJECT_ID"
```

**What this does automatically:**
1. Enables 8 required GCP APIs (Cloud Run, Cloud SQL, Storage, Secret Manager, etc.)
2. Creates an Artifact Registry repository for Docker images
3. Creates a least-privilege service account (`nucleiq-sa`)
4. Creates a Cloud SQL PostgreSQL 16 instance in `asia-south1` (Mumbai)
5. Creates the `nucleiq` database and user
6. Creates a Cloud Storage bucket for media files (profile photos, ID cards, QR codes)
7. Stores database URL, Django secret key, and scheduler secret in Secret Manager

**Save the output.** It will print the generated database password, secret key, and scheduler secret. Store these somewhere safe — you cannot retrieve them again (but you can rotate them).

> ⚠️ Cloud SQL takes **5–10 minutes** to provision. The script waits automatically.

---

### Part 3 — Deploy the application

```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ
.\gcp\deploy.ps1 -ProjectId "YOUR_GCP_PROJECT_ID"
```

**What this does automatically:**
1. Authenticates Docker with Artifact Registry
2. Builds the backend Docker image (production target) — ~10 min first time due to dlib
3. Pushes backend image to Artifact Registry
4. Builds the frontend Docker image with correct API/WebSocket URLs
5. Pushes frontend image
6. Deploys backend to Cloud Run (`nucleiq-backend`) in asia-south1
7. Deploys frontend to Cloud Run (`nucleiq-frontend`) in asia-south1
8. Creates Cloud Scheduler jobs for:
   - Daily analytics aggregation (00:15)
   - Daily churn prediction (00:30)
   - QR code cleanup (01:00)

---

### Part 4 — Run database migrations

After the first deploy, run migrations using a Cloud Run Job:

```powershell
# Set your project ID
$PROJECT = "YOUR_GCP_PROJECT_ID"
$REGION  = "asia-south1"
$IMAGE   = "$REGION-docker.pkg.dev/$PROJECT/nucleiq/backend:latest"
$SA      = "nucleiq-sa@$PROJECT.iam.gserviceaccount.com"

# Create and run the migration job
gcloud run jobs create nucleiq-migrate `
    --image=$IMAGE `
    --region=$REGION `
    --set-env-vars=DJANGO_SETTINGS_MODULE=config.settings.cloudrun `
    --update-secrets="DATABASE_URL=nucleiq-database-url:latest,SECRET_KEY=nucleiq-secret-key:latest" `
    --add-cloudsql-instances="$PROJECT`:$REGION`:nucleiq-db" `
    --service-account=$SA `
    --command=python --args="manage.py,migrate,--no-input" `
    --project=$PROJECT

gcloud run jobs execute nucleiq-migrate --region=$REGION --project=$PROJECT --wait
```

---

### Part 5 — Create the first admin account

```powershell
$PROJECT = "YOUR_GCP_PROJECT_ID"
$REGION  = "asia-south1"
$IMAGE   = "$REGION-docker.pkg.dev/$PROJECT/nucleiq/backend:latest"
$SA      = "nucleiq-sa@$PROJECT.iam.gserviceaccount.com"

gcloud run jobs create nucleiq-createsuperuser `
    --image=$IMAGE `
    --region=$REGION `
    --set-env-vars=DJANGO_SETTINGS_MODULE=config.settings.cloudrun `
    --update-secrets="DATABASE_URL=nucleiq-database-url:latest,SECRET_KEY=nucleiq-secret-key:latest" `
    --add-cloudsql-instances="$PROJECT`:$REGION`:nucleiq-db" `
    --service-account=$SA `
    --command=python `
    --args="manage.py,shell,-c,from users.models import User; User.objects.create_superuser(username='admin',email='admin@school.edu',password='CHANGE_THIS_PASSWORD')" `
    --project=$PROJECT

gcloud run jobs execute nucleiq-createsuperuser --region=$REGION --project=$PROJECT --wait
```

> ⚠️ Change the password immediately after first login via the admin panel.

---

### Part 6 — Get your production URLs

```powershell
$PROJECT = "YOUR_GCP_PROJECT_ID"
$REGION  = "asia-south1"

$BACKEND  = gcloud run services describe nucleiq-backend  --region=$REGION --project=$PROJECT --format="value(status.url)"
$FRONTEND = gcloud run services describe nucleiq-frontend --region=$REGION --project=$PROJECT --format="value(status.url)"

Write-Host "Frontend:   $FRONTEND"
Write-Host "Backend API: $BACKEND/api/"
Write-Host "Swagger:    $BACKEND/api/docs/"
Write-Host "Admin:      $BACKEND/nq-admin-panel/"
```

---

### Part 7 — Connect a custom domain (optional but recommended)

1. Open: https://console.cloud.google.com/run/domains
2. Click **Add mapping**
3. Select `nucleiq-frontend` → map to your domain root (`school.com`)
4. Select `nucleiq-backend` → map to API subdomain (`api.school.com`)
5. Google provides a free managed SSL certificate automatically
6. Add the DNS records shown in the console to your domain registrar

---

### Part 8 — Verify the deployment

| URL | Expected result |
|-----|----------------|
| `FRONTEND_URL/` | React app loads |
| `BACKEND_URL/api/` | DRF API root JSON |
| `BACKEND_URL/api/docs/` | Swagger UI |
| `BACKEND_URL/nq-admin-panel/` | Django admin login |

---

### Part 9 — Updating the application (GCP)

```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ
git pull origin master
.\gcp\deploy.ps1 -ProjectId "YOUR_GCP_PROJECT_ID"

# Then run migrations if there are any new ones
gcloud run jobs execute nucleiq-migrate --region=asia-south1 --project=YOUR_GCP_PROJECT_ID --wait
```

---

---

## Comparison: Hostinger VPS vs Google Cloud

| Factor | Hostinger KVM 2 VPS | Google Cloud Run |
|--------|---------------------|-----------------|
| Monthly cost | ~$13–17 | ~$9–15 (₹750–1,250) |
| Setup complexity | Medium | Low (scripts provided) |
| Server maintenance | Manual (OS patches, Docker updates) | None |
| Scaling | Fixed (upgrade VPS) | Automatic (scales to zero) |
| Backups | Manual setup | Cloud SQL auto-backup included |
| SSL certificate | Free (Let's Encrypt, manual renewal) | Managed automatically |
| Custom domain | Easy with Nginx | Easy via Cloud Run domain mapping |
| Dlib build time | 15–30 min first build | ~10 min first build |
| Best for | Teams comfortable with Linux server management | Teams wanting minimal ops overhead |
| Deployment scripts in repo | ✅ docker-compose.yml | ✅ gcp/deploy.ps1 |

### Final recommendation
**Google Cloud Run** is the better choice for a single school because:
- The repository already includes complete, tested GCP deployment scripts
- Maintenance burden is near zero (no OS patching, no Docker updates)
- Cost is lower due to scale-to-zero during nights and weekends
- Automated daily backups for Cloud SQL are enabled by default
- SSL and domain mapping are managed by Google

Use **Hostinger VPS** only if you prefer to avoid a Google Cloud account or need  
full control over the server environment.

---

## Troubleshooting

### Backend container exits immediately
```bash
# VPS: check logs
docker compose logs backend --tail=50

# GCP: check Cloud Run logs
gcloud run services logs read nucleiq-backend --region=asia-south1 --project=YOUR_PROJECT
```

### Database connection refused
- VPS: Ensure the `db` container is healthy (`docker compose ps`)
- GCP: Ensure the Cloud SQL instance name in `--add-cloudsql-instances` exactly matches the format `PROJECT:REGION:INSTANCE`

### dlib build fails on VPS (out of memory)
Increase Docker's memory limit or add swap:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Static files return 404
```bash
docker compose exec backend python manage.py collectstatic --no-input
```

### Celery tasks not executing
```bash
# Check celery worker is running
docker compose ps celery

# Check for errors in celery logs
docker compose logs celery --tail=30
```
