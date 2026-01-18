# NucleiQ Production Deployment - Quick Start Guide
## Deploy to Azure Container Apps in 4 Steps

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Azure CLI** installed ([Download](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- [ ] **Docker Desktop** installed and running
- [ ] **Git** repository set up (GitHub)
- [ ] **Hostinger** account with domain `nucleiq.io`

---

## Step 1: Create Azure Account & Install CLI

### 1.1 Create Azure Account
1. Go to https://azure.microsoft.com/free/
2. Sign up for a free account (includes $200 credit for 30 days)
3. Complete verification

### 1.2 Install Azure CLI (Windows)
```powershell
# Using winget
winget install -e --id Microsoft.AzureCLI

# Verify installation
az --version
```

### 1.3 Login to Azure
```powershell
# Login (opens browser)
az login

# Set default subscription (if you have multiple)
az account list --output table
az account set --subscription "<your-subscription-id>"
```

---

## Step 2: Run Infrastructure Setup

### Option A: PowerShell (Windows)
```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Run the setup script
.\scripts\azure-setup.ps1
```

### Option B: Bash (Git Bash / WSL)
```bash
cd /c/ECOLAB-ETS/RnD/nucleIQ

# Make script executable
chmod +x scripts/azure-setup.sh

# Run the setup script
./scripts/azure-setup.sh
```

### What This Creates:
- Resource Group: `nucleiq-production-rg`
- Container Registry: `nucleiqacr`
- PostgreSQL Server: `nucleiq-db-server`
- Redis Cache: `nucleiq-redis`
- Storage Account: `nucleiqstorage`
- Container Apps Environment: `nucleiq-production`
- Key Vault: `nucleiq-keyvault`

**⏱️ Time Required: ~20-30 minutes**

---

## Step 3: Configure GitHub Secrets

After the setup script completes, it will output credentials. Add these to GitHub:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | JSON output from setup script |
| `ACR_USERNAME` | `nucleiqacr` |
| `ACR_PASSWORD` | Password from setup script |

### Getting Secrets If You Missed Them:
```powershell
# Get ACR credentials
az acr credential show --name nucleiqacr

# Get Service Principal credentials
az keyvault secret show --vault-name nucleiq-keyvault --name github-sp-credentials --query value -o tsv
```

---

## Step 4: Deploy Containers

### First-Time Manual Deployment
```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Run the deployment script
.\scripts\deploy-containers.ps1
```

### Subsequent Deployments via GitHub (Automatic)
After the first deployment, every push to `main` or `production` branch will automatically deploy.

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

**⏱️ Time Required: ~10-15 minutes**

---

## Step 5: Configure Custom Domain

### 5.1 Get Verification ID
```powershell
az containerapp show --name nucleiq-frontend --resource-group nucleiq-production-rg --query "properties.customDomainVerificationId" -o tsv
```

### 5.2 Configure Hostinger DNS
1. Login to Hostinger hPanel
2. Go to **Domains** → **nucleiq.io** → **DNS Zone**
3. Add these records:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | `nucleiq-frontend.xxx.centralindia.azurecontainerapps.io` |
| CNAME | api | `nucleiq-backend.xxx.centralindia.azurecontainerapps.io` |
| TXT | asuid | `<verification-id>` |
| TXT | asuid.www | `<verification-id>` |
| TXT | asuid.api | `<verification-id>` |

### 5.3 Bind Custom Domains
Wait 5-10 minutes for DNS propagation, then:
```powershell
# Bind frontend
az containerapp hostname add --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io
az containerapp hostname bind --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io --validation-method CNAME

# Bind backend
az containerapp hostname add --name nucleiq-backend --resource-group nucleiq-production-rg --hostname api.nucleiq.io
az containerapp hostname bind --name nucleiq-backend --resource-group nucleiq-production-rg --hostname api.nucleiq.io --validation-method CNAME
```

---

## Verification

### Test URLs
```powershell
# Test frontend
curl https://www.nucleiq.io

# Test API health
curl https://api.nucleiq.io/api/health/
```

### Check Container Status
```powershell
# List all containers
az containerapp list --resource-group nucleiq-production-rg --output table

# View backend logs
az containerapp logs show --name nucleiq-backend --resource-group nucleiq-production-rg --follow

# View frontend logs
az containerapp logs show --name nucleiq-frontend --resource-group nucleiq-production-rg --follow
```

---

## Cost Monitoring

### View Current Costs
```powershell
# View costs for the resource group
az consumption usage list --resource-group nucleiq-production-rg --start-date 2026-01-01 --end-date 2026-01-31 --output table
```

### Set Budget Alerts
1. Go to Azure Portal
2. Search for "Cost Management + Billing"
3. Click "Budgets" → "Add"
4. Set a monthly budget (e.g., $100)
5. Configure email alerts at 50%, 80%, 100%

---

## Troubleshooting

### Container Not Starting
```powershell
# View container logs
az containerapp logs show --name nucleiq-backend --resource-group nucleiq-production-rg --type system

# View revision status
az containerapp revision list --name nucleiq-backend --resource-group nucleiq-production-rg --output table
```

### Database Connection Failed
```powershell
# Test database connectivity
az postgres flexible-server show --name nucleiq-db-server --resource-group nucleiq-production-rg

# Check firewall rules
az postgres flexible-server firewall-rule list --name nucleiq-db-server --resource-group nucleiq-production-rg
```

### SSL Certificate Issues
```powershell
# Check certificate status
az containerapp hostname list --name nucleiq-frontend --resource-group nucleiq-production-rg

# Re-bind certificate
az containerapp hostname delete --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io
az containerapp hostname add --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io
az containerapp hostname bind --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io --validation-method CNAME
```

---

## Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-production.yml` | Production CI/CD workflow |
| `.github/workflows/deploy-staging.yml` | Staging CI/CD workflow |
| `.github/workflows/security-scan.yml` | Security scanning workflow |
| `scripts/azure-setup.sh` | Bash infrastructure setup |
| `scripts/azure-setup.ps1` | PowerShell infrastructure setup |
| `scripts/deploy-containers.sh` | Bash container deployment |
| `scripts/deploy-containers.ps1` | PowerShell container deployment |
| `scripts/setup-custom-domains.sh` | Custom domain configuration |
| `backend/.env.prod.example` | Production environment template |
| `AZURE_DEPLOYMENT_PLAN.md` | Detailed deployment documentation |
| `HOSTINGER_DNS_SETUP.md` | DNS configuration guide |
| `QUICK_START_DEPLOYMENT.md` | This quick start guide |

---

## Support Resources

- **Azure Documentation**: https://docs.microsoft.com/azure/container-apps
- **GitHub Actions**: https://docs.github.com/actions
- **Azure Support**: https://azure.microsoft.com/support
- **Hostinger Support**: https://www.hostinger.com/support

---

**Created**: January 2026  
**Domain**: nucleiq.io  
**Region**: Central India  
**Estimated Monthly Cost**: ~$80-105 (Startup Tier)
