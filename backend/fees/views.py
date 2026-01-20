"""
Fee Collection API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction as db_transaction
from rest_framework import serializers as drf_serializers
from decimal import Decimal

from core.permissions import IsTenantUser
from .models import (
    FeeCategory, FeeStructure, FeeAllocation, FeeInvoice,
    FeeInvoiceItem, FeeTransaction, FeeDefaulter, SiblingDiscount,
    FeeTransactionItem, FeeAdvancePayment, FeeRefund
)
from .serializers import (
    FeeCategorySerializer, FeeStructureSerializer, FeeAllocationSerializer,
    FeeInvoiceSerializer, FeeTransactionSerializer, FeeDefaulterSerializer,
    SiblingDiscountSerializer, FeeTransactionItemSerializer,
    FeeAdvancePaymentSerializer, FeeRefundSerializer,
    CollectPaymentSerializer, CreateAdvancePaymentSerializer,
    RefundRequestSerializer, ProcessRefundSerializer
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
        """Get pending invoices with optional filters."""
        from django.db.models import Q
        
        queryset = self.get_queryset().filter(status__in=['PENDING', 'PARTIAL'])
        
        # Apply class filter via enrollment
        class_filter = request.query_params.get('class_name')
        if class_filter:
            queryset = queryset.filter(
                student__enrollments__section__grade_level__name__icontains=class_filter,
                student__enrollments__status='ACTIVE'
            )
        
        # Apply section filter via enrollment
        section_filter = request.query_params.get('section')
        if section_filter:
            queryset = queryset.filter(
                student__enrollments__section__name__icontains=section_filter,
                student__enrollments__status='ACTIVE'
            )
        
        # Apply status filter (within pending/partial)
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in ['PENDING', 'PARTIAL']:
            queryset = queryset.filter(status=status_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def category_report(self, request):
        """Get category-wise collection report."""
        from django.db.models import Sum, Count
        from datetime import datetime
        
        # Get date range from query params
        date_from = request.query_params.get('from_date')
        date_to = request.query_params.get('to_date')
        
        # Get all categories for this tenant
        categories = FeeCategory.objects.filter(tenant=request.user.tenant, is_active=True)
        
        report_data = []
        
        for category in categories:
            # Get invoice items for this category
            invoice_items = FeeInvoiceItem.objects.filter(
                invoice__tenant=request.user.tenant,
                fee_allocation__fee_structure__category=category
            )
            
            if date_from:
                invoice_items = invoice_items.filter(
                    invoice__invoice_date__gte=datetime.strptime(date_from, '%Y-%m-%d').date()
                )
            if date_to:
                invoice_items = invoice_items.filter(
                    invoice__invoice_date__lte=datetime.strptime(date_to, '%Y-%m-%d').date()
                )
            
            totals = invoice_items.aggregate(
                total_invoiced=Sum('amount'),
                total_paid=Sum('paid_amount')
            )
            
            total_invoiced = totals['total_invoiced'] or Decimal('0')
            total_paid = totals['total_paid'] or Decimal('0')
            total_pending = total_invoiced - total_paid
            
            # Count transactions for this category
            transaction_count = FeeTransactionItem.objects.filter(
                transaction__tenant=request.user.tenant,
                invoice_item__fee_allocation__fee_structure__category=category
            ).count()
            
            collection_percentage = 0
            if total_invoiced > 0:
                collection_percentage = float(total_paid / total_invoiced * 100)
            
            report_data.append({
                'category_id': str(category.id),
                'category_name': category.name,
                'category_code': category.code,
                'total_invoiced': float(total_invoiced),
                'total_collected': float(total_paid),
                'total_pending': float(total_pending),
                'collection_percentage': round(collection_percentage, 2),
                'transaction_count': transaction_count
            })
        
        return Response(report_data)
    
    @action(detail=False, methods=['get'])
    def student_ledger(self, request):
        """Get complete ledger for a student."""
        from students.models import Student
        
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = Student.objects.get(id=student_id, tenant=request.user.tenant)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        ledger_entries = []
        running_balance = Decimal('0')
        
        # Get invoices
        invoices = FeeInvoice.objects.filter(
            student=student
        ).prefetch_related('items').order_by('invoice_date')
        
        for inv in invoices:
            running_balance += inv.total_amount
            item_names = ', '.join([
                item.fee_allocation.fee_structure.category.name 
                for item in inv.items.all() 
                if item.fee_allocation and item.fee_allocation.fee_structure
            ]) or 'Monthly Fee'
            
            ledger_entries.append({
                'date': inv.invoice_date.isoformat(),
                'type': 'INVOICE',
                'reference': inv.invoice_number,
                'description': f'Fee Invoice - {item_names}',
                'debit': float(inv.total_amount),
                'credit': 0,
                'balance': float(running_balance)
            })
        
        # Get transactions
        transactions = FeeTransaction.objects.filter(
            invoice__student=student
        ).order_by('transaction_date')
        
        for txn in transactions:
            running_balance -= txn.amount
            ref_info = f' ({txn.payment_reference})' if txn.payment_reference else ''
            ledger_entries.append({
                'date': txn.transaction_date.isoformat(),
                'type': 'PAYMENT',
                'reference': txn.receipt_number,
                'description': f'Payment - {txn.payment_mode}{ref_info}',
                'debit': 0,
                'credit': float(txn.amount),
                'balance': float(running_balance)
            })
        
        # Get advance payments
        advances = FeeAdvancePayment.objects.filter(
            student=student
        ).order_by('created_at')
        
        for adv in advances:
            running_balance -= adv.amount
            ledger_entries.append({
                'date': adv.created_at.isoformat(),
                'type': 'ADVANCE',
                'reference': f'ADV-{str(adv.id)[:8]}',
                'description': f'Advance Payment - {adv.fee_category.name}',
                'debit': 0,
                'credit': float(adv.amount),
                'balance': float(running_balance),
                'category': adv.fee_category.name
            })
        
        # Get refunds
        refunds = FeeRefund.objects.filter(
            student=student,
            status='PROCESSED'
        ).order_by('processed_at')
        
        for ref in refunds:
            running_balance += ref.refund_amount
            ledger_entries.append({
                'date': (ref.processed_at or ref.created_at).isoformat(),
                'type': 'REFUND',
                'reference': f'REF-{str(ref.id)[:8]}',
                'description': f'Refund - {ref.fee_category.name}: {ref.reason}',
                'debit': float(ref.refund_amount),
                'credit': 0,
                'balance': float(running_balance),
                'category': ref.fee_category.name
            })
        
        # Sort by date
        ledger_entries.sort(key=lambda x: x['date'])
        
        # Recalculate running balance after sorting
        balance = Decimal('0')
        for entry in ledger_entries:
            balance += Decimal(str(entry['debit'])) - Decimal(str(entry['credit']))
            entry['balance'] = float(balance)
        
        # Category summary
        category_summary = {}
        for inv in invoices:
            for item in inv.items.all():
                if item.fee_allocation and item.fee_allocation.fee_structure:
                    cat_name = item.fee_allocation.fee_structure.category.name
                    if cat_name not in category_summary:
                        category_summary[cat_name] = {
                            'category_name': cat_name,
                            'total_invoiced': 0,
                            'total_paid': 0,
                            'balance': 0
                        }
                    category_summary[cat_name]['total_invoiced'] += float(item.amount)
                    category_summary[cat_name]['total_paid'] += float(item.paid_amount)
                    category_summary[cat_name]['balance'] += float(item.balance_amount)
        
        # Get current enrollment for class/section info
        current_enrollment = student.get_current_enrollment()
        
        return Response({
            'student': {
                'id': str(student.id),
                'full_name': student.get_full_name(),
                'admission_number': student.admission_number,
                'class_name': current_enrollment.section.grade_level.name if current_enrollment and current_enrollment.section else None,
                'section_name': current_enrollment.section.name if current_enrollment and current_enrollment.section else None
            },
            'ledger_entries': ledger_entries,
            'category_summary': list(category_summary.values()),
            'current_balance': float(balance),
            'total_debit': sum(e['debit'] for e in ledger_entries),
            'total_credit': sum(e['credit'] for e in ledger_entries)
        })


class FeeTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Transactions."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeTransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['invoice', 'payment_mode']
    
    def get_queryset(self):
        return FeeTransaction.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('invoice', 'invoice__student', 'collected_by').prefetch_related('items')
    
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
    
    @action(detail=False, methods=['post'])
    def collect_with_breakdown(self, request):
        """
        Collect payment with category-wise breakdown.
        Allows cashier to manually allocate payment to specific fee categories.
        """
        serializer = CollectPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        try:
            invoice = FeeInvoice.objects.get(
                id=data['invoice_id'],
                tenant=request.user.tenant
            )
        except FeeInvoice.DoesNotExist:
            return Response(
                {'error': 'Invoice not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate total amount
        total_amount = sum(item['amount'] for item in data['items'])
        
        with db_transaction.atomic():
            # Create the transaction
            transaction = FeeCalculationService.record_payment(
                invoice=invoice,
                amount=total_amount,
                payment_mode=data['payment_mode'],
                payment_reference=data.get('payment_reference', ''),
                collected_by=request.user,
                remarks=data.get('remarks', '')
            )
            
            # Create transaction items for category-wise tracking
            for item_data in data['items']:
                try:
                    invoice_item = FeeInvoiceItem.objects.get(
                        id=item_data['invoice_item_id'],
                        invoice=invoice
                    )
                except FeeInvoiceItem.DoesNotExist:
                    # Rollback will happen automatically
                    return Response(
                        {'error': f"Invoice item {item_data['invoice_item_id']} not found"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                FeeTransactionItem.objects.create(
                    transaction=transaction,
                    invoice_item=invoice_item,
                    amount=item_data['amount'],
                    is_advance=item_data.get('is_advance', False),
                    remarks=item_data.get('remarks', '')
                )
        
        # Return the transaction with items
        transaction_serializer = FeeTransactionSerializer(transaction)
        response_data = transaction_serializer.data
        response_data['items'] = FeeTransactionItemSerializer(
            transaction.items.all(), many=True
        ).data
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def breakdown(self, request, pk=None):
        """Get category-wise breakdown of a transaction."""
        transaction = self.get_object()
        items = transaction.items.all().select_related(
            'invoice_item__fee_allocation__fee_structure__category'
        )
        
        return Response({
            'transaction': FeeTransactionSerializer(transaction).data,
            'items': FeeTransactionItemSerializer(items, many=True).data
        })


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
        """Send reminder to a defaulter via SMS or WhatsApp."""
        from communication.services import SMSService, WhatsAppService
        from communication.models import MessageLog
        from students.models import Student
        import logging
        
        logger = logging.getLogger(__name__)
        defaulter = self.get_object()
        notification_type = request.data.get('notification_type', 'both')  # 'sms', 'whatsapp', or 'both'
        
        # Get student details
        student = defaulter.student
        parent_phone = student.parent_phone or student.guardian_phone
        
        if not parent_phone:
            return Response(
                {'error': 'No phone number available for this student'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = {'sms': None, 'whatsapp': None}
        errors = []
        
        # Send WhatsApp notification if requested
        if notification_type in ['whatsapp', 'both']:
            try:
                result = WhatsAppService.send_overdue_reminder(
                    to_phone=parent_phone,
                    student_name=student.full_name,
                    amount=str(defaulter.pending_amount),
                    due_date=defaulter.last_invoice.due_date.strftime('%d-%b-%Y') if defaulter.last_invoice else 'N/A'
                )
                
                if result['success']:
                    # Log the message
                    MessageLog.objects.create(
                        tenant=request.user.tenant,
                        recipient=parent_phone,
                        message_type='WHATSAPP',
                        subject='Fee Overdue Reminder',
                        content=result.get('message', ''),
                        status='SENT',
                        provider=result.get('provider', 'whatsapp'),
                        provider_message_id=result.get('message_id', '')
                    )
                    results['whatsapp'] = 'sent'
                else:
                    errors.append(f"WhatsApp: {result.get('error', 'Unknown error')}")
                    results['whatsapp'] = 'failed'
                    
            except Exception as e:
                logger.error(f"Error sending WhatsApp to {parent_phone}: {str(e)}")
                errors.append(f"WhatsApp: {str(e)}")
                results['whatsapp'] = 'failed'
        
        # Send SMS notification if requested
        if notification_type in ['sms', 'both']:
            try:
                message = f"Dear Parent, Fee of Rs.{defaulter.pending_amount} for {student.full_name} is overdue. Please pay at the earliest. - {request.user.tenant.name}"
                
                result = SMSService.send_sms(
                    to_phone=parent_phone,
                    message=message
                )
                
                if result['success']:
                    # Log the message
                    MessageLog.objects.create(
                        tenant=request.user.tenant,
                        recipient=parent_phone,
                        message_type='SMS',
                        subject='Fee Overdue Reminder',
                        content=message,
                        status='SENT',
                        provider=result.get('provider', 'sms'),
                        provider_message_id=result.get('message_id', '')
                    )
                    results['sms'] = 'sent'
                else:
                    errors.append(f"SMS: {result.get('error', 'Unknown error')}")
                    results['sms'] = 'failed'
                    
            except Exception as e:
                logger.error(f"Error sending SMS to {parent_phone}: {str(e)}")
                errors.append(f"SMS: {str(e)}")
                results['sms'] = 'failed'
        
        # Update defaulter record
        defaulter.last_reminder_sent = timezone.now()
        defaulter.reminder_count += 1
        defaulter.save()
        
        # Prepare response
        if errors:
            return Response({
                'message': 'Reminder sent with some errors',
                'results': results,
                'errors': errors
            }, status=status.HTTP_207_MULTI_STATUS)
        else:
            return Response({
                'message': 'Reminder sent successfully',
                'results': results
            })
    
    @action(detail=False, methods=['post'])
    def send_bulk_reminders(self, request):
        """Send reminders to multiple defaulters."""
        from communication.services import SMSService, WhatsAppService
        from communication.models import MessageLog
        from students.models import Student
        import logging
        
        logger = logging.getLogger(__name__)
        notification_type = request.data.get('notification_type', 'both')  # 'sms', 'whatsapp', or 'both'
        defaulter_ids = request.data.get('defaulter_ids', [])
        
        if not defaulter_ids:
            # Send to all defaulters if no specific IDs provided
            defaulters = self.get_queryset().filter(pending_amount__gt=0)
        else:
            defaulters = self.get_queryset().filter(id__in=defaulter_ids)
        
        total = defaulters.count()
        success_count = 0
        failed_count = 0
        errors = []
        
        for defaulter in defaulters:
            student = defaulter.student
            parent_phone = student.parent_phone or student.guardian_phone
            
            if not parent_phone:
                failed_count += 1
                errors.append(f"{student.full_name}: No phone number")
                continue
            
            notification_sent = False
            
            # Send WhatsApp notification if requested
            if notification_type in ['whatsapp', 'both']:
                try:
                    result = WhatsAppService.send_overdue_reminder(
                        to_phone=parent_phone,
                        student_name=student.full_name,
                        amount=str(defaulter.pending_amount),
                        due_date=defaulter.last_invoice.due_date.strftime('%d-%b-%Y') if defaulter.last_invoice else 'N/A'
                    )
                    
                    if result['success']:
                        MessageLog.objects.create(
                            tenant=request.user.tenant,
                            recipient=parent_phone,
                            message_type='WHATSAPP',
                            subject='Fee Overdue Reminder',
                            content=result.get('message', ''),
                            status='SENT',
                            provider=result.get('provider', 'whatsapp'),
                            provider_message_id=result.get('message_id', '')
                        )
                        notification_sent = True
                    else:
                        errors.append(f"{student.full_name}: WhatsApp failed - {result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    logger.error(f"Error sending WhatsApp to {parent_phone}: {str(e)}")
                    errors.append(f"{student.full_name}: WhatsApp error - {str(e)}")
            
            # Send SMS notification if requested
            if notification_type in ['sms', 'both']:
                try:
                    message = f"Dear Parent, Fee of Rs.{defaulter.pending_amount} for {student.full_name} is overdue. Please pay at the earliest. - {request.user.tenant.name}"
                    
                    result = SMSService.send_sms(
                        to_phone=parent_phone,
                        message=message
                    )
                    
                    if result['success']:
                        MessageLog.objects.create(
                            tenant=request.user.tenant,
                            recipient=parent_phone,
                            message_type='SMS',
                            subject='Fee Overdue Reminder',
                            content=message,
                            status='SENT',
                            provider=result.get('provider', 'sms'),
                            provider_message_id=result.get('message_id', '')
                        )
                        notification_sent = True
                    else:
                        errors.append(f"{student.full_name}: SMS failed - {result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    logger.error(f"Error sending SMS to {parent_phone}: {str(e)}")
                    errors.append(f"{student.full_name}: SMS error - {str(e)}")
            
            # Update defaulter record
            if notification_sent:
                defaulter.last_reminder_sent = timezone.now()
                defaulter.reminder_count += 1
                defaulter.save()
                success_count += 1
            else:
                failed_count += 1
        
        return Response({
            'message': f'Bulk reminders sent to {success_count} out of {total} defaulters',
            'total': total,
            'success_count': success_count,
            'failed_count': failed_count,
            'errors': errors[:10]  # Limit to first 10 errors
        })


class SiblingDiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for Sibling Discounts."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = SiblingDiscountSerializer
    
    def get_queryset(self):
        return SiblingDiscount.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeAdvancePaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Advance Payments."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeAdvancePaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'fee_category', 'status']
    
    def get_queryset(self):
        return FeeAdvancePayment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'fee_category', 'transaction')
    
    @action(detail=False, methods=['post'])
    def create_advance(self, request):
        """
        Create an advance payment for a specific fee category.
        """
        serializer = CreateAdvancePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        from students.models import Student
        
        try:
            student = Student.objects.get(
                id=data['student_id'],
                tenant=request.user.tenant
            )
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            category = FeeCategory.objects.get(
                id=data['fee_category_id'],
                tenant=request.user.tenant
            )
        except FeeCategory.DoesNotExist:
            return Response(
                {'error': 'Fee category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        with db_transaction.atomic():
            # Create a transaction without invoice (for advance)
            transaction = FeeTransaction.objects.create(
                tenant=request.user.tenant,
                invoice=None,  # No invoice for advance payments
                transaction_number=FeeCalculationService._generate_transaction_number(request.user.tenant),
                amount=data['amount'],
                payment_mode=data['payment_mode'],
                payment_reference=data.get('payment_reference', ''),
                collected_by=request.user,
                remarks=f"Advance payment for {category.name}: {data.get('remarks', '')}"
            )
            
            # Create advance payment record
            advance = FeeAdvancePayment.objects.create(
                tenant=request.user.tenant,
                student=student,
                fee_category=category,
                transaction=transaction,
                amount=data['amount'],
                balance_amount=data['amount'],
                advance_for_months=data.get('advance_for_months', 1),
                remarks=data.get('remarks', '')
            )
        
        return Response(
            FeeAdvancePaymentSerializer(advance).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def student_advances(self, request):
        """Get all available advances for a student."""
        student_id = request.query_params.get('student_id')
        
        if not student_id:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        advances = self.get_queryset().filter(
            student_id=student_id,
            status__in=['AVAILABLE', 'PARTIALLY_USED']
        )
        
        return Response(FeeAdvancePaymentSerializer(advances, many=True).data)


class FeeRefundViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee Refunds."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = FeeRefundSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'fee_category', 'status']
    
    def get_queryset(self):
        return FeeRefund.objects.filter(
            tenant=self.request.user.tenant
        ).select_related(
            'student', 'fee_category', 'original_transaction',
            'invoice_item', 'requested_by', 'approved_by'
        )
    
    @action(detail=False, methods=['post'])
    def request_refund(self, request):
        """
        Request a refund for a specific fee category.
        """
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        from students.models import Student
        
        try:
            student = Student.objects.get(
                id=data['student_id'],
                tenant=request.user.tenant
            )
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            category = FeeCategory.objects.get(
                id=data['fee_category_id'],
                tenant=request.user.tenant
            )
        except FeeCategory.DoesNotExist:
            return Response(
                {'error': 'Fee category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get optional related objects
        invoice_item = None
        original_transaction = None
        
        if 'invoice_item_id' in data and data['invoice_item_id']:
            try:
                invoice_item = FeeInvoiceItem.objects.get(
                    id=data['invoice_item_id'],
                    invoice__tenant=request.user.tenant
                )
            except FeeInvoiceItem.DoesNotExist:
                return Response(
                    {'error': 'Invoice item not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if 'original_transaction_id' in data and data['original_transaction_id']:
            try:
                original_transaction = FeeTransaction.objects.get(
                    id=data['original_transaction_id'],
                    tenant=request.user.tenant
                )
            except FeeTransaction.DoesNotExist:
                return Response(
                    {'error': 'Original transaction not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        refund = FeeRefund.objects.create(
            tenant=request.user.tenant,
            student=student,
            fee_category=category,
            original_transaction=original_transaction,
            invoice_item=invoice_item,
            refund_amount=data['refund_amount'],
            reason=data['reason'],
            requested_by=request.user,
            remarks=data.get('remarks', '')
        )
        
        return Response(
            FeeRefundSerializer(refund).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a refund request."""
        refund = self.get_object()
        
        if refund.status != 'PENDING':
            return Response(
                {'error': 'Only pending refunds can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refund.approve(request.user)
        
        return Response(FeeRefundSerializer(refund).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a refund request."""
        refund = self.get_object()
        
        if refund.status != 'PENDING':
            return Response(
                {'error': 'Only pending refunds can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refund.status = 'REJECTED'
        refund.remarks = request.data.get('remarks', refund.remarks)
        refund.save()
        
        return Response(FeeRefundSerializer(refund).data)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process an approved refund."""
        refund = self.get_object()
        
        serializer = ProcessRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        try:
            refund.process(
                refund_mode=data['refund_mode'],
                reference=data.get('refund_reference', '')
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(FeeRefundSerializer(refund).data)
