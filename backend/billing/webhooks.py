"""
Webhook Handlers for Payment Gateways
Handles Razorpay and Stripe webhook events
"""

import json
import hmac
import hashlib
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
from django.utils import timezone
from .models import Subscription, Invoice, PaymentTransaction
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    """
    Handle Razorpay webhook events.
    
    Events handled:
    - subscription.charged
    - subscription.cancelled
    - subscription.paused
    - payment.captured
    - payment.failed
    """
    try:
        # Verify webhook signature
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        
        if not verify_razorpay_signature(request.body, webhook_signature, webhook_secret):
            logger.warning("Invalid Razorpay webhook signature")
            return HttpResponse(status=400)
        
        # Parse webhook payload
        payload = json.loads(request.body)
        event = payload.get('event')
        
        logger.info(f"Received Razorpay webhook: {event}")
        
        # Handle different events
        if event == 'subscription.charged':
            handle_subscription_charged(payload)
        
        elif event == 'subscription.cancelled':
            handle_subscription_cancelled(payload)
        
        elif event == 'subscription.paused':
            handle_subscription_paused(payload)
        
        elif event == 'payment.captured':
            handle_payment_captured(payload)
        
        elif event == 'payment.failed':
            handle_payment_failed(payload)
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Razorpay webhook error: {str(e)}")
        return HttpResponse(status=500)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events.
    
    Events handled:
    - invoice.payment_succeeded
    - invoice.payment_failed
    - customer.subscription.updated
    - customer.subscription.deleted
    """
    try:
        import stripe
        
        # Verify webhook signature
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        signature = request.headers.get('Stripe-Signature')
        
        try:
            event = stripe.Webhook.construct_event(
                request.body, signature, webhook_secret
            )
        except ValueError:
            logger.warning("Invalid Stripe webhook payload")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            logger.warning("Invalid Stripe webhook signature")
            return HttpResponse(status=400)
        
        event_type = event['type']
        logger.info(f"Received Stripe webhook: {event_type}")
        
        # Handle different events
        if event_type == 'invoice.payment_succeeded':
            handle_stripe_payment_succeeded(event['data']['object'])
        
        elif event_type == 'invoice.payment_failed':
            handle_stripe_payment_failed(event['data']['object'])
        
        elif event_type == 'customer.subscription.updated':
            handle_stripe_subscription_updated(event['data']['object'])
        
        elif event_type == 'customer.subscription.deleted':
            handle_stripe_subscription_deleted(event['data']['object'])
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        return HttpResponse(status=500)


# Razorpay Event Handlers

def verify_razorpay_signature(payload, signature, secret):
    """Verify Razorpay webhook signature."""
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)


def handle_subscription_charged(payload):
    """Handle successful subscription charge."""
    subscription_data = payload['payload']['subscription']['entity']
    payment_data = payload['payload']['payment']['entity']
    
    razorpay_subscription_id = subscription_data['id']
    
    try:
        subscription = Subscription.objects.get(
            razorpay_subscription_id=razorpay_subscription_id
        )
        
        # Find or create invoice
        invoice = subscription.invoices.filter(
            razorpay_invoice_id=payment_data.get('invoice_id')
        ).first()
        
        if invoice:
            # Mark invoice as paid
            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=['status', 'paid_at'])
            
            # Create transaction record
            PaymentTransaction.objects.create(
                invoice=invoice,
                amount=payment_data['amount'] / 100,  # Convert from paise
                currency=payment_data['currency'],
                gateway='razorpay',
                status='success',
                gateway_transaction_id=payment_data['id'],
                payment_method=payment_data.get('method'),
                gateway_response=payment_data
            )
            
            # Update subscription status
            subscription.status = 'active'
            subscription.save(update_fields=['status'])
            
            logger.info(f"Subscription {subscription.id} charged successfully")
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found: {razorpay_subscription_id}")


def handle_subscription_cancelled(payload):
    """Handle subscription cancellation."""
    subscription_data = payload['payload']['subscription']['entity']
    razorpay_subscription_id = subscription_data['id']
    
    try:
        subscription = Subscription.objects.get(
            razorpay_subscription_id=razorpay_subscription_id
        )
        
        subscription.status = 'canceled'
        subscription.canceled_at = timezone.now()
        subscription.auto_renew = False
        subscription.save(update_fields=['status', 'canceled_at', 'auto_renew'])
        
        logger.info(f"Subscription {subscription.id} cancelled")
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found: {razorpay_subscription_id}")


def handle_subscription_paused(payload):
    """Handle subscription pause."""
    subscription_data = payload['payload']['subscription']['entity']
    razorpay_subscription_id = subscription_data['id']
    
    try:
        subscription = Subscription.objects.get(
            razorpay_subscription_id=razorpay_subscription_id
        )
        
        subscription.status = 'past_due'
        subscription.save(update_fields=['status'])
        
        logger.info(f"Subscription {subscription.id} paused")
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found: {razorpay_subscription_id}")


def handle_payment_captured(payload):
    """Handle successful payment capture."""
    payment_data = payload['payload']['payment']['entity']
    
    # Find invoice by notes
    invoice_id = payment_data.get('notes', {}).get('invoice_id')
    
    if invoice_id:
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            
            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=['status', 'paid_at'])
            
            # Create transaction
            PaymentTransaction.objects.create(
                invoice=invoice,
                amount=payment_data['amount'] / 100,
                currency=payment_data['currency'],
                gateway='razorpay',
                status='success',
                gateway_transaction_id=payment_data['id'],
                payment_method=payment_data.get('method'),
                gateway_response=payment_data
            )
            
            logger.info(f"Payment captured for invoice {invoice.invoice_number}")
            
        except Invoice.DoesNotExist:
            logger.error(f"Invoice not found: {invoice_id}")


def handle_payment_failed(payload):
    """Handle failed payment."""
    payment_data = payload['payload']['payment']['entity']
    
    invoice_id = payment_data.get('notes', {}).get('invoice_id')
    
    if invoice_id:
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            
            invoice.status = 'failed'
            invoice.save(update_fields=['status'])
            
            # Create failed transaction
            PaymentTransaction.objects.create(
                invoice=invoice,
                amount=payment_data['amount'] / 100,
                currency=payment_data['currency'],
                gateway='razorpay',
                status='failed',
                gateway_transaction_id=payment_data['id'],
                error_message=payment_data.get('error_description', 'Payment failed'),
                gateway_response=payment_data
            )
            
            # Update subscription status
            invoice.subscription.status = 'past_due'
            invoice.subscription.save(update_fields=['status'])
            
            logger.warning(f"Payment failed for invoice {invoice.invoice_number}")
            
        except Invoice.DoesNotExist:
            logger.error(f"Invoice not found: {invoice_id}")


# Stripe Event Handlers

def handle_stripe_payment_succeeded(invoice_data):
    """Handle successful Stripe payment."""
    stripe_invoice_id = invoice_data['id']
    
    try:
        invoice = Invoice.objects.get(stripe_invoice_id=stripe_invoice_id)
        
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=['status', 'paid_at'])
        
        # Create transaction
        PaymentTransaction.objects.create(
            invoice=invoice,
            amount=invoice_data['amount_paid'] / 100,
            currency=invoice_data['currency'].upper(),
            gateway='stripe',
            status='success',
            gateway_transaction_id=invoice_data['payment_intent'],
            gateway_response=invoice_data
        )
        
        # Update subscription
        invoice.subscription.status = 'active'
        invoice.subscription.save(update_fields=['status'])
        
        logger.info(f"Stripe payment succeeded for invoice {invoice.invoice_number}")
        
    except Invoice.DoesNotExist:
        logger.error(f"Invoice not found: {stripe_invoice_id}")


def handle_stripe_payment_failed(invoice_data):
    """Handle failed Stripe payment."""
    stripe_invoice_id = invoice_data['id']
    
    try:
        invoice = Invoice.objects.get(stripe_invoice_id=stripe_invoice_id)
        
        invoice.status = 'failed'
        invoice.save(update_fields=['status'])
        
        # Create failed transaction
        PaymentTransaction.objects.create(
            invoice=invoice,
            amount=invoice_data['amount_due'] / 100,
            currency=invoice_data['currency'].upper(),
            gateway='stripe',
            status='failed',
            error_message='Payment failed',
            gateway_response=invoice_data
        )
        
        # Update subscription
        invoice.subscription.status = 'past_due'
        invoice.subscription.save(update_fields=['status'])
        
        logger.warning(f"Stripe payment failed for invoice {invoice.invoice_number}")
        
    except Invoice.DoesNotExist:
        logger.error(f"Invoice not found: {stripe_invoice_id}")


def handle_stripe_subscription_updated(subscription_data):
    """Handle Stripe subscription update."""
    stripe_subscription_id = subscription_data['id']
    
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_subscription_id
        )
        
        # Update status based on Stripe status
        status_map = {
            'active': 'active',
            'past_due': 'past_due',
            'canceled': 'canceled',
            'unpaid': 'past_due',
        }
        
        subscription.status = status_map.get(
            subscription_data['status'],
            subscription.status
        )
        subscription.save(update_fields=['status'])
        
        logger.info(f"Stripe subscription {subscription.id} updated")
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found: {stripe_subscription_id}")


def handle_stripe_subscription_deleted(subscription_data):
    """Handle Stripe subscription deletion."""
    stripe_subscription_id = subscription_data['id']
    
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_subscription_id
        )
        
        subscription.status = 'canceled'
        subscription.canceled_at = timezone.now()
        subscription.auto_renew = False
        subscription.save(update_fields=['status', 'canceled_at', 'auto_renew'])
        
        logger.info(f"Stripe subscription {subscription.id} deleted")
        
    except Subscription.DoesNotExist:
        logger.error(f"Subscription not found: {stripe_subscription_id}")
