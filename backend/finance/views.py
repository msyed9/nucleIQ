"""
Finance API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import date, datetime

from core.permissions import IsTenantUser
from .models import (
    LedgerAccount, JournalEntry, JournalEntryLine,
    PettyCashRequest, VendorPayment, SalaryPayment
)
from .serializers import (
    LedgerAccountSerializer, JournalEntrySerializer,
    PettyCashRequestSerializer, VendorPaymentSerializer,
    SalaryPaymentSerializer
)
from .services import AccountingService
from .reports import FinancialReportsService


class LedgerAccountViewSet(viewsets.ModelViewSet):
    """ViewSet for Ledger Accounts."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = LedgerAccountSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['account_type', 'is_active']
    
    def get_queryset(self):
        return LedgerAccount.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class JournalEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for Journal Entries."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = JournalEntrySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'is_posted', 'reference_type']
    
    def get_queryset(self):
        return JournalEntry.objects.filter(
            tenant=self.request.user.tenant
        ).prefetch_related('lines', 'lines__account')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def post_entry(self, request, pk=None):
        """Post a journal entry."""
        entry = self.get_object()
        
        if entry.is_posted:
            return Response(
                {'error': 'Entry is already posted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            entry.post(request.user)
            return Response({
                'message': 'Entry posted successfully',
                'entry': JournalEntrySerializer(entry).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PettyCashRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Petty Cash Requests."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = PettyCashRequestSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'category']
    
    def get_queryset(self):
        return PettyCashRequest.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('requested_by', 'approved_by', 'journal_entry')
    
    def perform_create(self, serializer):
        # Generate request number
        from django.db.models import Max
        today = date.today()
        prefix = f"PC{today.year}{today.month:02d}"
        
        last_request = PettyCashRequest.objects.filter(
            tenant=self.request.user.tenant,
            request_number__startswith=prefix
        ).aggregate(Max('request_number'))
        
        if last_request['request_number__max']:
            last_number = int(last_request['request_number__max'][-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        request_number = f"{prefix}{new_number:04d}"
        
        serializer.save(
            tenant=self.request.user.tenant,
            requested_by=self.request.user,
            request_number=request_number
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a petty cash request."""
        petty_cash = self.get_object()
        
        if petty_cash.status != 'PENDING':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        petty_cash.status = 'APPROVED'
        petty_cash.approved_by = request.user
        petty_cash.approved_at = timezone.now()
        petty_cash.save()
        
        return Response({
            'message': 'Request approved successfully',
            'request': PettyCashRequestSerializer(petty_cash).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a petty cash request."""
        petty_cash = self.get_object()
        
        if petty_cash.status != 'PENDING':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('rejection_reason', '')
        
        petty_cash.status = 'REJECTED'
        petty_cash.approved_by = request.user
        petty_cash.approved_at = timezone.now()
        petty_cash.rejection_reason = rejection_reason
        petty_cash.save()
        
        return Response({
            'message': 'Request rejected',
            'request': PettyCashRequestSerializer(petty_cash).data
        })
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Pay an approved petty cash request."""
        petty_cash = self.get_object()
        
        if petty_cash.status != 'APPROVED':
            return Response(
                {'error': 'Request must be approved first'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            entry = AccountingService.create_petty_cash_entry(
                self.request.user.tenant,
                petty_cash,
                request.user
            )
            
            return Response({
                'message': 'Payment recorded successfully',
                'request': PettyCashRequestSerializer(petty_cash).data,
                'journal_entry': JournalEntrySerializer(entry).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class VendorPaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Vendor Payments."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = VendorPaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'vendor_type', 'payment_mode']
    
    def get_queryset(self):
        return VendorPayment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('journal_entry')
    
    def perform_create(self, serializer):
        # Generate payment number
        from django.db.models import Max
        today = date.today()
        prefix = f"VP{today.year}{today.month:02d}"
        
        last_payment = VendorPayment.objects.filter(
            tenant=self.request.user.tenant,
            payment_number__startswith=prefix
        ).aggregate(Max('payment_number'))
        
        if last_payment['payment_number__max']:
            last_number = int(last_payment['payment_number__max'][-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        payment_number = f"{prefix}{new_number:04d}"
        
        serializer.save(
            tenant=self.request.user.tenant,
            payment_number=payment_number
        )
    
    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record vendor payment and create journal entry."""
        vendor_payment = self.get_object()
        
        if vendor_payment.status == 'PAID':
            return Response(
                {'error': 'Payment already recorded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            entry = AccountingService.create_vendor_payment_entry(
                self.request.user.tenant,
                vendor_payment,
                request.user
            )
            
            return Response({
                'message': 'Payment recorded successfully',
                'payment': VendorPaymentSerializer(vendor_payment).data,
                'journal_entry': JournalEntrySerializer(entry).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class SalaryPaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Salary Payments."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = SalaryPaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'staff']
    
    def get_queryset(self):
        return SalaryPayment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff', 'journal_entry')
    
    def perform_create(self, serializer):
        # Generate payment number
        from django.db.models import Max
        today = date.today()
        prefix = f"SAL{today.year}{today.month:02d}"
        
        last_payment = SalaryPayment.objects.filter(
            tenant=self.request.user.tenant,
            payment_number__startswith=prefix
        ).aggregate(Max('payment_number'))
        
        if last_payment['payment_number__max']:
            last_number = int(last_payment['payment_number__max'][-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        payment_number = f"{prefix}{new_number:04d}"
        
        serializer.save(
            tenant=self.request.user.tenant,
            payment_number=payment_number
        )
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process salary payment and create journal entry."""
        salary_payment = self.get_object()
        
        if salary_payment.status == 'PAID':
            return Response(
                {'error': 'Salary already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            entry = AccountingService.create_salary_payment_entry(
                self.request.user.tenant,
                salary_payment,
                request.user
            )
            
            return Response({
                'message': 'Salary payment processed successfully',
                'payment': SalaryPaymentSerializer(salary_payment).data,
                'journal_entry': JournalEntrySerializer(entry).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class FinancialReportsViewSet(viewsets.ViewSet):
    """ViewSet for Financial Reports."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    @action(detail=False, methods=['get'])
    def income_statement(self, request):
        """Generate Income Statement (P&L)."""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        report = FinancialReportsService.get_income_statement(
            request.user.tenant,
            start_date,
            end_date
        )
        
        return Response(report)
    
    @action(detail=False, methods=['get'])
    def balance_sheet(self, request):
        """Generate Balance Sheet."""
        as_of_date = request.query_params.get('as_of_date')
        
        if not as_of_date:
            as_of_date = date.today()
        else:
            as_of_date = datetime.strptime(as_of_date, '%Y-%m-%d').date()
        
        report = FinancialReportsService.get_balance_sheet(
            request.user.tenant,
            as_of_date
        )
        
        return Response(report)
    
    @action(detail=False, methods=['get'])
    def day_book(self, request):
        """Generate Day Book."""
        date_val = request.query_params.get('date')
        
        if not date_val:
            date_val = date.today()
        else:
            date_val = datetime.strptime(date_val, '%Y-%m-%d').date()
        
        report = FinancialReportsService.get_day_book(
            request.user.tenant,
            date_val
        )
        
        return Response(report)
