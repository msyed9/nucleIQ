# 🚀 Billing System - Quick Setup Guide

## ⚡ Quick Start (5 minutes)

### 1. Add to Settings (1 min)

```python
# backend/config/settings/base.py

INSTALLED_APPS = [
    # ... existing
    'billing',
]

MIDDLEWARE = [
    # ... existing
    'billing.middleware.SubscriptionEnforcementMiddleware',
]

# Add at bottom
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='')

STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')
```

### 2. Update URLs (30 sec)

```python
# backend/config/urls.py

urlpatterns = [
    # ... existing
    path('api/billing/', include('billing.urls')),
]
```

### 3. Run Migrations (1 min)

```bash
docker compose exec backend pip install razorpay stripe
docker compose exec backend python manage.py makemigrations billing
docker compose exec backend python manage.py migrate
```

### 4. Create Plans (2 min)

```bash
docker compose exec backend python manage.py shell
```

```python
from billing.models import SubscriptionPlan
from decimal import Decimal

SubscriptionPlan.objects.create(
    name="Trial", plan_type="trial",
    price_monthly=Decimal('0'), max_students=50,
    max_staff=10, max_storage_gb=2, trial_days=14
)

SubscriptionPlan.objects.create(
    name="Basic", plan_type="basic",
    price_monthly=Decimal('2999'), max_students=200,
    max_staff=30, max_storage_gb=10
)

SubscriptionPlan.objects.create(
    name="Premium", plan_type="premium",
    price_monthly=Decimal('9999'), max_students=1000,
    max_staff=100, max_storage_gb=50
)
```

### 5. Done! ✅

Test at: `http://localhost:8000/api/billing/plans/`

---

## 📋 Common Tasks

### Check Subscription Status
```python
from billing.models import Subscription

subscription = Subscription.objects.get(tenant=tenant)
print(f"Active: {subscription.is_active}")
print(f"Days left: {subscription.days_until_renewal}")
```

### Enforce Limits
```python
from billing.middleware import require_subscription_limit

@require_subscription_limit('students')
def create_student(request):
    # Auto-blocks if limit reached
    pass
```

### Create Invoice
```python
from billing.services import BillingService

service = BillingService()
invoice = service.create_invoice_for_subscription(subscription)
```

### Process Payment
```python
payment_link = service.process_payment(invoice, gateway='razorpay')
# Returns payment URL
```

---

## 🔗 API Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/plans/` | GET | List plans |
| `/api/billing/subscriptions/current/` | GET | Current subscription |
| `/api/billing/subscriptions/{id}/upgrade/` | POST | Upgrade plan |
| `/api/billing/subscriptions/{id}/cancel/` | POST | Cancel subscription |
| `/api/billing/invoices/` | GET | List invoices |
| `/api/billing/invoices/{id}/pay/` | POST | Pay invoice |

---

## 🎯 Frontend Integration

```tsx
import { SubscriptionManage } from './pages/billing/SubscriptionManage';

// Add to routes
<Route path="/billing" element={<SubscriptionManage />} />
```

---

## ⚙️ Environment Variables

```env
# .env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🐛 Troubleshooting

**Issue**: Migrations fail  
**Fix**: Ensure `billing` is in `INSTALLED_APPS`

**Issue**: Webhook fails  
**Fix**: Check signature verification and webhook secret

**Issue**: Limit not enforced  
**Fix**: Add middleware to `MIDDLEWARE` list

---

**Full Documentation**: See `BILLING_IMPLEMENTATION.md`
