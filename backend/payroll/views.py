"""
Payroll Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    PayrollCycle, Payslip, PayslipComponent
)
from .serializers import (
    SalaryComponentSerializer, SalaryStructureSerializer,
    PayrollCycleSerializer, PayslipSerializer, ProcessPayrollSerializer
)
from .utils import SalaryCalculator
from core.middleware import get_current_tenant


class SalaryComponentViewSet(viewsets.ModelViewSet):
    """ViewSet for SalaryComponent management."""
    
    serializer_class = SalaryComponentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['component_type', 'calculation_type', 'is_taxable', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'component_type']
    ordering = ['component_type', 'name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return SalaryComponent.objects.filter(tenant=tenant, is_deleted=False)


class SalaryStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for SalaryStructure management."""
    
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['staff', 'is_active']
    search_fields = ['staff__first_name', 'staff__last_name']
    ordering_fields = ['effective_from', 'base_salary']
    ordering = ['-effective_from']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return SalaryStructure.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('staff').prefetch_related('components__component')


class PayrollCycleViewSet(viewsets.ModelViewSet):
    """ViewSet for PayrollCycle management."""
    
    serializer_class = PayrollCycleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['year', 'month', 'status']
    search_fields = ['remarks']
    ordering_fields = ['year', 'month', 'processed_on']
    ordering = ['-year', '-month']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return PayrollCycle.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('processed_by')
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        Process payroll for a cycle.
        
        POST /api/payroll/cycles/{id}/process/
        {
            "staff_ids": ["uuid1", "uuid2"]  // Optional
        }
        """
        cycle = self.get_object()
        
        if cycle.status not in ['DRAFT', 'PROCESSING']:
            return Response(
                {'error': 'Only draft or processing cycles can be processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ProcessPayrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        staff_ids = serializer.validated_data.get('staff_ids')
        staff_list = None
        
        if staff_ids:
            from staff.models import Staff
            staff_list = Staff.objects.filter(
                tenant=cycle.tenant,
                id__in=staff_ids,
                is_active=True,
                is_deleted=False
            )
        
        # Update status
        cycle.status = 'PROCESSING'
        cycle.save()
        
        try:
            # Process payroll
            payslips = SalaryCalculator.process_payroll_cycle(cycle, staff_list)
            
            # Get updated cycle
            cycle.refresh_from_db()
            
            result_serializer = self.get_serializer(cycle)
            return Response({
                'cycle': result_serializer.data,
                'payslips_generated': len(payslips),
                'message': f'Successfully processed {len(payslips)} payslips'
            })
        
        except Exception as e:
            cycle.status = 'DRAFT'
            cycle.save()
            return Response(
                {'error': f'Error processing payroll: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def payslips(self, request, pk=None):
        """Get all payslips for a cycle."""
        cycle = self.get_object()
        payslips = cycle.payslips.filter(is_deleted=False)
        serializer = PayslipSerializer(payslips, many=True)
        return Response(serializer.data)


class PayslipViewSet(viewsets.ModelViewSet):
    """ViewSet for Payslip management."""
    
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payroll_cycle', 'staff']
    search_fields = ['staff__first_name', 'staff__last_name']
    ordering_fields = ['payroll_cycle__year', 'payroll_cycle__month', 'net_salary']
    ordering = ['-payroll_cycle__year', '-payroll_cycle__month']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Payslip.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related(
            'payroll_cycle',
            'staff',
            'salary_structure'
        ).prefetch_related('components__component')
    
    @action(detail=False, methods=['get'])
    def my_payslips(self, request):
        """Get payslips for current user."""
        # Note: Filter by request.user.staff
        payslips = self.get_queryset()
        serializer = self.get_serializer(payslips, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download PDF for a payslip."""
        from django.http import HttpResponse
        from .utils import PayslipPDFGenerator
        
        payslip = self.get_object()
        
        try:
            # Generate PDF
            pdf_buffer = PayslipPDFGenerator.generate_pdf(payslip)
            
            # Create filename
            staff_name = payslip.staff.get_full_name().replace(' ', '_')
            month_name = payslip.payroll_cycle.get_month_name()
            year = payslip.payroll_cycle.year
            filename = f"Payslip_{staff_name}_{month_name}{year}.pdf"
            
            # Create HTTP response
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error generating PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
