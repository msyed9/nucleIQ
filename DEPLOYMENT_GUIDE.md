# NucleiQ Deployment Guide

This guide covers the recommended low-cost deployment architecture for a single Indian school instance serving around 1,000 students.

## Recommended architecture

Use:
- Google Cloud Run for backend and frontend
- Cloud SQL for PostgreSQL
- Cloud Storage for school media files
- Cloud Scheduler for periodic tasks

This is the best low-cost option for low traffic, bursty usage, and minimal maintenance.

## Why this is the best option

- Cloud Run automatically scales to zero at night and on weekends
- Very low cost for low-traffic school systems
- Best fit for school workloads with spikes during admissions and form submissions
- No server patching or OS maintenance
- Easy updates via container deploys
- Already supported by this repository's Cloud Run configuration

Estimated monthly cost in INR (approx):
- Cloud Run: ₹0–₹170
- Cloud SQL: around ₹700–₹1,000
- Cloud Storage: around ₹20–₹50
- Cloud Scheduler: ₹0
- Total: around ₹1,000–₹1,500/month

## Local Docker deployment

### Requirements
- Docker Desktop
- Git
- A working terminal

### 1. Create local environment file

From the repository root:

```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ\backend
Copy-Item .env.example .env.dev
```

Edit `.env.dev` and ensure these values exist:

```env
SECRET_KEY=your-local-secret-key
DATABASE_URL=postgresql://nucleiq_user:nucleiq_pass_dev_only@db:5432/nucleiq
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
DJANGO_SETTINGS_MODULE=config.settings.dev
```

### 2. Start the stack

```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ
docker-compose up --build
```

### 3. Run migrations

```powershell
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 4. Access the app

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Swagger docs: http://localhost:8000/api/docs/
- Admin: http://localhost:8000/nq-admin-panel/

### 5. Stop the stack

```powershell
docker-compose down
```

## Google Cloud production deployment

### Prerequisites

- Google Cloud SDK installed
- Billing enabled on the Google Cloud project
- A GCP project created
- Logged in with `gcloud auth login`

### 1. One-time GCP setup

```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\gcp\setup.ps1 -ProjectId "your-gcp-project-id"
```

This creates:
- Cloud SQL PostgreSQL instance
- Artifact Registry
- Cloud Storage bucket
- Secret Manager values
- Service account permissions

Save the generated database password, secret key, and scheduler secret.

### 2. Deploy the app

```powershell
cd C:\ECOLAB-ETS\RnD\nucleIQ
.\gcp\deploy.ps1 -ProjectId "your-gcp-project-id"
```

This will:
- Build backend Docker image
- Build frontend Docker image
- Push both to Artifact Registry
- Deploy backend service to Cloud Run
- Deploy frontend service to Cloud Run
- Create Cloud Scheduler jobs

### 3. Run database migrations

Use the command printed by the deploy script or run a Cloud Run job to execute migrations.

Example pattern:

```powershell
gcloud run jobs create nucleiq-migrate \
    --image=asia-south1-docker.pkg.dev/YOUR_PROJECT/nucleiq/backend:latest \
    --region=asia-south1 \
    --set-env-vars=DJANGO_SETTINGS_MODULE=config.settings.cloudrun \
    --update-secrets=DATABASE_URL=nucleiq-database-url:latest,SECRET_KEY=nucleiq-secret-key:latest \
    --add-cloudsql-instances=YOUR_PROJECT:asia-south1:nucleiq-db \
    --service-account=nucleiq-sa@YOUR_PROJECT.iam.gserviceaccount.com \
    --command=python --args='manage.py,migrate,--no-input' \
    --project=YOUR_PROJECT

gcloud run jobs execute nucleiq-migrate --region=asia-south1 --project=YOUR_PROJECT --wait
```

### 4. Create the first admin account

```powershell
gcloud run jobs create nucleiq-createsuperuser \
    --image=asia-south1-docker.pkg.dev/YOUR_PROJECT/nucleiq/backend:latest \
    --region=asia-south1 \
    --set-env-vars=DJANGO_SETTINGS_MODULE=config.settings.cloudrun \
    --update-secrets=DATABASE_URL=nucleiq-database-url:latest,SECRET_KEY=nucleiq-secret-key:latest \
    --add-cloudsql-instances=YOUR_PROJECT:asia-south1:nucleiq-db \
    --service-account=nucleiq-sa@YOUR_PROJECT.iam.gserviceaccount.com \
    --command=python --args='manage.py,shell,-c,from users.models import User; User.objects.create_superuser(username="admin",email="admin@school.edu",password="CHANGE_ME")' \
    --project=YOUR_PROJECT

gcloud run jobs execute nucleiq-createsuperuser --region=asia-south1 --project=YOUR_PROJECT --wait
```

### 5. Access production URLs

After deploy, the script prints:
- Backend API URL
- Frontend URL
- Swagger docs URL

### 6. Update production later

```powershell
.\gcp\deploy.ps1 -ProjectId "your-gcp-project-id"
```

## Recommended region for Indian school

Use:
- `asia-south1` (Mumbai)

This is the best option for Indian users due to lower latency and lower cost for region-appropriate services.

## Notes for school usage patterns

- Low usage at night and weekends: Cloud Run scales to zero and costs almost nothing
- Admission and result days can cause traffic spikes: Cloud Run scales automatically
- Background jobs for analytics and cleanup are handled by Cloud Scheduler
- Media files are stored in GCS, not on VM local disk

## Final recommendation

For a 1,000-student school in India, the best option is:

- Google Cloud Run + Cloud SQL + Cloud Storage + Cloud Scheduler

This gives the best balance of:
- lowest monthly cost
- excellent scaling for usage bursts
- minimal maintenance
- easy deployment and updates
