"""
Django Admin configuration for Billing app
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import SubscriptionPlan, Subscription, Invoice, PaymentTransaction


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    """Admin interface for subscription plans."""
    
    list_display = [
        'name', 'plan_type', 'price_monthly', 'price_yearly',
        'max_students', 'max_staff', 'is_active', 'display_order'
    ]
    list_filter = ['plan_type', 'is_active', 'is_public']
    search_fields = ['name', 'description']
    ordering = ['display_order', 'price_monthly']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'plan_type', 'description', 'display_order')
        }),
        ('Pricing', {
            'fields': ('price_monthly', 'price_quarterly', 'price_yearly', 'currency')
        }),
        ('Limits', {
            'fields': ('max_students', 'max_staff', 'max_storage_gb')
        }),
        ('Features', {
            'fields': ('features', 'trial_days')
        }),
        ('Status', {
            'fields': ('is_active', 'is_public')
        }),
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for subscriptions."""
    
    list_display = [
        'tenant', 'plan', 'status', 'billing_cycle',
        'current_period_end', 'auto_renew', 'created_at'
    ]
    list_filter = ['status', 'billing_cycle', 'auto_renew', 'plan']
    search_fields = ['tenant__name', 'razorpay_subscription_id', 'stripe_subscription_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Subscription Details', {
            'fields': ('tenant', 'plan', 'status', 'billing_cycle')
        }),
        ('Trial Period', {
            'fields': ('trial_start_date', 'trial_end_date')
        }),
        ('Billing Period', {
            'fields': ('current_period_start', 'current_period_end')
        }),
        ('Settings', {
            'fields': ('auto_renew', 'canceled_at')
        }),
        ('Payment Gateway', {
            'fields': ('razorpay_subscription_id', 'stripe_subscription_id')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin interface for invoices."""
    
    list_display = [
        'invoice_number', 'subscription_tenant', 'total_amount',
        'currency', 'status', 'issue_date', 'due_date', 'is_overdue'
    ]
    list_filter = ['status', 'currency', 'issue_date']
    search_fields = ['invoice_number', 'subscription__tenant__name']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    date_hierarchy = 'issue_date'
    
    fieldsets = (
        ('Invoice Details', {
            'fields': ('invoice_number', 'subscription', 'status')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'currency')
        }),
        ('Dates', {
            'fields': ('issue_date', 'due_date', 'paid_at')
        }),
        ('Files', {
            'fields': ('pdf_url',)
        }),
        ('Payment Gateway', {
            'fields': ('razorpay_invoice_id', 'stripe_invoice_id')
        }),
        ('Line Items', {
            'fields': ('line_items',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    def subscription_tenant(self, obj):
        """Display tenant name."""
        return obj.subscription.tenant.name
    subscription_tenant.short_description = 'Tenant'
    
    def is_overdue(self, obj):
        """Display overdue status with color."""
        if obj.is_overdue:
            return format_html(
                '<span style="color: red; font-weight: bold;">Yes</span>'
            )
        return 'No'
    is_overdue.short_description = 'Overdue'


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    """Admin interface for payment transactions."""
    
    list_display = [
        'gateway_transaction_id', 'invoice_number', 'amount',
        'currency', 'gateway', 'status', 'created_at'
    ]
    list_filter = ['gateway', 'status', 'payment_method', 'created_at']
    search_fields = [
        'gateway_transaction_id', 'gateway_payment_id',
        'invoice__invoice_number'
    ]
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('invoice', 'amount', 'currency', 'gateway', 'status')
        }),
        ('Payment Gateway', {
            'fields': ('gateway_transaction_id', 'gateway_payment_id', 'payment_method')
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
        ('Gateway Response', {
            'fields': ('gateway_response',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    def invoice_number(self, obj):
        """Display invoice number."""
        return obj.invoice.invoice_number
    invoice_number.short_description = 'Invoice'
