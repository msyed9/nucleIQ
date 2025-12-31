"""
Serializers for Billing app
"""

from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, Invoice, PaymentTransaction


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'plan_type', 'description',
            'price_monthly', 'price_quarterly', 'price_yearly', 'currency',
            'max_students', 'max_staff', 'max_storage_gb',
            'features', 'trial_days', 'is_active', 'is_public',
            'display_order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions."""
    
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    is_active_status = serializers.BooleanField(source='is_active', read_only=True)
    is_trial_status = serializers.BooleanField(source='is_trial', read_only=True)
    days_until_renewal_count = serializers.IntegerField(source='days_until_renewal', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'tenant', 'tenant_name', 'plan', 'plan_details',
            'status', 'billing_cycle', 'trial_start_date', 'trial_end_date',
            'current_period_start', 'current_period_end', 'canceled_at',
            'auto_renew', 'razorpay_subscription_id', 'stripe_subscription_id',
            'metadata', 'is_active_status', 'is_trial_status',
            'days_until_renewal_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tenant_name', 'plan_details', 'is_active_status',
            'is_trial_status', 'days_until_renewal_count',
            'created_at', 'updated_at'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices."""
    
    subscription_details = serializers.SerializerMethodField()
    is_overdue_status = serializers.BooleanField(source='is_overdue', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'subscription', 'subscription_details', 'invoice_number',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'currency',
            'status', 'issue_date', 'due_date', 'paid_at', 'pdf_url',
            'razorpay_invoice_id', 'stripe_invoice_id', 'line_items',
            'metadata', 'is_overdue_status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'subscription_details', 'is_overdue_status',
            'created_at', 'updated_at'
        ]
    
    def get_subscription_details(self, obj):
        return {
            'tenant_name': obj.subscription.tenant.name,
            'plan_name': obj.subscription.plan.name,
        }


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions."""
    
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'invoice', 'invoice_number', 'amount', 'currency',
            'gateway', 'status', 'gateway_transaction_id', 'gateway_payment_id',
            'payment_method', 'error_message', 'gateway_response',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']


class SubscriptionUpgradeSerializer(serializers.Serializer):
    """Serializer for subscription upgrade/downgrade."""
    
    new_plan_id = serializers.UUIDField(required=True)
    billing_cycle = serializers.ChoiceField(
        choices=['monthly', 'quarterly', 'yearly'],
        default='monthly'
    )
    
    def validate_new_plan_id(self, value):
        """Validate that the plan exists and is active."""
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
            return value
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive plan")


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating payment intents."""
    
    invoice_id = serializers.UUIDField(required=True)
    gateway = serializers.ChoiceField(
        choices=['razorpay', 'stripe'],
        default='razorpay'
    )
    
    def validate_invoice_id(self, value):
        """Validate that the invoice exists and is pending."""
        try:
            invoice = Invoice.objects.get(id=value, status='pending')
            return value
        except Invoice.DoesNotExist:
            raise serializers.ValidationError("Invalid or non-pending invoice")


class UsageLimitSerializer(serializers.Serializer):
    """Serializer for usage limit checks."""
    
    resource_type = serializers.ChoiceField(
        choices=['students', 'staff', 'storage_gb'],
        required=True
    )
    
    within_limit = serializers.BooleanField(read_only=True)
    current_count = serializers.IntegerField(read_only=True)
    max_limit = serializers.IntegerField(read_only=True)
    usage_percentage = serializers.FloatField(read_only=True)
