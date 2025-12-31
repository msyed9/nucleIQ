"""
Views for Billing app
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from core.permissions import IsTenantUser, IsPlatformAdmin
from .models import SubscriptionPlan, Subscription, Invoice, PaymentTransaction
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionSerializer,
    InvoiceSerializer, PaymentTransactionSerializer,
    SubscriptionUpgradeSerializer, PaymentIntentSerializer,
    UsageLimitSerializer
)
from .services import BillingService


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subscription plans.
    Read-only for regular users, full CRUD for platform admins.
    """
    
    queryset = SubscriptionPlan.objects.filter(is_active=True, is_public=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter plans based on user permissions."""
        if self.request.user.is_platform_admin:
            return SubscriptionPlan.objects.all()
        return super().get_queryset()
    
    @action(detail=True, methods=['get'])
    def pricing(self, request, pk=None):
        """Get pricing details for all billing cycles."""
        plan = self.get_object()
        
        return Response({
            'plan_name': plan.name,
            'pricing': {
                'monthly': {
                    'amount': float(plan.price_monthly),
                    'currency': plan.currency,
                    'per_month': float(plan.price_monthly),
                },
                'quarterly': {
                    'amount': float(plan.price_quarterly),
                    'currency': plan.currency,
                    'per_month': float(plan.price_quarterly / 3),
                    'savings': float(plan.price_monthly * 3 - plan.price_quarterly),
                },
                'yearly': {
                    'amount': float(plan.price_yearly),
                    'currency': plan.currency,
                    'per_month': float(plan.price_yearly / 12),
                    'savings': float(plan.price_monthly * 12 - plan.price_yearly),
                },
            },
            'limits': {
                'students': plan.max_students,
                'staff': plan.max_staff,
                'storage_gb': plan.max_storage_gb,
            },
            'features': plan.features,
        })


class SubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing subscriptions."""
    
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Filter subscriptions by tenant."""
        if self.request.user.is_platform_admin:
            return Subscription.objects.all()
        return Subscription.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's tenant subscription."""
        try:
            subscription = Subscription.objects.get(tenant=request.user.tenant)
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def upgrade(self, request, pk=None):
        """Upgrade/downgrade subscription to a different plan."""
        subscription = self.get_object()
        serializer = SubscriptionUpgradeSerializer(data=request.data)
        
        if serializer.is_valid():
            new_plan = SubscriptionPlan.objects.get(
                id=serializer.validated_data['new_plan_id']
            )
            billing_cycle = serializer.validated_data['billing_cycle']
            
            # Update subscription
            subscription.plan = new_plan
            subscription.billing_cycle = billing_cycle
            subscription.save(update_fields=['plan', 'billing_cycle'])
            
            # Create new invoice for prorated amount
            billing_service = BillingService()
            invoice = billing_service.create_invoice_for_subscription(subscription)
            
            return Response({
                'message': 'Subscription upgraded successfully',
                'subscription': SubscriptionSerializer(subscription).data,
                'invoice': InvoiceSerializer(invoice).data,
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel subscription at end of billing period."""
        subscription = self.get_object()
        
        # Cancel with payment gateway
        billing_service = BillingService()
        
        if subscription.razorpay_subscription_id:
            billing_service.razorpay.cancel_subscription(
                subscription.razorpay_subscription_id
            )
        elif subscription.stripe_subscription_id:
            billing_service.stripe.cancel_subscription(
                subscription.stripe_subscription_id
            )
        
        # Update local subscription
        subscription.auto_renew = False
        subscription.canceled_at = timezone.now()
        subscription.save(update_fields=['auto_renew', 'canceled_at'])
        
        return Response({
            'message': 'Subscription will be canceled at end of billing period',
            'cancels_at': subscription.current_period_end,
        })
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a canceled subscription."""
        subscription = self.get_object()
        
        if subscription.status != 'canceled':
            return Response(
                {'error': 'Only canceled subscriptions can be reactivated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscription.status = 'active'
        subscription.auto_renew = True
        subscription.canceled_at = None
        subscription.save(update_fields=['status', 'auto_renew', 'canceled_at'])
        
        return Response({
            'message': 'Subscription reactivated successfully',
            'subscription': SubscriptionSerializer(subscription).data,
        })
    
    @action(detail=False, methods=['post'])
    def check_limit(self, request):
        """Check if tenant is within subscription limits."""
        serializer = UsageLimitSerializer(data=request.data)
        
        if serializer.is_valid():
            resource_type = serializer.validated_data['resource_type']
            
            billing_service = BillingService()
            limit_check = billing_service.check_subscription_limits(
                request.user.tenant,
                resource_type
            )
            
            response_serializer = UsageLimitSerializer(limit_check)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing invoices."""
    
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Filter invoices by tenant."""
        if self.request.user.is_platform_admin:
            return Invoice.objects.all()
        return Invoice.objects.filter(
            subscription__tenant=self.request.user.tenant
        )
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Initiate payment for an invoice."""
        invoice = self.get_object()
        serializer = PaymentIntentSerializer(data={
            'invoice_id': str(invoice.id),
            **request.data
        })
        
        if serializer.is_valid():
            gateway = serializer.validated_data['gateway']
            
            billing_service = BillingService()
            payment_response = billing_service.process_payment(invoice, gateway)
            
            return Response({
                'message': 'Payment initiated',
                'payment_link': payment_response.get('short_url') or payment_response.get('url'),
                'gateway': gateway,
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming invoice for current subscription."""
        try:
            subscription = Subscription.objects.get(tenant=request.user.tenant)
            
            # Find next invoice
            upcoming_invoice = Invoice.objects.filter(
                subscription=subscription,
                status='pending',
                due_date__gte=timezone.now().date()
            ).order_by('due_date').first()
            
            if upcoming_invoice:
                serializer = self.get_serializer(upcoming_invoice)
                return Response(serializer.data)
            
            return Response(
                {'message': 'No upcoming invoice'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription'},
                status=status.HTTP_404_NOT_FOUND
            )


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payment transactions."""
    
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Filter transactions by tenant."""
        if self.request.user.is_platform_admin:
            return PaymentTransaction.objects.all()
        return PaymentTransaction.objects.filter(
            invoice__subscription__tenant=self.request.user.tenant
        )
