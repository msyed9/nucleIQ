# NucleiQ Azure Deployment Plan
## Comprehensive Production Deployment Guide

**Domain**: nucleiq.io  
**Region**: Central India (centralindia)  
**Estimated Monthly Cost**: ~$80-105 (Startup Tier)

---

## Table of Contents
1. [Application Analysis](#application-analysis)
2. [Deployment Options Comparison](#deployment-options-comparison)
3. [Recommended Architecture](#recommended-architecture)
4. [Cost Analysis](#cost-analysis)
5. [GitHub to Production CI/CD Setup](#github-to-production-cicd-setup)
6. [Hostinger Integration](#hostinger-integration)
7. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
8. [Scalability Roadmap](#scalability-roadmap)
9. [Security Considerations](#security-considerations)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 1. Application Analysis

### Tech Stack Summary
Based on the codebase analysis:

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend** | Django (REST Framework) | 5.1.4 |
| **Frontend** | React (Vite + TypeScript) | 18.3.1 |
| **Database** | PostgreSQL | 16 |
| **Cache/Broker** | Redis | 7 |
| **Task Queue** | Celery | 5.4.0 |
| **WSGI Server** | Gunicorn | 23.0.0 |
| **Web Server** | Nginx | Alpine |
| **Container** | Docker (Multi-stage) | ✅ |

### Application Components
1. **Django Backend API** - REST API with tenant isolation, JWT auth
2. **React Frontend SPA** - Vite-built static assets served via Nginx
3. **PostgreSQL Database** - Multi-tenant data with RLS support
4. **Redis** - Caching + Celery message broker
5. **Celery Worker** - Background task processing
6. **Celery Beat** - Scheduled task scheduler

### Resource Requirements (Estimated)
- **Backend**: ~512MB RAM base, 1 CPU core minimum
- **Frontend**: Static files (~50-100MB after build)
- **Database**: Depends on tenants, start with 2GB RAM
- **Redis**: ~128MB RAM for caching/queuing
- **Celery Worker**: ~256-512MB RAM

---

## 2. Deployment Options Comparison

### Option A: Azure Container Apps (✅ RECOMMENDED)

| Aspect | Rating | Details |
|--------|--------|---------|
| **Cost** | ⭐⭐⭐⭐⭐ | Pay-per-use, serverless pricing |
| **Scalability** | ⭐⭐⭐⭐⭐ | Auto-scaling built-in (0 to N replicas) |
| **Docker Support** | ⭐⭐⭐⭐⭐ | Native Docker container support |
| **CI/CD** | ⭐⭐⭐⭐⭐ | GitHub Actions integration |
| **Management** | ⭐⭐⭐⭐ | Minimal infrastructure management |
| **Custom Domain** | ⭐⭐⭐⭐ | Easy SSL/TLS with managed certificates |

**Why Recommended:**
- Serverless containers - pay only when containers run
- Scale to zero during low traffic (cost savings)
- Built-in ingress controller (no load balancer cost)
- Managed HTTPS with automatic certificate renewal
- Native integration with Azure services
- Supports Dapr for microservices patterns

### Option B: Azure App Service (Web App for Containers)

| Aspect | Rating | Details |
|--------|--------|---------|
| **Cost** | ⭐⭐⭐ | Fixed monthly cost per plan |
| **Scalability** | ⭐⭐⭐⭐ | Manual/auto-scaling available |
| **Docker Support** | ⭐⭐⭐⭐ | Docker container deployment |
| **CI/CD** | ⭐⭐⭐⭐⭐ | Excellent GitHub integration |
| **Management** | ⭐⭐⭐⭐⭐ | Very easy to manage |
| **Custom Domain** | ⭐⭐⭐⭐⭐ | Free SSL with managed certificates |

**Considerations:**
- Simpler than Container Apps but less flexible
- Fixed pricing even during low usage
- Good for predictable workloads

### Option C: Azure Kubernetes Service (AKS)

| Aspect | Rating | Details |
|--------|--------|---------|
| **Cost** | ⭐⭐ | Higher base cost, node charges |
| **Scalability** | ⭐⭐⭐⭐⭐ | Enterprise-grade scaling |
| **Docker Support** | ⭐⭐⭐⭐⭐ | Full Kubernetes orchestration |
| **CI/CD** | ⭐⭐⭐⭐ | Requires more setup |
| **Management** | ⭐⭐ | Significant K8s expertise needed |
| **Custom Domain** | ⭐⭐⭐⭐ | Ingress controller setup required |

**Considerations:**
- Overkill for current scale
- Higher operational overhead
- Best for very large, complex deployments

### Option D: Azure Virtual Machines (Docker Compose)

| Aspect | Rating | Details |
|--------|--------|---------|
| **Cost** | ⭐⭐⭐ | Fixed VM cost + management |
| **Scalability** | ⭐⭐ | Manual scaling, complex |
| **Docker Support** | ⭐⭐⭐⭐⭐ | Full Docker Compose support |
| **CI/CD** | ⭐⭐⭐ | Requires custom setup |
| **Management** | ⭐ | Full VM management burden |
| **Custom Domain** | ⭐⭐⭐ | Manual SSL setup |

**Considerations:**
- Full control but high management overhead
- You manage OS updates, security patches
- Not recommended for production workloads

---

## 3. Recommended Architecture

### 🏆 Final Recommendation: Azure Container Apps + Managed Services

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────────────────────────────┐   │
│  │   Hostinger      │    │        Azure Container Apps Environment   │   │
│  │   (DNS/Domain)   │    │  ┌────────────────────────────────────┐  │   │
│  │                  │    │  │                                    │  │   │
│  │  *.nucleiq.com   │────│──▶  Frontend Container (Nginx)       │  │   │
│  │  api.nucleiq.com │    │  │  - React SPA Static Files         │  │   │
│  │                  │    │  │  - Auto-scale 0-10 replicas       │  │   │
│  └──────────────────┘    │  └────────────────────────────────────┘  │   │
│                          │                    │                      │   │
│                          │  ┌────────────────────────────────────┐  │   │
│                          │  │                                    │  │   │
│                          │  │  Backend Container (Gunicorn)     │──│───│──┐
│                          │  │  - Django REST API                 │  │   │  │
│                          │  │  - Auto-scale 1-10 replicas       │  │   │  │
│                          │  └────────────────────────────────────┘  │   │  │
│                          │                    │                      │   │  │
│                          │  ┌────────────────────────────────────┐  │   │  │
│                          │  │                                    │  │   │  │
│                          │  │  Celery Worker Container          │──│───│──┤
│                          │  │  - Background Tasks               │  │   │  │
│                          │  │  - Scale 1-5 replicas             │  │   │  │
│                          │  └────────────────────────────────────┘  │   │  │
│                          │                    │                      │   │  │
│                          │  ┌────────────────────────────────────┐  │   │  │
│                          │  │                                    │  │   │  │
│                          │  │  Celery Beat Container            │  │   │  │
│                          │  │  - Scheduled Tasks (1 replica)    │  │   │  │
│                          │  └────────────────────────────────────┘  │   │  │
│                          └──────────────────────────────────────────┘   │  │
│                                                                          │  │
│  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │                    MANAGED SERVICES                               │   │  │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────┐  │   │  │
│  │  │                     │    │                                 │  │◀──┘  │
│  │  │  Azure Database     │    │  Azure Cache for Redis         │  │      │
│  │  │  for PostgreSQL     │    │  - Basic C0 tier               │  │      │
│  │  │  - Flexible Server  │    │  - 250MB cache                 │  │      │
│  │  │  - Burstable B1ms   │    │                                 │  │      │
│  │  └─────────────────────┘    └─────────────────────────────────┘  │      │
│  │                                                                   │      │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────┐  │      │
│  │  │                     │    │                                 │  │      │
│  │  │  Azure Blob Storage │    │  Azure Container Registry      │  │      │
│  │  │  - Media Files      │    │  - Docker Images               │  │      │
│  │  │  - Backups          │    │  - Basic tier                  │  │      │
│  │  └─────────────────────┘    └─────────────────────────────────┘  │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                    CI/CD PIPELINE                                 │      │
│  │  ┌─────────────────────────────────────────────────────────────┐ │      │
│  │  │  GitHub Repository  ──▶  GitHub Actions  ──▶  ACR  ──▶  ACA │ │      │
│  │  └─────────────────────────────────────────────────────────────┘ │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Cost Efficiency**
   - Container Apps: Pay per vCPU-second and memory-GB-second
   - Scale to zero during off-peak hours
   - No load balancer or ingress controller costs
   - Managed certificates (free SSL)

2. **Scalability**
   - Horizontal auto-scaling based on HTTP traffic
   - KEDA-based scaling for Celery workers (queue-based)
   - Scale from 0 to 100+ replicas automatically

3. **Reliability**
   - Azure-managed PostgreSQL with automatic backups
   - Redis failover and persistence
   - Multi-zone availability for containers

4. **Security**
   - Private VNet integration
   - Managed identity (no secrets in containers)
   - Built-in HTTPS enforcement

---

## 4. Cost Analysis

### Monthly Cost Estimate (USD)

#### Tier 1: Startup/Low Traffic (< 1000 daily users)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Container Apps** | 0.5 vCPU, 1GB RAM per container | ~$30-50 |
| **PostgreSQL Flexible** | Burstable B1ms (1 vCore, 2GB) | ~$25 |
| **Azure Cache for Redis** | Basic C0 (250MB) | ~$16 |
| **Container Registry** | Basic | ~$5 |
| **Blob Storage** | 10GB + transactions | ~$2 |
| **Bandwidth** | 50GB outbound | ~$4 |
| **TOTAL** | | **~$82-105/month** |

#### Tier 2: Growth Stage (1000-10000 daily users)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Container Apps** | 1 vCPU, 2GB RAM per container | ~$80-120 |
| **PostgreSQL Flexible** | General Purpose D2s_v3 (2 vCores, 8GB) | ~$100 |
| **Azure Cache for Redis** | Standard C1 (1GB) | ~$50 |
| **Container Registry** | Standard | ~$20 |
| **Blob Storage** | 100GB + transactions | ~$10 |
| **Bandwidth** | 500GB outbound | ~$40 |
| **TOTAL** | | **~$300-340/month** |

#### Tier 3: Scale Stage (10000+ daily users)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Container Apps** | 2 vCPU, 4GB RAM, multiple replicas | ~$200-400 |
| **PostgreSQL Flexible** | General Purpose D4s_v3 (4 vCores, 16GB) | ~$200 |
| **Azure Cache for Redis** | Standard C2 (2.5GB) | ~$100 |
| **Container Registry** | Premium | ~$50 |
| **Blob Storage** | 500GB + CDN | ~$50 |
| **Bandwidth** | 2TB outbound | ~$160 |
| **TOTAL** | | **~$760-960/month** |

### Cost Optimization Tips

1. **Reserved Instances**: Save 30-60% on PostgreSQL and Redis with 1-3 year commitments
2. **Dev/Test Pricing**: Use Azure Dev/Test subscription for non-production environments
3. **Scale to Zero**: Container Apps can scale to zero during off-hours
4. **Spot Instances**: For non-critical batch processing (Celery workers)
5. **Azure Hybrid Benefit**: If you have existing Windows Server licenses

---

## 5. GitHub to Production CI/CD Setup

### Repository Structure
```
nucleIQ/
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml
│       ├── frontend-deploy.yml
│       └── full-deploy.yml
├── backend/
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
└── docker-compose.yml
```

### GitHub Actions Workflow - Full Deploy

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Azure Container Apps

on:
  push:
    branches:
      - main
      - production
  workflow_dispatch:

env:
  AZURE_CONTAINER_REGISTRY: nucleiqacr
  REGISTRY_URL: nucleiqacr.azurecr.io
  CONTAINER_APP_ENVIRONMENT: nucleiq-production
  RESOURCE_GROUP: nucleiq-production-rg

jobs:
  build-and-deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ env.REGISTRY_URL }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push backend image
        run: |
          docker build \
            --target production \
            -t ${{ env.REGISTRY_URL }}/nucleiq-backend:${{ github.sha }} \
            -t ${{ env.REGISTRY_URL }}/nucleiq-backend:latest \
            ./backend
          docker push ${{ env.REGISTRY_URL }}/nucleiq-backend:${{ github.sha }}
          docker push ${{ env.REGISTRY_URL }}/nucleiq-backend:latest

      - name: Deploy Backend to Azure Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          appSourcePath: ${{ github.workspace }}/backend
          acrName: ${{ env.AZURE_CONTAINER_REGISTRY }}
          containerAppName: nucleiq-backend
          resourceGroup: ${{ env.RESOURCE_GROUP }}
          imageToDeploy: ${{ env.REGISTRY_URL }}/nucleiq-backend:${{ github.sha }}

      - name: Run Database Migrations
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az containerapp exec \
              --name nucleiq-backend \
              --resource-group ${{ env.RESOURCE_GROUP }} \
              --command "python manage.py migrate --noinput"

  build-and-deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ env.REGISTRY_URL }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push frontend image
        run: |
          docker build \
            --target production \
            --build-arg VITE_API_URL=${{ secrets.PRODUCTION_API_URL }} \
            -t ${{ env.REGISTRY_URL }}/nucleiq-frontend:${{ github.sha }} \
            -t ${{ env.REGISTRY_URL }}/nucleiq-frontend:latest \
            ./frontend
          docker push ${{ env.REGISTRY_URL }}/nucleiq-frontend:${{ github.sha }}
          docker push ${{ env.REGISTRY_URL }}/nucleiq-frontend:latest

      - name: Deploy Frontend to Azure Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          appSourcePath: ${{ github.workspace }}/frontend
          acrName: ${{ env.AZURE_CONTAINER_REGISTRY }}
          containerAppName: nucleiq-frontend
          resourceGroup: ${{ env.RESOURCE_GROUP }}
          imageToDeploy: ${{ env.REGISTRY_URL }}/nucleiq-frontend:${{ github.sha }}

  deploy-celery-workers:
    runs-on: ubuntu-latest
    needs: build-and-deploy-backend
    steps:
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy Celery Worker
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az containerapp update \
              --name nucleiq-celery-worker \
              --resource-group ${{ env.RESOURCE_GROUP }} \
              --image ${{ env.REGISTRY_URL }}/nucleiq-backend:${{ github.sha }}

      - name: Deploy Celery Beat
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az containerapp update \
              --name nucleiq-celery-beat \
              --resource-group ${{ env.RESOURCE_GROUP }} \
              --image ${{ env.REGISTRY_URL }}/nucleiq-backend:${{ github.sha }}

  notify-deployment:
    runs-on: ubuntu-latest
    needs: [build-and-deploy-backend, build-and-deploy-frontend, deploy-celery-workers]
    if: always()
    steps:
      - name: Notify on success
        if: success()
        run: |
          echo "🚀 Deployment successful!"
          # Add Slack/Teams notification here

      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          # Add Slack/Teams notification here
```

### GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CREDENTIALS` | Azure Service Principal JSON |
| `ACR_USERNAME` | Azure Container Registry username |
| `ACR_PASSWORD` | Azure Container Registry password |
| `PRODUCTION_API_URL` | Backend API URL (e.g., `https://api.nucleiq.com/api`) |

---

## 6. Hostinger Integration

### Domain Configuration

Your portal on Hostinger will point to Azure Container Apps. Here's how to set it up:

#### Step 1: Azure Container Apps Custom Domain

1. Get the Container Apps FQDN:
   ```
   nucleiq-frontend.xxx.azurecontainerapps.io
   nucleiq-backend.xxx.azurecontainerapps.io
   ```

2. In Azure Portal > Container App > Custom domains:
   - Add `nucleiq.com` (or your domain)
   - Add `api.nucleiq.com` for API subdomain
   - Enable managed certificate for free SSL

#### Step 2: Hostinger DNS Configuration

In Hostinger DNS Zone Editor, add these records:

| Type | Name | Target/Value | TTL |
|------|------|--------------|-----|
| **CNAME** | `@` | `nucleiq-frontend.xxx.azurecontainerapps.io` | 3600 |
| **CNAME** | `www` | `nucleiq-frontend.xxx.azurecontainerapps.io` | 3600 |
| **CNAME** | `api` | `nucleiq-backend.xxx.azurecontainerapps.io` | 3600 |
| **TXT** | `asuid` | `<verification-id-from-azure>` | 3600 |
| **TXT** | `asuid.api` | `<verification-id-from-azure>` | 3600 |

#### Step 3: SSL/TLS Configuration

Azure Container Apps provides **free managed certificates**:
- Automatically issues Let's Encrypt certificates
- Auto-renews before expiration
- No additional configuration needed

#### Architecture with Hostinger

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        HOSTINGER DNS                                 │
│  nucleiq.com ──────▶ CNAME ──────▶ nucleiq-frontend.xxx.azure...   │
│  api.nucleiq.com ──▶ CNAME ──────▶ nucleiq-backend.xxx.azure...    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  AZURE CONTAINER APPS INGRESS                        │
│  - Automatic HTTPS (free managed certificate)                        │
│  - Load balancing across replicas                                    │
│  - Traffic splitting for blue/green deployments                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
           ┌───────────────┐                ┌───────────────┐
           │   Frontend    │                │   Backend     │
           │   Container   │                │   Container   │
           └───────────────┘                └───────────────┘
```

---

## 7. Step-by-Step Implementation Guide

### Phase 1: Azure Infrastructure Setup (Day 1)

#### 1.1 Create Resource Group
```bash
# Login to Azure CLI
az login

# Create resource group
az group create \
  --name nucleiq-production-rg \
  --location eastus
```

#### 1.2 Create Azure Container Registry
```bash
# Create ACR
az acr create \
  --resource-group nucleiq-production-rg \
  --name nucleiqacr \
  --sku Basic \
  --admin-enabled true

# Get ACR credentials
az acr credential show --name nucleiqacr
```

#### 1.3 Create Azure Database for PostgreSQL
```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group nucleiq-production-rg \
  --name nucleiq-db-server \
  --location eastus \
  --admin-user nucleiq_admin \
  --admin-password "<strong-password>" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --high-availability Disabled \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group nucleiq-production-rg \
  --server-name nucleiq-db-server \
  --database-name nucleiq

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --resource-group nucleiq-production-rg \
  --name nucleiq-db-server \
  --rule-name allow-azure-services \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### 1.4 Create Azure Cache for Redis
```bash
az redis create \
  --resource-group nucleiq-production-rg \
  --name nucleiq-redis \
  --location eastus \
  --sku Basic \
  --vm-size C0 \
  --enable-non-ssl-port
```

#### 1.5 Create Azure Blob Storage
```bash
# Create storage account
az storage account create \
  --resource-group nucleiq-production-rg \
  --name nucleiqstorage \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Create containers
az storage container create \
  --account-name nucleiqstorage \
  --name media \
  --public-access blob

az storage container create \
  --account-name nucleiqstorage \
  --name static \
  --public-access blob
```

### Phase 2: Container Apps Environment (Day 2)

#### 2.1 Create Container Apps Environment
```bash
# Create environment
az containerapp env create \
  --name nucleiq-production \
  --resource-group nucleiq-production-rg \
  --location eastus
```

#### 2.2 Build and Push Docker Images
```bash
# Build and push backend
docker build --target production -t nucleiqacr.azurecr.io/nucleiq-backend:v1 ./backend
az acr login --name nucleiqacr
docker push nucleiqacr.azurecr.io/nucleiq-backend:v1

# Build and push frontend
docker build --target production -t nucleiqacr.azurecr.io/nucleiq-frontend:v1 ./frontend
docker push nucleiqacr.azurecr.io/nucleiq-frontend:v1
```

#### 2.3 Deploy Backend Container App
```bash
az containerapp create \
  --name nucleiq-backend \
  --resource-group nucleiq-production-rg \
  --environment nucleiq-production \
  --image nucleiqacr.azurecr.io/nucleiq-backend:v1 \
  --registry-server nucleiqacr.azurecr.io \
  --registry-username <acr-username> \
  --registry-password <acr-password> \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY=secretref:django-secret-key \
    DB_HOST=nucleiq-db-server.postgres.database.azure.com \
    DB_NAME=nucleiq \
    DB_USER=nucleiq_admin \
    DB_PASSWORD=secretref:db-password \
    REDIS_URL=secretref:redis-url \
    ALLOWED_HOSTS=nucleiq-backend.xxx.azurecontainerapps.io,api.nucleiq.com
```

#### 2.4 Deploy Frontend Container App
```bash
az containerapp create \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --environment nucleiq-production \
  --image nucleiqacr.azurecr.io/nucleiq-frontend:v1 \
  --registry-server nucleiqacr.azurecr.io \
  --registry-username <acr-username> \
  --registry-password <acr-password> \
  --target-port 80 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.25 \
  --memory 0.5Gi
```

#### 2.5 Deploy Celery Worker
```bash
az containerapp create \
  --name nucleiq-celery-worker \
  --resource-group nucleiq-production-rg \
  --environment nucleiq-production \
  --image nucleiqacr.azurecr.io/nucleiq-backend:v1 \
  --registry-server nucleiqacr.azurecr.io \
  --registry-username <acr-username> \
  --registry-password <acr-password> \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1Gi \
  --command "celery" "-A" "config" "worker" "-l" "info" \
  --env-vars \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY=secretref:django-secret-key \
    DB_HOST=nucleiq-db-server.postgres.database.azure.com \
    REDIS_URL=secretref:redis-url
```

#### 2.6 Deploy Celery Beat
```bash
az containerapp create \
  --name nucleiq-celery-beat \
  --resource-group nucleiq-production-rg \
  --environment nucleiq-production \
  --image nucleiqacr.azurecr.io/nucleiq-backend:v1 \
  --registry-server nucleiqacr.azurecr.io \
  --registry-username <acr-username> \
  --registry-password <acr-password> \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --command "celery" "-A" "config" "beat" "-l" "info" \
  --env-vars \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY=secretref:django-secret-key \
    DB_HOST=nucleiq-db-server.postgres.database.azure.com \
    REDIS_URL=secretref:redis-url
```

### Phase 3: Custom Domain & SSL (Day 3)

#### 3.1 Configure Custom Domain
```bash
# Add custom domain to frontend
az containerapp hostname add \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --hostname nucleiq.com

# Add custom domain to backend
az containerapp hostname add \
  --name nucleiq-backend \
  --resource-group nucleiq-production-rg \
  --hostname api.nucleiq.com
```

#### 3.2 Configure Managed Certificates
```bash
# Bind certificate to frontend
az containerapp hostname bind \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --hostname nucleiq.com \
  --certificate-type managed

# Bind certificate to backend
az containerapp hostname bind \
  --name nucleiq-backend \
  --resource-group nucleiq-production-rg \
  --hostname api.nucleiq.com \
  --certificate-type managed
```

### Phase 4: GitHub Actions Setup (Day 4)

1. Create Azure Service Principal:
```bash
az ad sp create-for-rbac \
  --name "nucleiq-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/nucleiq-production-rg \
  --sdk-auth
```

2. Add the JSON output as `AZURE_CREDENTIALS` secret in GitHub

3. Create the workflow file (see Section 5)

4. Push to trigger deployment

---

## 8. Scalability Roadmap

### Current State (Tier 1)
- Single-region deployment
- Basic tier services
- Manual scaling decisions

### 6-Month Roadmap (Tier 2)
```
┌─────────────────────────────────────────────────────────────────┐
│                     ENHANCED ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Azure Container Apps                         │   │
│  │  Frontend: 0-20 replicas (auto-scale)                    │   │
│  │  Backend: 2-20 replicas (auto-scale)                     │   │
│  │  Celery: 2-10 replicas (queue-based scaling)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────┐     │
│  │  PostgreSQL GP D4s  │    │  Redis Standard C2          │     │
│  │  Read Replicas: 1   │    │  2.5GB Cache               │     │
│  └─────────────────────┘    └─────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Azure CDN for static assets                             │    │
│  │  Application Insights for full observability             │    │
│  │  Azure Key Vault for secrets management                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12-Month Roadmap (Tier 3)
```
┌─────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Multi-Region Deployment                    │     │
│  │  Region 1: East US (Primary)                           │     │
│  │  Region 2: West Europe (DR/Global users)               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────┐     │
│  │  Azure Front Door   │    │  Azure Traffic Manager     │     │
│  │  Global CDN + WAF   │    │  DNS load balancing        │     │
│  └─────────────────────┘    └─────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────┐     │
│  │  PostgreSQL HA      │    │  Redis Premium             │     │
│  │  Zone-redundant     │    │  Geo-replication           │     │
│  │  Auto-failover      │    │  6GB + clustering          │     │
│  └─────────────────────┘    └─────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Service Mesh (Dapr) for microservices communication    │    │
│  │  Azure Monitor + Log Analytics                          │    │
│  │  Azure Defender for security                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Scaling Triggers

| Metric | Current Threshold | Action |
|--------|------------------|--------|
| CPU > 70% | 5 minutes | Add replica |
| Memory > 80% | 5 minutes | Add replica |
| HTTP requests > 1000/min | Immediate | Add replica |
| Queue depth > 100 | Immediate | Add Celery worker |
| Response time > 2s | 10 minutes | Investigate bottleneck |

---

## 9. Security Considerations

### Network Security
```yaml
# Virtual Network Integration (recommended for production)
VNet Configuration:
  - Private endpoints for PostgreSQL
  - Private endpoints for Redis
  - Container Apps in VNet subnet
  - No public access to databases
```

### Secret Management
```bash
# Use Azure Key Vault for all secrets
az keyvault create \
  --name nucleiq-keyvault \
  --resource-group nucleiq-production-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name nucleiq-keyvault \
  --name django-secret-key \
  --value "<your-secret-key>"
```

### Security Checklist

- [ ] Enable Azure Defender for Containers
- [ ] Configure Azure DDoS Protection
- [ ] Enable diagnostic logging for all services
- [ ] Set up Azure Policy for compliance
- [ ] Configure network security groups
- [ ] Enable encryption at rest for all data
- [ ] Enable SSL/TLS enforcement on PostgreSQL
- [ ] Configure IP restrictions on Container Apps (if needed)
- [ ] Set up Azure AD authentication for admin access
- [ ] Enable vulnerability scanning in ACR

---

## 10. Monitoring & Maintenance

### Application Insights Setup
```bash
# Create Application Insights
az monitor app-insights component create \
  --app nucleiq-appinsights \
  --location eastus \
  --resource-group nucleiq-production-rg \
  --application-type web
```

### Log Analytics
```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group nucleiq-production-rg \
  --workspace-name nucleiq-logs \
  --location eastus
```

### Key Metrics to Monitor

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| **Availability** | HTTP 5xx errors | > 1% of requests |
| **Performance** | Response time P95 | > 2 seconds |
| **Database** | Connection pool usage | > 80% |
| **Cache** | Redis memory usage | > 80% |
| **Tasks** | Celery queue depth | > 500 tasks |
| **Resources** | CPU usage | > 85% for 5 min |
| **Resources** | Memory usage | > 90% |

### Backup Strategy

| Component | Backup Frequency | Retention |
|-----------|-----------------|-----------|
| PostgreSQL | Daily (automatic) | 7 days (configurable up to 35) |
| Blob Storage | Soft delete enabled | 14 days |
| Redis | RDB persistence | Every 15 minutes |
| Container Images | Keep last 10 versions | ACR retention policy |

### Maintenance Windows

- **Database Maintenance**: Sunday 2-4 AM UTC
- **Container App Updates**: Auto-deploy with zero-downtime
- **Infrastructure Updates**: Apply Azure patches monthly

---

## Quick Start Checklist

### Pre-Deployment
- [ ] Azure subscription active
- [ ] Domain registered (Hostinger)
- [ ] GitHub repository ready
- [ ] SSL certificates not needed (auto-managed)

### Day 1 Tasks
- [ ] Create Azure Resource Group
- [ ] Create Azure Container Registry
- [ ] Create PostgreSQL Flexible Server
- [ ] Create Azure Cache for Redis
- [ ] Create Azure Blob Storage

### Day 2 Tasks
- [ ] Create Container Apps Environment
- [ ] Build and push Docker images
- [ ] Deploy all Container Apps
- [ ] Run database migrations
- [ ] Verify application health

### Day 3 Tasks
- [ ] Configure custom domains
- [ ] Enable managed SSL certificates
- [ ] Configure Hostinger DNS records
- [ ] Verify SSL certificates active

### Day 4 Tasks
- [ ] Set up GitHub Actions
- [ ] Configure secrets in GitHub
- [ ] Test deployment pipeline
- [ ] Configure monitoring alerts

---

## Support & Resources

- **Azure Documentation**: https://docs.microsoft.com/azure/container-apps
- **GitHub Actions**: https://docs.github.com/actions
- **Django Deployment**: https://docs.djangoproject.com/en/5.1/howto/deployment/
- **Sentry (Error Tracking)**: https://sentry.io/for/django/

---

**Document Version**: 1.0  
**Created**: January 2026  
**Author**: NucleiQ DevOps Team  
**Review Date**: Quarterly
