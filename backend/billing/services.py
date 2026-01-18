"""
Payment Gateway Services for NucleiQ
Wrappers for Razorpay and Stripe payment gateways
"""

import razorpay
import stripe
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from .models import PaymentTransaction, Invoice, Subscription
import logging

logger = logging.getLogger(__name__)


class RazorpayService:
    """
    Razorpay payment gateway service.
    Handles subscription creation, payment processing, and webhooks.
    """
    
    def __init__(self):
        """Initialize Razorpay client."""
        self.client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET
            )
        )
    
    def create_subscription(self, subscription, billing_cycle='monthly'):
        """
        Create a Razorpay subscription.
        
        Args:
            subscription: Subscription model instance
            billing_cycle: 'monthly', 'quarterly', or 'yearly'
        
        Returns:
            dict: Razorpay subscription response
        """
        try:
            # Convert amount to paise (Razorpay uses smallest currency unit)
            amount = int(subscription.plan.get_price(billing_cycle) * 100)
            
            # Determine billing period
            period_map = {
                'monthly': 'monthly',
                'quarterly': 'monthly',  # Will set count to 3
                'yearly': 'yearly',
            }
            
            plan_data = {
                'period': period_map.get(billing_cycle, 'monthly'),
                'interval': 3 if billing_cycle == 'quarterly' else 1,
                'item': {
                    'name': f"{subscription.plan.name} Plan",
                    'amount': amount,
                    'currency': subscription.plan.currency,
                }
            }
            
            # Create Razorpay plan
            rz_plan = self.client.plan.create(plan_data)
            
            # Create subscription
            subscription_data = {
                'plan_id': rz_plan['id'],
                'customer_notify': 1,
                'total_count': 0,  # Infinite renewals
                'notes': {
                    'tenant_id': str(subscription.tenant.id),
                    'subscription_id': str(subscription.id),
                }
            }
            
            rz_subscription = self.client.subscription.create(subscription_data)
            
            # Update subscription with Razorpay ID
            subscription.razorpay_subscription_id = rz_subscription['id']
            subscription.save(update_fields=['razorpay_subscription_id'])
            
            logger.info(f"Created Razorpay subscription: {rz_subscription['id']}")
            return rz_subscription
            
        except Exception as e:
            logger.error(f"Razorpay subscription creation failed: {str(e)}")
            raise
    
    def create_payment_link(self, invoice):
        """
        Create a Razorpay payment link for an invoice.
        
        Args:
            invoice: Invoice model instance
        
        Returns:
            dict: Payment link response
        """
        try:
            amount = int(invoice.total_amount * 100)  # Convert to paise
            
            payment_link_data = {
                'amount': amount,
                'currency': invoice.currency,
                'description': f"Invoice {invoice.invoice_number}",
                'customer': {
                    'name': invoice.subscription.tenant.name,
                    'email': invoice.subscription.tenant.admin_email,
                },
                'notify': {
                    'sms': True,
                    'email': True,
                },
                'reminder_enable': True,
                'notes': {
                    'invoice_id': str(invoice.id),
                    'invoice_number': invoice.invoice_number,
                },
                'callback_url': f"{settings.FRONTEND_URL}/billing/payment-success",
                'callback_method': 'get',
            }
            
            payment_link = self.client.payment_link.create(payment_link_data)
            
            logger.info(f"Created Razorpay payment link: {payment_link['id']}")
            return payment_link
            
        except Exception as e:
            logger.error(f"Razorpay payment link creation failed: {str(e)}")
            raise
    
    def verify_payment(self, payment_id, order_id, signature):
        """
        Verify Razorpay payment signature.
        
        Args:
            payment_id: Razorpay payment ID
            order_id: Razorpay order ID
            signature: Payment signature
        
        Returns:
            bool: True if signature is valid
        """
        try:
            params_dict = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            return True
            
        except razorpay.errors.SignatureVerificationError:
            logger.error("Razorpay signature verification failed")
            return False
    
    def cancel_subscription(self, razorpay_subscription_id):
        """
        Cancel a Razorpay subscription.
        
        Args:
            razorpay_subscription_id: Razorpay subscription ID
        
        Returns:
            dict: Cancellation response
        """
        try:
            response = self.client.subscription.cancel(
                razorpay_subscription_id,
                cancel_at_cycle_end=1  # Cancel at end of current billing cycle
            )
            
            logger.info(f"Canceled Razorpay subscription: {razorpay_subscription_id}")
            return response
            
        except Exception as e:
            logger.error(f"Razorpay subscription cancellation failed: {str(e)}")
            raise


