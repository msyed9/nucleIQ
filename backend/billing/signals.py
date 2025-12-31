"""
Signals for Billing app
Handles automatic subscription and invoice creation
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from tenants.models import Tenant
from .models import Subscription, SubscriptionPlan


@receiver(post_save, sender=Tenant)
def create_trial_subscription(sender, instance, created, **kwargs):
    """
    Automatically create a trial subscription when a new tenant is created.
    """
    if created:
        # Get trial plan
        try:
            trial_plan = SubscriptionPlan.objects.get(plan_type='trial')
        except SubscriptionPlan.DoesNotExist:
            # If no trial plan exists, use basic plan
            trial_plan = SubscriptionPlan.objects.filter(
                is_active=True
            ).order_by('price_monthly').first()
        
        if trial_plan:
            # Create subscription
            trial_start = timezone.now()
            trial_end = trial_start + timedelta(days=trial_plan.trial_days)
            
            Subscription.objects.create(
                tenant=instance,
                plan=trial_plan,
                status='trial',
                billing_cycle='monthly',
                trial_start_date=trial_start,
                trial_end_date=trial_end,
                current_period_start=trial_start,
                current_period_end=trial_end,
                auto_renew=True
            )
