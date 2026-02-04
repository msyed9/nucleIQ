# 🚀 nucleIQ Azure Deployment Guide

## Complete Step-by-Step Guide for Docker Container Deployment

This guide walks you through deploying nucleIQ to Azure using Docker containers with GitHub CI/CD integration.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Azure Account Setup](#2-azure-account-setup)
3. [Install Required Tools](#3-install-required-tools)
4. [Azure Resource Creation](#4-azure-resource-creation)
5. [GitHub Configuration](#5-github-configuration)
6. [Test Local Docker Build](#6-test-local-docker-build)
7. [Deploy to Azure](#7-deploy-to-azure)
8. [Post-Deployment Setup](#8-post-deployment-setup)
9. [Custom Domain Setup](#9-custom-domain-setup)
10. [Monitoring & Troubleshooting](#10-monitoring--troubleshooting)
11. [Cost Estimation](#11-cost-estimation)

---

## 1. Prerequisites

### What You Need Before Starting:

- [ ] GitHub account with your nucleIQ repository
- [ ] Credit/Debit card for Azure account verification (you get $200 free credits)
- [ ] Windows 10/11 computer
- [ ] At least 4GB free disk space for Docker

---

## 2. Azure Account Setup

### Step 2.1: Create Azure Account

1. Open your browser and go to: **https://portal.azure.com**

2. Click **"Start free"** or **"Create one"**

3. Sign up with:
   - Your email address (can use existing Microsoft/Gmail/any email)
   - Create a password
   - Enter your name, date of birth, country

4. **Phone Verification:**
   - Enter your phone number
   - You'll receive an SMS or call with a verification code
   - Enter the code

5. **Payment Verification:**
   - Enter credit/debit card details
   - **Note:** You won't be charged - this is just for identity verification
   - You get **$200 free credits** for 30 days
   - After that, you only pay for what you use (pay-as-you-go)

6. **Agree to terms** and click **Sign up**

7. You'll be redirected to the **Azure Portal** dashboard

### Step 2.2: Understand Azure Portal

The Azure Portal is your control center. Key areas:
- **Home**: Quick access to recent resources
- **Search bar** (top): Find any Azure service by name
- **Resource groups**: Containers for organizing your resources
- **Create a resource**: Start creating new services

---

## 3. Install Required Tools

Open **PowerShell as Administrator** (Right-click PowerShell → Run as Administrator)

### Step 3.1: Install Azure CLI

```powershell
# Install Azure CLI using winget
winget install Microsoft.AzureCLI

# Close and reopen PowerShell, then verify installation
az --version
```

Expected output shows version like `azure-cli 2.xx.x`

### Step 3.2: Install Docker Desktop

```powershell
# Install Docker Desktop
winget install Docker.DockerDesktop
```

After installation:
1. **Restart your computer**
2. Open **Docker Desktop** from Start menu
3. Accept the license agreement
4. Choose **"Use recommended settings"**
5. Wait for Docker to start (icon in system tray turns green)
6. Verify in PowerShell:
   ```powershell
   docker --version
   # Expected: Docker version 24.x.x or similar
   ```

### Step 3.3: Login to Azure CLI

```powershell
# Login to Azure (opens browser)
az login
```

1. A browser window opens
2. Select your Azure account
3. If prompted, authenticate
4. Close the browser when it says "You have logged in"
5. PowerShell shows your subscription details

```powershell
# Verify login (shows your subscriptions)
az account list --output table

# If you have multiple subscriptions, set the one to use
az account set --subscription "Your Subscription Name"
```

---

## 4. Azure Resource Creation

### Option A: Automated Setup (Recommended)

We've created a PowerShell script that automates everything:

```powershell
# Navigate to your project
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Run the setup script
.\azure\setup-azure-resources.ps1
```

This script will:
1. Create a Resource Group
2. Create Azure Container Registry (stores your Docker images)
3. Create PostgreSQL Database
4. Create Redis Cache
5. Create Storage Account (for media files)
6. Create Container Apps Environment
7. Generate all the secrets you need for GitHub

**Save the output!** It contains all the secrets you'll need.

### Option B: Manual Setup (Step by Step)

If you prefer to understand each step:

#### Step 4.1: Create Resource Group

A Resource Group is like a folder that contains all related resources.

```powershell
# Create resource group in East US region
az group create --name nucleiq-rg --location eastus
```

#### Step 4.2: Create Azure Container Registry (ACR)

ACR is like Docker Hub but private for your images.

```powershell
# Create the registry (name must be unique globally, lowercase, no dashes)
az acr create `
    --resource-group nucleiq-rg `
    --name nucleiqacr `
    --sku Basic `
    --admin-enabled true

# Get the login credentials (SAVE THESE!)
az acr credential show --name nucleiqacr
```

Output looks like:
```json
{
  "username": "nucleiqacr",
  "passwords": [
    { "name": "password", "value": "xxxxxxxxxxxxxxxxxxxx" },
    { "name": "password2", "value": "xxxxxxxxxxxxxxxxxxxx" }
  ]
}
```

**Save these values:**
- ACR_LOGIN_SERVER: `nucleiqacr.azurecr.io`
- ACR_USERNAME: `nucleiqacr`
- ACR_PASSWORD: The password value

#### Step 4.3: Create PostgreSQL Database

```powershell
# Create PostgreSQL server (this takes 5-10 minutes)
az postgres flexible-server create `
    --resource-group nucleiq-rg `
    --name nucleiq-db-server `
    --location eastus `
    --admin-user nucleiqadmin `
    --admin-password "YourSecurePassword123!" `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 16 `
    --yes

# Create the database
az postgres flexible-server db create `
    --resource-group nucleiq-rg `
    --server-name nucleiq-db-server `
    --database-name nucleiq

# Allow Azure services to connect
az postgres flexible-server firewall-rule create `
    --resource-group nucleiq-rg `
    --name nucleiq-db-server `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0
```

**Save the connection string:**
```
DATABASE_URL=postgresql://nucleiqadmin:YourSecurePassword123!@nucleiq-db-server.postgres.database.azure.com:5432/nucleiq?sslmode=require
```

#### Step 4.4: Create Redis Cache

```powershell
# Create Redis (this takes 10-20 minutes)
az redis create `
    --resource-group nucleiq-rg `
    --name nucleiq-redis `
    --location eastus `
    --sku Basic `
    --vm-size c0 `
    --redis-version 6

# After creation, get the access key
az redis list-keys --resource-group nucleiq-rg --name nucleiq-redis
```

**Save the Redis URL:**
```
REDIS_URL=rediss://:YOUR_PRIMARY_KEY@nucleiq-redis.redis.cache.windows.net:6380/0
```

Note: `rediss://` (with double s) means SSL connection on port 6380.

#### Step 4.5: Create Storage Account

```powershell
# Create storage account (name must be globally unique, lowercase, no dashes)
az storage account create `
    --resource-group nucleiq-rg `
    --name nucleiqstorage `
    --location eastus `
    --sku Standard_LRS `
    --kind StorageV2

# Create containers for media and static files
az storage container create --account-name nucleiqstorage --name media --public-access blob
az storage container create --account-name nucleiqstorage --name static --public-access blob

# Get the access key
az storage account keys list --resource-group nucleiq-rg --account-name nucleiqstorage
```

**Save:**
- AZURE_STORAGE_ACCOUNT_NAME: `nucleiqstorage`
- AZURE_STORAGE_ACCOUNT_KEY: The key from the output

#### Step 4.6: Create Container Apps Environment

```powershell
# Create the environment (this is where your containers will run)
az containerapp env create `
    --resource-group nucleiq-rg `
    --name nucleiq-env `
    --location eastus
```

---

## 5. GitHub Configuration

### Step 5.1: Create Azure Service Principal

This allows GitHub to deploy to Azure.

```powershell
# Get your subscription ID
$subscriptionId = az account show --query id -o tsv

# Create service principal
az ad sp create-for-rbac `
    --name "nucleiq-github-actions" `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/nucleiq-rg" `
    --sdk-auth
```

**Copy the entire JSON output** - this is your `AZURE_CREDENTIALS` secret.

### Step 5.2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** (tab at the top)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**

Add each of these secrets:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | The entire JSON from service principal creation |
| `ACR_LOGIN_SERVER` | `nucleiqacr.azurecr.io` |
| `ACR_USERNAME` | `nucleiqacr` |
| `ACR_PASSWORD` | The password from ACR credentials |
| `DATABASE_URL` | `postgresql://nucleiqadmin:PASSWORD@nucleiq-db-server.postgres.database.azure.com:5432/nucleiq?sslmode=require` |
| `REDIS_URL` | `rediss://:KEY@nucleiq-redis.redis.cache.windows.net:6380/0` |
| `SECRET_KEY` | Generate a random 50-character string |
| `ALLOWED_HOSTS` | `*.azurecontainerapps.io,nucleiq.io` |
| `CORS_ALLOWED_ORIGINS` | `https://*.azurecontainerapps.io` |
| `AZURE_STORAGE_ACCOUNT_NAME` | `nucleiqstorage` |
| `AZURE_STORAGE_ACCOUNT_KEY` | Your storage key |
| `VITE_API_URL` | `https://nucleiq-backend.YOUR_REGION.azurecontainerapps.io/api` |
| `VITE_WS_URL` | `wss://nucleiq-backend.YOUR_REGION.azurecontainerapps.io/ws` |

**Generate a secret key:**
```powershell
# Run this to generate a random secret key
$chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
-join (1..50 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
```

---

## 6. Test Local Docker Build

Before deploying, let's verify Docker builds work locally.

### Step 6.1: Build Backend Image

```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Build backend image
docker build -t nucleiq-backend:local -f backend/Dockerfile --target production backend/

# Check if build succeeded
docker images | Select-String nucleiq-backend
```

### Step 6.2: Build Frontend Image

```powershell
# Build frontend image
docker build -t nucleiq-frontend:local -f frontend/Dockerfile --target production frontend/

# Check images
docker images | Select-String nucleiq
```

### Step 6.3: Test Locally with Docker Compose

```powershell
# Start all services locally
docker-compose up -d

# Check running containers
docker ps

# View logs if needed
docker logs nucleiq_backend -f

# Stop all services
docker-compose down
```

---

## 7. Deploy to Azure

### Step 7.1: Push Code to GitHub

If you haven't already:

```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Azure deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/nucleiq.git

# Push
git push -u origin main
```

### Step 7.2: Trigger Deployment

The GitHub Action will automatically run when you push to `main` branch.

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see "Deploy to Azure" workflow running
4. Click on it to watch progress

### Step 7.3: Manual Deployment (Alternative)

You can also trigger deployment manually:

1. Go to **Actions** tab
2. Click **Deploy to Azure** on the left
3. Click **Run workflow** button
4. Select branch and environment
5. Click **Run workflow**

---

## 8. Post-Deployment Setup

### Step 8.1: Get Your Application URLs

```powershell
# Get backend URL
az containerapp show `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --query properties.configuration.ingress.fqdn `
    -o tsv

# Get frontend URL
az containerapp show `
    --name nucleiq-frontend `
    --resource-group nucleiq-rg `
    --query properties.configuration.ingress.fqdn `
    -o tsv
```

### Step 8.2: Create Superuser

```powershell
# Connect to backend container
az containerapp exec `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --command "python manage.py createsuperuser"
```

### Step 8.3: Run Migrations (if not done automatically)

```powershell
az containerapp exec `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --command "python manage.py migrate"
```

### Step 8.4: Update Frontend API URL

After deployment, update the `VITE_API_URL` and `VITE_WS_URL` GitHub secrets with the actual backend URL, then redeploy the frontend.

---

## 9. Custom Domain Setup

### Step 9.1: Add Custom Domain

1. Go to **Azure Portal** → Your Container App
2. Click **Custom domains**
3. Click **Add custom domain**
4. Enter your domain (e.g., `app.nucleiq.io`)
5. Follow DNS verification steps

### Step 9.2: DNS Configuration

Add these DNS records with your domain registrar:

For frontend (`app.nucleiq.io`):
```
Type: CNAME
Name: app
Value: nucleiq-frontend.<random>.azurecontainerapps.io
```

For API (`api.nucleiq.io`):
```
Type: CNAME
Name: api
Value: nucleiq-backend.<random>.azurecontainerapps.io
```

### Step 9.3: Enable HTTPS

Azure automatically provides free SSL certificates for custom domains once DNS is properly configured.

---

## 10. Monitoring & Troubleshooting

### View Logs

```powershell
# View backend logs
az containerapp logs show `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --follow

# View frontend logs
az containerapp logs show `
    --name nucleiq-frontend `
    --resource-group nucleiq-rg `
    --follow
```

### Check Container Status

```powershell
# Get container app status
az containerapp show `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --query properties.runningStatus
```

### Common Issues

**Issue: Container keeps restarting**
- Check logs for errors
- Verify environment variables are set correctly
- Ensure database connection is working

**Issue: 500 Internal Server Error**
- Check if migrations ran successfully
- Verify SECRET_KEY is set
- Check database connectivity

**Issue: CORS errors in browser**
- Verify CORS_ALLOWED_ORIGINS includes your frontend URL
- Check ALLOWED_HOSTS includes your domain

### Debug Database Connection

```powershell
az containerapp exec `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --command "python -c \"import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('Database OK')\""
```

---

## 11. Cost Estimation

### Monthly Costs (Approximate)

| Service | SKU | Cost/Month |
|---------|-----|------------|
| Container Apps (Backend) | 0.5 vCPU, 1GB RAM | ~$20-40 |
| Container Apps (Frontend) | 0.25 vCPU, 0.5GB RAM | ~$10-20 |
| Container Apps (Celery) | 0.5 vCPU, 1GB RAM | ~$20-40 |
| PostgreSQL | Burstable B1ms | ~$15-25 |
| Redis | Basic C0 | ~$16 |
| Container Registry | Basic | ~$5 |
| Storage | Standard LRS (10GB) | ~$1-2 |
| **Total** | | **~$87-148/month** |

### Cost Optimization Tips

1. **Use spot instances** for development environments
2. **Scale down** during off-hours
3. **Set up budget alerts** in Azure Portal
4. **Use consumption plan** for Container Apps (pay only when running)

---

## Quick Reference Commands

```powershell
# Login to Azure
az login

# List your container apps
az containerapp list --resource-group nucleiq-rg --output table

# Scale a container app
az containerapp update `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --min-replicas 1 `
    --max-replicas 5

# Restart a container app
az containerapp revision restart `
    --name nucleiq-backend `
    --resource-group nucleiq-rg `
    --revision nucleiq-backend--xxxxx

# Delete all resources (BE CAREFUL!)
az group delete --name nucleiq-rg --yes --no-wait
```

---

## Need Help?

- **Azure Documentation**: https://docs.microsoft.com/azure/container-apps/
- **Docker Documentation**: https://docs.docker.com/
- **GitHub Actions Documentation**: https://docs.github.com/actions

---

*Last Updated: February 2026*
