# Hostinger DNS Configuration for nucleiq.io
## Connecting Your Hostinger Domain to Azure Container Apps

---

## Overview

This guide explains how to configure DNS records in Hostinger to point your domain `nucleiq.io` to your Azure Container Apps deployment.

---

## Step 1: Get Azure Container Apps URLs

After deploying your containers, get the Azure-assigned FQDNs:

```bash
# Get Frontend URL
az containerapp show --name nucleiq-frontend --resource-group nucleiq-production-rg --query "properties.configuration.ingress.fqdn" -o tsv
# Example output: nucleiq-frontend.wittyforest-abc12345.centralindia.azurecontainerapps.io

# Get Backend URL
az containerapp show --name nucleiq-backend --resource-group nucleiq-production-rg --query "properties.configuration.ingress.fqdn" -o tsv
# Example output: nucleiq-backend.wittyforest-abc12345.centralindia.azurecontainerapps.io
```

---

## Step 2: Get Domain Verification IDs

Before adding custom domains in Azure, you need to get verification IDs:

```bash
# For frontend (nucleiq.io)
az containerapp hostname add --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname nucleiq.io

# This will return something like:
# "customDomainVerificationId": "ABC123DEF456..."
```

Save these verification IDs - you'll need them for DNS TXT records.

---

## Step 3: Configure Hostinger DNS

### Login to Hostinger
1. Go to https://hpanel.hostinger.com/
2. Click on **Domains** → **nucleiq.io**
3. Click on **DNS / Nameservers**
4. Select **DNS Zone** tab

### Required DNS Records

Add the following DNS records:

| Type | Name | Target/Value | TTL | Purpose |
|------|------|-------------|-----|---------|
| **CNAME** | `www` | `nucleiq-frontend.xxx.centralindia.azurecontainerapps.io` | 3600 | www.nucleiq.io to frontend |
| **CNAME** | `api` | `nucleiq-backend.xxx.centralindia.azurecontainerapps.io` | 3600 | api.nucleiq.io to backend |
| **TXT** | `asuid` | `<verification-id-from-azure>` | 3600 | Domain ownership verification |
| **TXT** | `asuid.www` | `<verification-id-from-azure>` | 3600 | www subdomain verification |
| **TXT** | `asuid.api` | `<verification-id-from-azure>` | 3600 | api subdomain verification |

### For Root Domain (nucleiq.io)

Since Hostinger may not support ALIAS records for root domain, you have two options:

**Option A: URL Redirect (Recommended for Hostinger)**
1. In Hostinger, set up a **301 redirect** from `nucleiq.io` to `www.nucleiq.io`
2. Configure `www.nucleiq.io` as your primary domain

**Option B: Use Cloudflare (Advanced)**
1. Transfer DNS management to Cloudflare (free)
2. Cloudflare supports CNAME flattening for root domains

### Step-by-Step DNS Configuration

1. **Add CNAME for www**
   - Click "Add Record"
   - Type: CNAME
   - Name: `www`
   - Target: `nucleiq-frontend.wittyforest-abc12345.centralindia.azurecontainerapps.io`
   - TTL: 3600
   - Click Save

2. **Add CNAME for api**
   - Click "Add Record"
   - Type: CNAME
   - Name: `api`
   - Target: `nucleiq-backend.wittyforest-abc12345.centralindia.azurecontainerapps.io`
   - TTL: 3600
   - Click Save

3. **Add TXT for verification (asuid)**
   - Click "Add Record"
   - Type: TXT
   - Name: `asuid`
   - Value: `<your-verification-id>`
   - TTL: 3600
   - Click Save

4. **Add TXT for www verification**
   - Click "Add Record"
   - Type: TXT
   - Name: `asuid.www`
   - Value: `<your-verification-id>`
   - TTL: 3600
   - Click Save

5. **Add TXT for api verification**
   - Click "Add Record"
   - Type: TXT
   - Name: `asuid.api`
   - Value: `<your-verification-id>`
   - TTL: 3600
   - Click Save

---

## Step 4: Bind Custom Domains in Azure

Wait 5-10 minutes for DNS propagation, then:

```bash
# Bind frontend domains with managed certificate
az containerapp hostname bind \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --hostname www.nucleiq.io \
  --validation-method CNAME

# Bind API domain with managed certificate
az containerapp hostname bind \
  --name nucleiq-backend \
  --resource-group nucleiq-production-rg \
  --hostname api.nucleiq.io \
  --validation-method CNAME
```

---

## Step 5: Verify SSL Certificates

Azure will automatically provision Let's Encrypt certificates. Check status:

```bash
# Check frontend certificate
az containerapp hostname list \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --query "[].{hostname:name, certificateStatus:bindingType}" -o table

# Check backend certificate
az containerapp hostname list \
  --name nucleiq-backend \
  --resource-group nucleiq-production-rg \
  --query "[].{hostname:name, certificateStatus:bindingType}" -o table
```

---

## Step 6: Test Your Setup

```bash
# Test frontend
curl -I https://www.nucleiq.io
# Should return: HTTP/2 200

# Test API
curl -I https://api.nucleiq.io/api/health/
# Should return: HTTP/2 200

# Test root domain redirect
curl -I https://nucleiq.io
# Should return: HTTP/2 301 or 302 redirecting to www.nucleiq.io
```

---

## Troubleshooting

### DNS Not Propagating
- Use https://dnschecker.org to verify DNS records
- Wait up to 48 hours for full propagation
- Clear local DNS cache: `ipconfig /flushdns` (Windows)

### Certificate Provisioning Failed
```bash
# Check certificate status
az containerapp hostname list \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg

# If failed, delete and re-add
az containerapp hostname delete \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --hostname www.nucleiq.io

az containerapp hostname add \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --hostname www.nucleiq.io

az containerapp hostname bind \
  --name nucleiq-frontend \
  --resource-group nucleiq-production-rg \
  --hostname www.nucleiq.io \
  --validation-method CNAME
```

### Domain Verification Failed
- Ensure TXT records are correctly added with `asuid` prefix
- Check the verification ID matches exactly
- Wait for DNS propagation

---

## DNS Configuration Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNS CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Hostinger (DNS)                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  nucleiq.io        → 301 Redirect → www.nucleiq.io      │   │
│  │  www.nucleiq.io    → CNAME → nucleiq-frontend.xxx.azure │   │
│  │  api.nucleiq.io    → CNAME → nucleiq-backend.xxx.azure  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  Azure Container Apps                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  nucleiq-frontend  ← www.nucleiq.io (SSL ✓)             │   │
│  │  nucleiq-backend   ← api.nucleiq.io (SSL ✓)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Commands

```bash
# List all hostnames
az containerapp hostname list --name nucleiq-frontend --resource-group nucleiq-production-rg

# Get verification ID
az containerapp show --name nucleiq-frontend --resource-group nucleiq-production-rg --query "properties.customDomainVerificationId" -o tsv

# Delete hostname
az containerapp hostname delete --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io

# Add hostname
az containerapp hostname add --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io

# Bind with certificate
az containerapp hostname bind --name nucleiq-frontend --resource-group nucleiq-production-rg --hostname www.nucleiq.io --validation-method CNAME
```
