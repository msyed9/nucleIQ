# ☁️ Cloud Deployment Guide - nucleIQ

## Complete Comparison: Azure vs GCP vs AWS

---

## 📊 Quick Comparison

| Feature | Azure (Student) | **GCP (Cloud Run)** | AWS (Fargate) |
|---------|-----------------|---------------------|---------------|
| **Free Credits** | $100 | **$300** | $300 |
| **Credit Duration** | 12 months | 90 days | 12 months |
| **Scale to Zero** | ❌ No | ✅ **Yes** | ❌ No |
| **Min Cost/Month** | ~$25 | **~$0-5** | ~$30 |
| **When Idle** | Still pay | **$0** | Still pay |
| **Setup Complexity** | Medium | Easy | Complex |
| **Best For** | Enterprise | **Students/Startups** | Large scale |

---

## 🏆 Recommendation

### For Student Credits: **Google Cloud Run**

**Why GCP Cloud Run is Best:**

1. **$300 Free Credits** (most generous)
2. **Scale to Zero** = $0 when no traffic
3. **2 Million FREE requests/month** (always free tier)
4. **Simple Deployment** - just push Docker image
5. **Auto HTTPS** - free SSL certificates

### Monthly Cost Breakdown

```
Low Traffic (learning/demo):
├── Cloud Run:         $0-5/month (scale to zero)
├── Artifact Registry: ~$0.10
├── Cloud Storage:     ~$1 (optional)
└── Total:             $1-6/month → $300 lasts 50+ months!

Medium Traffic (small school):
├── Cloud Run:         $10-15/month
├── Cloud SQL:         $10/month (optional)
├── Cloud Storage:     ~$2/month
└── Total:             $12-27/month → $300 lasts 11+ months
```

---

## 📁 Files Created

### Azure Files
```
azure/
├── setup-azure-resources.ps1      # Full production setup
├── setup-azure-student.ps1        # Student credits optimized
├── containerapp-backend.yaml      # Backend config
└── containerapp-frontend.yaml     # Frontend config

.github/workflows/
├── azure-deploy.yml               # Production CI/CD
└── azure-deploy-student.yml       # Student CI/CD

deploy/student/
├── nginx.conf                     # Nginx config
├── supervisord.conf               # Process manager
└── entrypoint.sh                  # Startup script

Dockerfile.student                  # All-in-one container
docker-compose.student.yml          # Local testing
backend/config/settings/student.py  # Django settings
```

### GCP Files
```
gcp/
└── setup-gcp.ps1                  # GCP setup script

.github/workflows/
└── gcp-cloudrun-deploy.yml        # Cloud Run CI/CD

deploy/gcp/
├── nginx.conf                     # Nginx config
├── supervisord.conf               # Process manager
└── entrypoint.sh                  # Startup script

Dockerfile.cloudrun                 # Cloud Run optimized
backend/config/settings/cloudrun.py # Django settings
```

---

## 🚀 Quick Start Guides

### Option A: Google Cloud Run (Recommended) ⭐

**Prerequisites:**
```powershell
# Install Google Cloud SDK
winget install Google.CloudSDK

# Login
gcloud auth login
```

**Setup:**
```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Run setup script
.\gcp\setup-gcp.ps1
```

**Add GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Your project ID |
| `GCP_SA_KEY` | Service account JSON |
| `SECRET_KEY` | Django secret |
| `DATABASE_URL` | (optional) Cloud SQL |
| `GCS_BUCKET_NAME` | (optional) Storage |

**Deploy:**
```powershell
git add .
git commit -m "Add GCP deployment"
git push origin main
```

App will be live at: `https://nucleiq-xxxxx.run.app`

---

### Option B: Azure Student Tier

**Prerequisites:**
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login
az login
```

**Setup:**
```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Run setup script
.\azure\setup-azure-student.ps1
```

**Add GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Service principal JSON |
| `ACR_LOGIN_SERVER` | Container registry URL |
| `ACR_USERNAME` | Registry username |
| `ACR_PASSWORD` | Registry password |
| `SECRET_KEY` | Django secret |

**Deploy:**
```powershell
git add .
git commit -m "Add Azure deployment"
git push origin main
```

---

## 💡 Additional Tips for Students

### 1. Get Free Credits

| Provider | Credits | How to Get |
|----------|---------|------------|
| GCP | $300 | New account signup |
| Azure | $100 | Student email verification |
| GitHub Education | Various | https://education.github.com/pack |
| MongoDB Atlas | 512MB | Free tier forever |

### 2. Cost Monitoring

**GCP:**
```powershell
# Set budget alert
gcloud billing budgets create --billing-account=BILLING_ID --budget-amount=50USD
```

**Azure:**
```powershell
# View current spend
az consumption usage list --query "[].{Name:instanceName, Cost:pretaxCost}"
```

### 3. Data Persistence Options

| Option | Cost | Recommendation |
|--------|------|----------------|
| SQLite in container | FREE | Demo only (data lost on restart) |
| Cloud SQL/PostgreSQL | ~$10/mo | Small production |
| Firestore | FREE tier | NoSQL alternative |
| Supabase | FREE tier | PostgreSQL + Auth included |

### 4. Free Alternatives for Services

| Service | Paid Option | Free Alternative |
|---------|-------------|------------------|
| PostgreSQL | Cloud SQL | Supabase, Railway, Neon |
| Redis | Managed Redis | Upstash (free tier) |
| Email | SendGrid | Gmail SMTP (500/day) |
| Storage | Cloud Storage | Cloudinary (free tier) |

---

## 🔧 Troubleshooting

### Cloud Run Issues

**Cold Start Too Slow:**
```yaml
# Set minimum instances (costs more but faster)
gcloud run deploy nucleiq --min-instances=1
```

**Container Crashes:**
```powershell
# View logs
gcloud run services logs read nucleiq --limit=50
```

**504 Gateway Timeout:**
```yaml
# Increase timeout
gcloud run deploy nucleiq --timeout=600
```

### Azure Issues

**Container Keeps Restarting:**
```powershell
# View logs
az container logs --name nucleiq-app --resource-group nucleiq-student-rg
```

**Out of Memory:**
```powershell
# Increase memory
az container create ... --memory 4
```

---

## 📱 Mobile App Considerations

If you plan to add the React Native mobile app:

1. **Backend URL:** Use Cloud Run URL as API endpoint
2. **WebSockets:** Cloud Run supports WebSockets (need min-instances=1)
3. **Push Notifications:** Use Firebase Cloud Messaging (free)

---

## 🎯 Final Recommendation

Given that you're using **student credits**, here's my recommendation:

### Start with GCP Cloud Run

1. **$300 credits** lasts longer than Azure's $100
2. **Scale to zero** means you pay $0 when not using
3. **Automatic HTTPS** included
4. **Simpler setup** than Azure

### Migration Path

```
Phase 1 (Learning/Demo):
├── GCP Cloud Run (scale to zero)
├── SQLite in container (ephemeral)
└── Cost: ~$0-5/month

Phase 2 (Small Production):
├── GCP Cloud Run
├── Cloud SQL PostgreSQL
├── Cloud Storage for media
└── Cost: ~$15-25/month

Phase 3 (Growing):
├── Multiple Cloud Run services
├── Cloud SQL (larger instance)
├── CDN for static files
└── Cost: ~$50-100/month
```

---

## ❓ Need Help?

- **GCP Documentation:** https://cloud.google.com/run/docs
- **Azure Documentation:** https://docs.microsoft.com/azure/container-apps
- **Community Support:** https://stackoverflow.com/questions/tagged/google-cloud-run

---

*Last Updated: February 2026*
