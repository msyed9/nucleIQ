# 🚀 Complete GCP Registration & Deployment Guide for nucleIQ

## Step-by-Step Guide: From Zero to Deployed Application

---

## Table of Contents

1. [Create Google Cloud Account](#part-1-create-google-cloud-account)
2. [Install Required Tools](#part-2-install-required-tools)
3. [Set Up GCP Project](#part-3-set-up-gcp-project)
4. [Configure GitHub Repository](#part-4-configure-github-repository)
5. [Deploy to Cloud Run](#part-5-deploy-to-cloud-run)
6. [Post-Deployment Setup](#part-6-post-deployment-setup)
7. [Access Your Application](#part-7-access-your-application)

---

## Part 1: Create Google Cloud Account

### Step 1.1: Go to Google Cloud Console

1. Open your browser and go to: **https://cloud.google.com**

2. Click the **"Get started for free"** button (top right)

   ![Get Started Button](https://cloud.google.com/static/images/cloud-console-button.png)

### Step 1.2: Sign in with Google Account

1. **Use existing Google account** or **Create new one**
   - If you have Gmail, use that email
   - Enter your email and password

2. If creating new account:
   - Click "Create account"
   - Choose "For myself"
   - Fill in your name, email preference, password
   - Verify with phone number

### Step 1.3: Accept Terms & Verify Identity

1. **Read and accept** Google Cloud Terms of Service
2. **Select your country** (India)
3. Click **"Agree and Continue"**

### Step 1.4: Set Up Billing (Required for Free Credits)

**IMPORTANT:** You need a credit/debit card but WON'T BE CHARGED!

1. **Account type:** Select "Individual"

2. **Name and address:**
   - Enter your full name
   - Enter your address
   - City, State, PIN code

3. **Payment method:**
   - Enter credit/debit card details
   - Google will do a small verification charge (₹0-2) that's refunded
   - **You get $300 (₹25,000+) FREE credits!**

4. **Answer survey questions:**
   - What describes you best: "Student"
   - What will you use GCP for: "Personal projects"

5. Click **"Start my free trial"**

### Step 1.5: Verify You Got Free Credits

1. After signup, you'll see the Google Cloud Console
2. Look for **"Free trial status"** in the top bar
3. It should show: **"$300 credit, 90 days remaining"**

✅ **Congratulations! You now have $300 in free credits!**

---

## Part 2: Install Required Tools

### Step 2.1: Install Google Cloud SDK (gcloud CLI)

Open **PowerShell as Administrator** and run:

```powershell
# Option 1: Using winget (recommended)
winget install Google.CloudSDK

# Option 2: Manual download
# Go to: https://cloud.google.com/sdk/docs/install
# Download and run the installer
```

**After installation:**
1. Close and reopen PowerShell
2. Verify installation:
```powershell
gcloud --version
```

Expected output:
```
Google Cloud SDK 4xx.x.x
...
```

### Step 2.2: Install Docker Desktop

```powershell
winget install Docker.DockerDesktop
```

**After installation:**
1. **Restart your computer**
2. Open Docker Desktop
3. Accept the license agreement
4. Wait for Docker to start (system tray icon turns green)

Verify:
```powershell
docker --version
```

### Step 2.3: Login to Google Cloud

```powershell
# Login - this opens your browser
gcloud auth login
```

1. Browser opens automatically
2. Select your Google account
3. Click **"Allow"** to grant permissions
4. You'll see "You are now authenticated"
5. Close the browser tab

Verify login:
```powershell
gcloud auth list
```

Should show your email with `ACTIVE` status.

---

## Part 3: Set Up GCP Project

### Step 3.1: Create a New Project

```powershell
# Create project (name must be unique globally)
$PROJECT_ID = "nucleiq-$(Get-Random -Maximum 9999)"
gcloud projects create $PROJECT_ID --name="nucleIQ"

# Set as default project
gcloud config set project $PROJECT_ID

# Verify
gcloud config get-value project
```

### Step 3.2: Enable Billing for Project

```powershell
# List your billing accounts
gcloud billing accounts list

# Link billing to project (copy the ACCOUNT_ID from above)
gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID
```

**Alternative (via Console):**
1. Go to: https://console.cloud.google.com/billing
2. Click on your project
3. Click "Link a billing account"
4. Select your billing account
5. Click "Set Account"

### Step 3.3: Enable Required APIs

```powershell
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Artifact Registry (for Docker images)
gcloud services enable artifactregistry.googleapis.com

# Enable Cloud Build
gcloud services enable cloudbuild.googleapis.com
```

Wait for each to complete (10-30 seconds each).

### Step 3.4: Create Artifact Registry Repository

This is where your Docker images will be stored:

```powershell
$REGION = "asia-south1"  # Mumbai - closest to India

gcloud artifacts repositories create nucleiq `
    --repository-format=docker `
    --location=$REGION `
    --description="nucleIQ Docker images"
```

### Step 3.5: Create Service Account for GitHub

This allows GitHub Actions to deploy to GCP:

```powershell
# Create service account
gcloud iam service-accounts create github-deploy `
    --display-name="GitHub Actions Deployment"

# Get the email
$SA_EMAIL = "github-deploy@$PROJECT_ID.iam.gserviceaccount.com"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create gcp-key.json `
    --iam-account=$SA_EMAIL

# View the key (you'll need this for GitHub)
Get-Content gcp-key.json
```

**IMPORTANT:** Save the content of `gcp-key.json` - you'll need it for GitHub!

---

## Part 4: Configure GitHub Repository

### Step 4.1: Push Your Code to GitHub

If your code isn't on GitHub yet:

```powershell
cd c:\ECOLAB-ETS\RnD\nucleIQ

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with GCP deployment"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/nucleiq.git
git push -u origin main
```

### Step 4.2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **"New repository secret"**

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `GCP_PROJECT_ID` | Your project ID | Run: `gcloud config get-value project` |
| `GCP_SA_KEY` | Service account JSON | Content of `gcp-key.json` file |
| `SECRET_KEY` | Random 50 characters | See below |

**Generate SECRET_KEY:**
```powershell
# Generate random secret key
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})
```

Copy the output and add as `SECRET_KEY` secret.

### Step 4.3: Verify Secrets Added

Go to: `Your Repo → Settings → Secrets → Actions`

You should see:
- ✅ GCP_PROJECT_ID
- ✅ GCP_SA_KEY
- ✅ SECRET_KEY

---

## Part 5: Deploy to Cloud Run

### Step 5.1: Trigger Deployment

**Option A: Push code (automatic)**
```powershell
git add .
git commit -m "Deploy to Cloud Run"
git push origin main
```

**Option B: Manual trigger**
1. Go to GitHub → Your repo → **Actions** tab
2. Click **"Deploy to Google Cloud Run"** in left sidebar
3. Click **"Run workflow"** button
4. Select branch: `main`
5. Click **"Run workflow"**

### Step 5.2: Monitor Deployment

1. Go to **Actions** tab on GitHub
2. Click on the running workflow
3. Watch the progress:
   - ✅ Checkout code
   - ✅ Authenticate to Google Cloud
   - ✅ Build Docker image
   - ✅ Push to Artifact Registry
   - ✅ Deploy to Cloud Run

This takes about **5-10 minutes** for first deployment.

### Step 5.3: Handle Common Errors

**Error: "Permission denied"**
```powershell
# Re-grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/run.admin"
```

**Error: "Billing not enabled"**
- Go to: https://console.cloud.google.com/billing
- Link your project to billing account

**Error: "API not enabled"**
```powershell
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## Part 6: Post-Deployment Setup

### Step 6.1: Get Your Application URL

After successful deployment, get your URL:

```powershell
gcloud run services describe nucleiq --region=asia-south1 --format="value(status.url)"
```

Output will be something like:
```
https://nucleiq-abc123xyz-el.a.run.app
```

### Step 6.2: Test Your Application

1. Open the URL in your browser
2. You should see the nucleIQ login page
3. Check the API health:
   ```
   https://YOUR_URL/api/health/
   ```

### Step 6.3: Create Admin User

For the first time, you need to create a superuser:

```powershell
# Connect to Cloud Run instance
gcloud run services update nucleiq `
    --region=asia-south1 `
    --command="/bin/bash" `
    --args="-c,cd /app/backend && python manage.py createsuperuser"
```

**Alternative: Run migration job**
```powershell
# Deploy a one-time job to create superuser
gcloud run jobs create nucleiq-setup `
    --image=asia-south1-docker.pkg.dev/$PROJECT_ID/nucleiq/nucleiq-app:latest `
    --region=asia-south1 `
    --execute-now `
    --command="python" `
    --args="manage.py,createsuperuser,--noinput,--email=admin@nucleiq.io"
```

### Step 6.4: Add Persistent Database (Optional but Recommended)

For production use, add Cloud SQL PostgreSQL:

```powershell
# Create Cloud SQL instance (~$10/month)
gcloud sql instances create nucleiq-db `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=asia-south1 `
    --root-password="YourSecurePassword123!"

# Create database
gcloud sql databases create nucleiq --instance=nucleiq-db

# Get connection name
gcloud sql instances describe nucleiq-db --format="value(connectionName)"
```

Then add `DATABASE_URL` to your GitHub secrets:
```
postgresql://postgres:YourSecurePassword123!@/nucleiq?host=/cloudsql/PROJECT_ID:asia-south1:nucleiq-db
```

---

## Part 7: Access Your Application

### Step 7.1: Your Application URLs

After deployment, you'll have:

| URL | Purpose |
|-----|---------|
| `https://nucleiq-xxx.run.app` | Main application |
| `https://nucleiq-xxx.run.app/admin` | Django admin |
| `https://nucleiq-xxx.run.app/api/docs` | API documentation |
| `https://nucleiq-xxx.run.app/api/health` | Health check |

### Step 7.2: Login to Admin

1. Go to `https://YOUR_URL/admin`
2. Login with the superuser credentials you created
3. Create your first tenant (school)

### Step 7.3: Monitor Usage & Costs

**View costs:**
```powershell
# View current billing
gcloud billing projects describe $PROJECT_ID
```

**Via Console:**
1. Go to: https://console.cloud.google.com/billing
2. Click on your project
3. View spending reports

**Set budget alert:**
1. Go to: Billing → Budgets & alerts
2. Create budget
3. Set amount: $10 (you'll be notified before hitting this)

---

## 🎯 Quick Reference Commands

### Deploy Commands
```powershell
# Redeploy after code changes
git add . && git commit -m "Update" && git push

# Manual deploy from local
docker build -f Dockerfile.cloudrun -t nucleiq .
docker tag nucleiq asia-south1-docker.pkg.dev/$PROJECT_ID/nucleiq/nucleiq-app
docker push asia-south1-docker.pkg.dev/$PROJECT_ID/nucleiq/nucleiq-app
gcloud run deploy nucleiq --image asia-south1-docker.pkg.dev/$PROJECT_ID/nucleiq/nucleiq-app --region asia-south1
```

### Monitoring Commands
```powershell
# View logs
gcloud run services logs read nucleiq --region=asia-south1 --limit=50

# View service status
gcloud run services describe nucleiq --region=asia-south1

# List all services
gcloud run services list
```

### Troubleshooting Commands
```powershell
# Check if APIs are enabled
gcloud services list --enabled

# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID

# Delete and redeploy
gcloud run services delete nucleiq --region=asia-south1
# Then push code again
```

---

## 💰 Cost Summary

| Service | Free Tier | Your Usage | Monthly Cost |
|---------|-----------|------------|--------------|
| Cloud Run | 2M requests | Low traffic | $0-5 |
| Artifact Registry | 500MB | ~500MB | $0 |
| Cloud Build | 120 min/day | ~5 builds | $0 |
| **Total** | | | **$0-5/month** |

**Your $300 credits will last:** 60+ months at low usage!

---

## ❓ Common Questions

**Q: Is my data safe?**
A: Yes, but note that without Cloud SQL, data is lost when container restarts.
   For production, add Cloud SQL ($10/month).

**Q: How do I add a custom domain?**
```powershell
gcloud run domain-mappings create --service nucleiq --domain your-domain.com --region asia-south1
```

**Q: How do I scale for more users?**
Cloud Run auto-scales! Just set max instances:
```powershell
gcloud run services update nucleiq --max-instances=10 --region=asia-south1
```

**Q: Can I stop the service to save money?**
Cloud Run scales to zero automatically - you only pay when someone uses it!

---

## 🆘 Need Help?

- **GCP Documentation:** https://cloud.google.com/run/docs
- **gcloud Reference:** https://cloud.google.com/sdk/gcloud/reference
- **GCP Free Tier:** https://cloud.google.com/free/docs/free-cloud-features
- **Support:** https://console.cloud.google.com/support

---

*Guide Created: February 2026*
*Estimated setup time: 30-45 minutes*
