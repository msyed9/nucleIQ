"""
Script to create initial subscription plans
Run with: docker compose exec backend python manage.py shell < create_plans.py
"""

from billing.models import SubscriptionPlan
from decimal import Decimal

print("Creating subscription plans...")

# Trial Plan
trial, created = SubscriptionPlan.objects.get_or_create(
    plan_type="trial",
    defaults={
        'name': "Trial",
        'description': "14-day free trial with limited features",
        'price_monthly': Decimal('0.00'),
        'price_quarterly': Decimal('0.00'),
        'price_yearly': Decimal('0.00'),
        'currency': "INR",
        'max_students': 50,
        'max_staff': 10,
        'max_storage_gb': 2,
        'trial_days': 14,
        'features': {
            "sms": False,
            "whatsapp": False,
            "reports": True,
            "analytics": False,
        },
        'display_order': 1,
        'is_active': True,
        'is_public': True,
    }
)
print(f"{'Created' if created else 'Found'} Trial plan")

# Basic Plan
basic, created = SubscriptionPlan.objects.get_or_create(
    plan_type="basic",
    defaults={
        'name': "Basic",
        'description': "Perfect for small schools and coaching centers",
        'price_monthly': Decimal('2999.00'),
        'price_quarterly': Decimal('8499.00'),  # 5% discount
        'price_yearly': Decimal('31999.00'),  # 11% discount
        'currency': "INR",
        'max_students': 200,
        'max_staff': 30,
        'max_storage_gb': 10,
        'trial_days': 14,
        'features': {
            "sms": True,
            "whatsapp": False,
            "reports": True,
            "analytics": False,
        },
        'display_order': 2,
        'is_active': True,
        'is_public': True,
    }
)
print(f"{'Created' if created else 'Found'} Basic plan")

# Standard Plan
standard, created = SubscriptionPlan.objects.get_or_create(
    plan_type="standard",
    defaults={
        'name': "Standard",
        'description': "For growing institutions with advanced needs",
        'price_monthly': Decimal('5999.00'),
        'price_quarterly': Decimal('16999.00'),  # 5% discount
        'price_yearly': Decimal('63999.00'),  # 11% discount
        'currency': "INR",
        'max_students': 500,
        'max_staff': 60,
        'max_storage_gb': 25,
        'trial_days': 14,
        'features': {
            "sms": True,
            "whatsapp": True,
            "reports": True,
            "analytics": True,
        },
        'display_order': 3,
        'is_active': True,
        'is_public': True,
    }
)
print(f"{'Created' if created else 'Found'} Standard plan")

# Premium Plan
premium, created = SubscriptionPlan.objects.get_or_create(
    plan_type="premium",
    defaults={
        'name': "Premium",
        'description': "Complete solution for large institutions",
        'price_monthly': Decimal('9999.00'),
        'price_quarterly': Decimal('28499.00'),  # 5% discount
        'price_yearly': Decimal('107999.00'),  # 10% discount
        'currency': "INR",
        'max_students': 1000,
        'max_staff': 100,
        'max_storage_gb': 50,
        'trial_days': 14,
        'features': {
            "sms": True,
            "whatsapp": True,
            "reports": True,
            "analytics": True,
            "api_access": True,
            "priority_support": True,
        },
        'display_order': 4,
        'is_active': True,
        'is_public': True,
    }
)
print(f"{'Created' if created else 'Found'} Premium plan")

# Enterprise Plan
enterprise, created = SubscriptionPlan.objects.get_or_create(
    plan_type="enterprise",
    defaults={
        'name': "Enterprise",
        'description': "Custom solution for large educational groups",
        'price_monthly': Decimal('19999.00'),
        'price_quarterly': Decimal('56999.00'),
        'price_yearly': Decimal('215999.00'),
        'currency': "INR",
        'max_students': 5000,
        'max_staff': 500,
        'max_storage_gb': 200,
        'trial_days': 30,
        'features': {
            "sms": True,
            "whatsapp": True,
            "reports": True,
            "analytics": True,
            "api_access": True,
            "priority_support": True,
            "dedicated_account_manager": True,
            "custom_integrations": True,
        },
        'display_order': 5,
        'is_active': True,
        'is_public': True,
    }
)
print(f"{'Created' if created else 'Found'} Enterprise plan")

print("\n✅ All subscription plans created successfully!")
print(f"Total plans: {SubscriptionPlan.objects.count()}")