class StripeService:
    """
    Stripe payment gateway service.
    Handles subscription creation, payment processing, and webhooks.
    """
    
    def __init__(self):
        """Initialize Stripe client."""
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    def create_customer(self, tenant):
        """
        Create a Stripe customer for a tenant.
        
        Args:
            tenant: Tenant model instance
        
        Returns:
            stripe.Customer: Stripe customer object
        """
        try:
            customer = stripe.Customer.create(
                email=tenant.admin_email,
                name=tenant.name,
                metadata={
                    'tenant_id': str(tenant.id),
                }
            )
            
            logger.info(f"Created Stripe customer: {customer.id}")
            return customer
            
        except Exception as e:
            logger.error(f"Stripe customer creation failed: {str(e)}")
            raise
    
    def create_subscription(self, subscription, customer_id, billing_cycle='monthly'):
        """
        Create a Stripe subscription.
        
        Args:
            subscription: Subscription model instance
            customer_id: Stripe customer ID
            billing_cycle: 'monthly', 'quarterly', or 'yearly'
        
        Returns:
            stripe.Subscription: Stripe subscription object
        """
        try:
            # Get price amount in cents
            amount = int(subscription.plan.get_price(billing_cycle) * 100)
            
            # Determine billing interval
            interval_map = {
                'monthly': 'month',
                'quarterly': 'month',
                'yearly': 'year',
            }
            
            interval_count = 3 if billing_cycle == 'quarterly' else 1
            
            # Create price
            price = stripe.Price.create(
                unit_amount=amount,
                currency=subscription.plan.currency.lower(),
                recurring={
                    'interval': interval_map.get(billing_cycle, 'month'),
                    'interval_count': interval_count,
                },
                product_data={
                    'name': f"{subscription.plan.name} Plan",
                },
            )
            
            # Create subscription
            stripe_subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price.id}],
                metadata={
                    'tenant_id': str(subscription.tenant.id),
                    'subscription_id': str(subscription.id),
                },
            )
            
            # Update subscription with Stripe ID
            subscription.stripe_subscription_id = stripe_subscription.id
            subscription.save(update_fields=['stripe_subscription_id'])
            
            logger.info(f"Created Stripe subscription: {stripe_subscription.id}")
            return stripe_subscription
            
        except Exception as e:
            logger.error(f"Stripe subscription creation failed: {str(e)}")
            raise
    
    def create_payment_intent(self, invoice):
        """
        Create a Stripe payment intent for an invoice.
        
        Args:
            invoice: Invoice model instance
        
        Returns:
            stripe.PaymentIntent: Payment intent object
        """
        try:
            amount = int(invoice.total_amount * 100)  # Convert to cents
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=invoice.currency.lower(),
                metadata={
                    'invoice_id': str(invoice.id),
                    'invoice_number': invoice.invoice_number,
                },
                description=f"Invoice {invoice.invoice_number}",
            )
            
            logger.info(f"Created Stripe payment intent: {payment_intent.id}")
            return payment_intent
            
        except Exception as e:
            logger.error(f"Stripe payment intent creation failed: {str(e)}")
            raise
    
    def cancel_subscription(self, stripe_subscription_id):
        """
        Cancel a Stripe subscription.
        
        Args:
            stripe_subscription_id: Stripe subscription ID
        
        Returns:
            stripe.Subscription: Updated subscription object
        """
        try:
            subscription = stripe.Subscription.modify(
                stripe_subscription_id,
                cancel_at_period_end=True  # Cancel at end of current billing cycle
            )
            
            logger.info(f"Canceled Stripe subscription: {stripe_subscription_id}")
            return subscription
            
        except Exception as e:
            logger.error(f"Stripe subscription cancellation failed: {str(e)}")
            raise


class BillingService:
    """
    High-level billing service.
    Orchestrates subscription management and payment processing.
    """
    
    def __init__(self):
        self.razorpay = RazorpayService()
        self.stripe = StripeService()
    
    def create_invoice_for_subscription(self, subscription):
        """
        Create an invoice for a subscription's current billing period.
        
        Args:
            subscription: Subscription model instance
        
        Returns:
            Invoice: Created invoice
        """
        from .models import Invoice
        from datetime import timedelta
        
        # Calculate amounts
        subtotal = subscription.plan.get_price(subscription.billing_cycle)
        tax_rate = Decimal('0.18')  # 18% GST for India
        tax_amount = subtotal * tax_rate
        total_amount = subtotal + tax_amount
        
        # Create invoice
        invoice = Invoice.objects.create(
            subscription=subscription,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=subscription.plan.currency,
            due_date=timezone.now().date() + timedelta(days=7),
            line_items=[
                {
                    'description': f"{subscription.plan.name} Plan - {subscription.billing_cycle.title()}",
                    'quantity': 1,
                    'unit_price': float(subtotal),
                    'amount': float(subtotal),
                }
            ]
        )
        
        logger.info(f"Created invoice {invoice.invoice_number} for subscription {subscription.id}")
        return invoice
    
    def process_payment(self, invoice, gateway='razorpay'):
        """
        Process payment for an invoice.
        
        Args:
            invoice: Invoice model instance
            gateway: 'razorpay' or 'stripe'
        
        Returns:
            dict: Payment response
        """
        if gateway == 'razorpay':
            return self.razorpay.create_payment_link(invoice)
        elif gateway == 'stripe':
            return self.stripe.create_payment_intent(invoice)
        else:
            raise ValueError(f"Unsupported payment gateway: {gateway}")
    
    def check_subscription_limits(self, tenant, resource_type):
        """
        Check if tenant is within subscription limits.
        
        Args:
            tenant: Tenant model instance
            resource_type: 'students', 'staff', or 'storage_gb'
        
        Returns:
            dict: {
                'within_limit': bool,
                'current_count': int,
                'max_limit': int,
                'usage_percentage': float
            }
        """
        subscription = tenant.subscription
        
        # Get current usage
        current_count = 0
        if resource_type == 'students':
            # This would query the actual student count
            # current_count = tenant.students.count()
            pass
        elif resource_type == 'staff':
            # current_count = tenant.staff.count()
            pass
        elif resource_type == 'storage_gb':
            # Calculate storage usage
            pass
        
        max_limit = getattr(subscription.plan, f'max_{resource_type}', 0)
        within_limit = subscription.is_within_limit(resource_type, current_count)
        usage_percentage = (current_count / max_limit * 100) if max_limit > 0 else 0
        
        return {
            'within_limit': within_limit,
            'current_count': current_count,
            'max_limit': max_limit,
            'usage_percentage': usage_percentage,
        }
