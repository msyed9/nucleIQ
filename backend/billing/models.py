"""
Billing Models for NucleiQ
Handles subscription plans, subscriptions, invoices, and payment transactions
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from core.models import BaseModel


class SubscriptionPlan(BaseModel):
    """
    Subscription plans available for tenants.
    Defines pricing, limits, and features for each tier.
    """
    
    PLAN_TYPE_CHOICES = [
        ('trial', 'Trial'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    name = models.CharField(
        max_length=100,
        help_text=_('Plan name (e.g., Basic, Pro, Enterprise)')
    )
    
    plan_type = models.CharField(
        max_length=20,
        choices=PLAN_TYPE_CHOICES,
        unique=True,
        db_index=True,
        help_text=_('Plan type identifier')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Plan description and features')
    )
    
    # Pricing
    price_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Monthly price in base currency')
    )
    
    price_quarterly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Quarterly price (usually discounted)')
    )
    
    price_yearly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Yearly price (usually discounted)')
    )
    
    currency = models.CharField(
        max_length=3,
        default='INR',
        help_text=_('Currency code (INR, USD, etc.)')
    )
    
    # Limits
    max_students = models.PositiveIntegerField(
        default=100,
        help_text=_('Maximum number of students allowed')
    )
    
    max_staff = models.PositiveIntegerField(
        default=20,
        help_text=_('Maximum number of staff members allowed')
    )
    
    max_storage_gb = models.PositiveIntegerField(
        default=5,
        help_text=_('Maximum storage in GB')
    )
    
    # Features (JSON field for flexibility)
    features = models.JSONField(
        default=dict,
        help_text=_('Plan features as JSON (e.g., {"sms": true, "whatsapp": false})')
    )
    
    # Trial settings
    trial_days = models.PositiveIntegerField(
        default=14,
        help_text=_('Number of trial days for this plan')
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this plan is currently available for purchase')
    )
    
    is_public = models.BooleanField(
        default=True,
        help_text=_('Whether this plan is publicly visible')
    )
    
    # Display order
    display_order = models.PositiveIntegerField(
        default=0,
        help_text=_('Display order on pricing page')
    )
    
    class Meta:
        db_table = 'subscription_plans'
        verbose_name = _('Subscription Plan')
        verbose_name_plural = _('Subscription Plans')
        ordering = ['display_order', 'price_monthly']
    
    def __str__(self):
        return f"{self.name} ({self.plan_type})"
    
    def get_price(self, billing_cycle='monthly'):
        """Get price for a specific billing cycle."""
        prices = {
            'monthly': self.price_monthly,
            'quarterly': self.price_quarterly,
            'yearly': self.price_yearly,
        }
        return prices.get(billing_cycle, self.price_monthly)


class Subscription(BaseModel):
    """
    Tenant subscription to a plan.
    Tracks subscription status, billing cycle, and renewal dates.
    """
    
    STATUS_CHOICES = [
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('expired', 'Expired'),
    ]
    
    tenant = models.OneToOneField(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='subscription',
        help_text=_('Tenant this subscription belongs to')
    )
    
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        help_text=_('Current subscription plan')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='trial',
        db_index=True,
        help_text=_('Current subscription status')
    )
    
    billing_cycle = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.BILLING_CYCLE_CHOICES,
        default='monthly',
        help_text=_('Billing cycle for this subscription')
    )
    
    # Dates
    trial_start_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When trial started')
    )
    
    trial_end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When trial ends')
    )
    
    current_period_start = models.DateTimeField(
        help_text=_('Start of current billing period')
    )
    
    current_period_end = models.DateTimeField(
        help_text=_('End of current billing period')
    )
    
    canceled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When subscription was canceled')
    )
    
    # Auto-renewal
    auto_renew = models.BooleanField(
        default=True,
        help_text=_('Whether subscription auto-renews')
    )
    
    # Payment gateway references
    razorpay_subscription_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Razorpay subscription ID')
    )
    
    stripe_subscription_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Stripe subscription ID')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional subscription metadata')
    )
    
    class Meta:
        db_table = 'subscriptions'
        verbose_name = _('Subscription')
        verbose_name_plural = _('Subscriptions')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name} ({self.status})"
    
    @property
    def is_active(self):
        """Check if subscription is currently active."""
        return self.status in ['trial', 'active'] and self.current_period_end > timezone.now()
    
    @property
    def is_trial(self):
        """Check if subscription is in trial period."""
        return self.status == 'trial' and self.trial_end_date and self.trial_end_date > timezone.now()
    
    @property
    def days_until_renewal(self):
        """Days until next renewal."""
        if self.current_period_end:
            delta = self.current_period_end - timezone.now()
            return max(0, delta.days)
        return 0
    
    def can_access_feature(self, feature_key):
        """Check if subscription plan includes a specific feature."""
        return self.plan.features.get(feature_key, False)
    
    def is_within_limit(self, resource_type, current_count):
        """
        Check if current resource usage is within plan limits.
        
        Args:
            resource_type: 'students', 'staff', or 'storage_gb'
            current_count: Current usage count
        
        Returns:
            bool: True if within limit, False otherwise
        """
        limits = {
            'students': self.plan.max_students,
            'staff': self.plan.max_staff,
            'storage_gb': self.plan.max_storage_gb,
        }
        limit = limits.get(resource_type)
        if limit is None:
            return True
        return current_count < limit


class Invoice(BaseModel):
    """
    Invoice for subscription payments.
    Generated for each billing cycle.
    """
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='invoices',
        help_text=_('Subscription this invoice is for')
    )
    
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text=_('Unique invoice number')
    )
    
    # Amounts
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Subtotal before tax')
    )
    
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Tax amount (GST, VAT, etc.)')
    )
    
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Discount amount')
    )
    
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Total amount to be paid')
    )
    
    currency = models.CharField(
        max_length=3,
        default='INR',
        help_text=_('Currency code')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text=_('Invoice status')
    )
    
    # Dates
    issue_date = models.DateField(
        auto_now_add=True,
        help_text=_('Invoice issue date')
    )
    
    due_date = models.DateField(
        help_text=_('Payment due date')
    )
    
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When invoice was paid')
    )
    
    # Files
    pdf_url = models.URLField(
        max_length=500,
        blank=True,
        help_text=_('URL to invoice PDF')
    )
    
    # Payment gateway references
    razorpay_invoice_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Razorpay invoice ID')
    )
    
    stripe_invoice_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Stripe invoice ID')
    )
    
    # Metadata
    line_items = models.JSONField(
        default=list,
        help_text=_('Invoice line items')
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional invoice metadata')
    )
    
    class Meta:
        db_table = 'invoices'
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['subscription', 'status']),
            models.Index(fields=['issue_date']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.subscription.tenant.name}"
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue."""
        return self.status == 'pending' and self.due_date < timezone.now().date()
    
    def save(self, *args, **kwargs):
        """Auto-generate invoice number if not set."""
        if not self.invoice_number:
            # Generate invoice number: INV-YYYYMM-XXXXX
            from django.db.models import Max
            today = timezone.now()
            prefix = f"INV-{today.year}{today.month:02d}"
            
            last_invoice = Invoice.objects.filter(
                invoice_number__startswith=prefix
            ).aggregate(Max('invoice_number'))
            
            if last_invoice['invoice_number__max']:
                last_num = int(last_invoice['invoice_number__max'].split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.invoice_number = f"{prefix}-{new_num:05d}"
        
        super().save(*args, **kwargs)


class PaymentTransaction(BaseModel):
    """
    Payment transaction record.
    Tracks all payment attempts and their status.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    GATEWAY_CHOICES = [
        ('razorpay', 'Razorpay'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('manual', 'Manual'),
    ]
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='transactions',
        help_text=_('Invoice this transaction is for')
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Transaction amount')
    )
    
    currency = models.CharField(
        max_length=3,
        default='INR',
        help_text=_('Currency code')
    )
    
    gateway = models.CharField(
        max_length=20,
        choices=GATEWAY_CHOICES,
        help_text=_('Payment gateway used')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text=_('Transaction status')
    )
    
    # Gateway references
    gateway_transaction_id = models.CharField(
        max_length=200,
        blank=True,
        db_index=True,
        help_text=_('Payment gateway transaction ID')
    )
    
    gateway_payment_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Payment gateway payment ID')
    )
    
    # Additional info
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Payment method (card, UPI, netbanking, etc.)')
    )
    
    error_message = models.TextField(
        blank=True,
        help_text=_('Error message if transaction failed')
    )
    
    # Metadata
    gateway_response = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Full gateway response')
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional transaction metadata')
    )
    
    class Meta:
        db_table = 'payment_transactions'
        verbose_name = _('Payment Transaction')
        verbose_name_plural = _('Payment Transactions')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['gateway', 'gateway_transaction_id']),
        ]
    
    def __str__(self):
        return f"{self.gateway} - {self.amount} {self.currency} ({self.status})"
