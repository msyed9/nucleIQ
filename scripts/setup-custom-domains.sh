#!/bin/bash
# =============================================================================
# Configure Custom Domains and SSL for nucleiq.io
# Run this AFTER DNS records are configured in Hostinger
# =============================================================================

set -e

RESOURCE_GROUP="nucleiq-production-rg"

echo "=============================================="
echo "Custom Domain Configuration for nucleiq.io"
echo "=============================================="
echo ""

# Get Domain Verification ID
echo "Step 1: Getting domain verification ID..."
VERIFICATION_ID=$(az containerapp show \
    --name nucleiq-frontend \
    --resource-group $RESOURCE_GROUP \
    --query "properties.customDomainVerificationId" -o tsv)

echo ""
echo "📌 DOMAIN VERIFICATION ID:"
echo "=========================="
echo "$VERIFICATION_ID"
echo ""
echo "Add this as a TXT record in Hostinger:"
echo "  Name: asuid"
echo "  Value: $VERIFICATION_ID"
echo ""
echo "  Name: asuid.www"
echo "  Value: $VERIFICATION_ID"
echo ""
echo "  Name: asuid.api"
echo "  Value: $VERIFICATION_ID"
echo ""

read -p "Press Enter after adding TXT records in Hostinger (wait 5-10 minutes for DNS propagation)..."

# Add hostnames
echo ""
echo "Step 2: Adding custom hostnames to Container Apps..."

echo "Adding www.nucleiq.io to frontend..."
az containerapp hostname add \
    --name nucleiq-frontend \
    --resource-group $RESOURCE_GROUP \
    --hostname www.nucleiq.io

echo "Adding api.nucleiq.io to backend..."
az containerapp hostname add \
    --name nucleiq-backend \
    --resource-group $RESOURCE_GROUP \
    --hostname api.nucleiq.io

# Bind with managed certificates
echo ""
echo "Step 3: Binding managed SSL certificates..."

echo "Binding certificate to www.nucleiq.io..."
az containerapp hostname bind \
    --name nucleiq-frontend \
    --resource-group $RESOURCE_GROUP \
    --hostname www.nucleiq.io \
    --validation-method CNAME

echo "Binding certificate to api.nucleiq.io..."
az containerapp hostname bind \
    --name nucleiq-backend \
    --resource-group $RESOURCE_GROUP \
    --hostname api.nucleiq.io \
    --validation-method CNAME

# Verify
echo ""
echo "Step 4: Verifying configuration..."

echo ""
echo "Frontend hostnames:"
az containerapp hostname list \
    --name nucleiq-frontend \
    --resource-group $RESOURCE_GROUP \
    --query "[].{hostname:name, status:bindingType}" -o table

echo ""
echo "Backend hostnames:"
az containerapp hostname list \
    --name nucleiq-backend \
    --resource-group $RESOURCE_GROUP \
    --query "[].{hostname:name, status:bindingType}" -o table

echo ""
echo "=============================================="
echo "✅ CUSTOM DOMAIN SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "Your application is now available at:"
echo "  Frontend: https://www.nucleiq.io"
echo "  API: https://api.nucleiq.io"
echo ""
echo "Note: SSL certificate provisioning may take up to 15 minutes."
echo ""
