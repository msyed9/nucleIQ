"""
Fee Collection API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework import serializers as drf_serializers

from core.permissions import IsTenantUser
from .models import (
    FeeCategory, FeeStructure, FeeAllocation, FeeInvoice,
    FeeInvoiceItem, FeeTransaction, FeeDefaulter, SiblingDiscount
)
from .serializers import (
    FeeCategorySerializer, FeeStructureSerializer, FeeAllocationSerializer,
    FeeInvoiceSerializer, FeeTransactionSerializer, FeeDefaulterSerializer,
    SiblingDiscountSerializer
)
from .services import FeeCalculationService


class FeeCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Categories."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeCategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        return FeeCategory.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Structures."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeStructureSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['academic_year', 'class_level', 'category', 'frequency', 'is_active']
    
    def get_queryset(self):
        return FeeStructure.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('category', 'academic_year')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeAllocationViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Allocations."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeAllocationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'fee_structure', 'is_scholarship', 'is_active']
    
    def get_queryset(self):
        return FeeAllocation.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'fee_structure', 'fee_structure__category')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def bulk_allocate(self, request):
        """Bulk allocate fee structure to multiple students."""
        fee_structure_id = request.data.get('fee_structure_id')
        student_ids = request.data.get('student_ids', [])
        
        if not fee_structure_id or not student_ids:
            return Response(
                {'error': 'fee_structure_id and student_ids required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_count = 0
        for student_id in student_ids:
            FeeAllocation.objects.get_or_create(
                tenant=request.user.tenant,
                student_id=student_id,
                fee_structure_id=fee_structure_id,
                defaults={'is_active': True}
            )
            created_count += 1
        
        return Response({
            'message': f'Allocated to {created_count} students',
            'count': created_count
        })


class FeeInvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Invoices."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeInvoiceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'academic_year', 'status', 'is_sibling_consolidated']
    
    def get_queryset(self):
        return FeeInvoice.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'academic_year').prefetch_related('items')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def generate_monthly(self, request):
        """Generate monthly invoices for all students."""
        from datetime import date
        from tenants.models import AcademicYear
        
        academic_year = AcademicYear.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).first()
        
        if not academic_year:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        count = FeeCalculationService.generate_monthly_invoices(
            request.user.tenant,
            academic_year,
            date.today()
        )
        
        return Response({
            'message': f'Generated {count} invoices',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending invoices."""
        queryset = self.get_queryset().filter(status__in=['PENDING', 'PARTIAL'])
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class FeeTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Transactions."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeTransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['invoice', 'payment_mode']
    
    def get_queryset(self):
        return FeeTransaction.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('invoice', 'invoice__student', 'collected_by')
    
    def perform_create(self, serializer):
        """Record payment and update invoice."""
        invoice_id = self.request.data.get('invoice')
        amount = self.request.data.get('amount')
        payment_mode = self.request.data.get('payment_mode')
        payment_reference = self.request.data.get('payment_reference', '')
        
        try:
            invoice = FeeInvoice.objects.get(
                id=invoice_id,
                tenant=self.request.user.tenant
            )
        except FeeInvoice.DoesNotExist:
            raise drf_serializers.ValidationError({'invoice': 'Invoice not found'})
        
        transaction = FeeCalculationService.record_payment(
            invoice=invoice,
            amount=amount,
            payment_mode=payment_mode,
            payment_reference=payment_reference,
            collected_by=self.request.user
        )
        
        return Response(
            FeeTransactionSerializer(transaction).data,
            status=status.HTTP_201_CREATED
        )
    
    def create(self, request, *args, **kwargs):
        """Override create to use custom logic."""
        return self.perform_create(None)


class FeeDefaulterViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Fee Defaulters (Read-only)."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeDefaulterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['access_stopped']
    
    def get_queryset(self):
        return FeeDefaulter.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student')
    
    @action(detail=False, methods=['post'])
    def update_all(self, request):
        """Update defaulters list."""
        FeeCalculationService.update_defaulters(request.user.tenant)
        return Response({'message': 'Defaulters updated'})
    
    @action(detail=True, methods=['post'])
    def send_reminder(self, request, pk=None):
        """Send reminder to a defaulter."""
        defaulter = self.get_object()
        
        # TODO: Integrate with WhatsApp/SMS API
        
        defaulter.last_reminder_sent = timezone.now()
        defaulter.reminder_count += 1
        defaulter.save()
        
        return Response({'message': 'Reminder sent'})


class SiblingDiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for Sibling Discounts."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = SiblingDiscountSerializer
    
    def get_queryset(self):
        return SiblingDiscount.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
