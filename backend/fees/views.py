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
