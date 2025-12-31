"""
URL Configuration for Billing app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet, SubscriptionViewSet,
    InvoiceViewSet, PaymentTransactionViewSet
)
from .webhooks import razorpay_webhook, stripe_webhook

# Create router
router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'transactions', PaymentTransactionViewSet, basename='transaction')

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
    
    # Webhook endpoints
    path('webhooks/razorpay/', razorpay_webhook, name='razorpay-webhook'),
    path('webhooks/stripe/', stripe_webhook, name='stripe-webhook'),
]
