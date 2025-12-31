"""
HR Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import LeaveType, LeaveBalance, LeaveApplication
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer,
    LeaveApplicationSerializer, LeaveApplicationCreateSerializer,
    LeaveApprovalSerializer
)
from core.middleware import get_current_tenant


class LeaveTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveType management."""
    
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_paid', 'requires_approval', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'default_quota']
    ordering = ['name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return LeaveType.objects.filter(tenant=tenant, is_deleted=False)


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveBalance management."""
    
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['staff', 'leave_type', 'academic_year']
    search_fields = ['staff__first_name', 'staff__last_name']
    ordering_fields = ['total_quota', 'used', 'available']
    ordering = ['staff__first_name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return LeaveBalance.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('staff', 'leave_type', 'academic_year')
    
    @action(detail=False, methods=['get'])
    def my_balances(self, request):
        """Get leave balances for current user."""
        # Note: Get staff from request.user
        # For now, return all balances
        balances = self.get_queryset()
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)


class LeaveApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveApplication management."""
    
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['staff', 'leave_type', 'status']
    search_fields = ['staff__first_name', 'staff__last_name', 'reason']
    ordering_fields = ['applied_on', 'start_date']
    ordering = ['-applied_on']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return LeaveApplication.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('staff', 'leave_type', 'approved_by')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LeaveApplicationCreateSerializer
        return LeaveApplicationSerializer
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit leave application for approval."""
        application = self.get_object()
        
        if application.status != 'DRAFT':
            return Response(
                {'error': 'Only draft applications can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.submit()
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve leave application."""
        application = self.get_object()
        
        if application.status != 'PENDING':
            return Response(
                {'error': 'Only pending applications can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = LeaveApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Note: Get approver from request.user.staff
        # For now, using the application's staff
        approver = application.staff
        
        application.approve(
            approved_by=approver,
            remarks=serializer.validated_data.get('remarks', '')
        )
        
        result_serializer = self.get_serializer(application)
        return Response(result_serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject leave application."""
        application = self.get_object()
        
        if application.status != 'PENDING':
            return Response(
                {'error': 'Only pending applications can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = LeaveApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Note: Get rejector from request.user.staff
        rejector = application.staff
        
        application.reject(
            rejected_by=rejector,
            remarks=serializer.validated_data.get('remarks', '')
        )
        
        result_serializer = self.get_serializer(application)
        return Response(result_serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel leave application."""
        application = self.get_object()
        
        if application.status not in ['PENDING', 'APPROVED']:
            return Response(
                {'error': 'Only pending or approved applications can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.cancel()
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending leave applications."""
        applications = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_applications(self, request):
        """Get leave applications for current user."""
        # Note: Filter by request.user.staff
        applications = self.get_queryset()
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
