"""
Security & Visitor Management Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q

from .models import GatePass, GateLog, CampusVisitor, CampusVisitorLog
from .serializers import (
    GatePassSerializer, GateLogSerializer, VisitorSerializer,
    VisitorListSerializer, VisitorLogSerializer, CheckoutVisitorSerializer,
    ApproveGatePassSerializer, ScanGatePassSerializer
)
from core.middleware import get_current_tenant
from core.permissions import IsTenantUser


class GatePassViewSet(viewsets.ModelViewSet):
    """ViewSet for GatePass management."""
    
    serializer_class = GatePassSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['pass_type', 'status', 'student']
    search_fields = ['visitor_name', 'reason', 'student__user__first_name', 'student__user__last_name']
    ordering_fields = ['created_at', 'valid_from', 'valid_until']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return GatePass.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('student', 'approved_by')
    
    @action(detail=False, methods=['post'])
    def approve(self, request):
        """
        Approve or reject a gate pass.
        
        POST /api/security/gate-passes/approve/
        {
            "gate_pass_id": "uuid",
            "action": "approve" or "reject",
            "rejection_reason": "reason" (required if rejecting)
        }
        """
        serializer = ApproveGatePassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        gate_pass_id = serializer.validated_data['gate_pass_id']
        action_type = serializer.validated_data['action']
        rejection_reason = serializer.validated_data.get('rejection_reason', '')
        
        try:
            gate_pass = GatePass.objects.get(
                pk=gate_pass_id,
                tenant=get_current_tenant(),
                is_deleted=False
            )
        except GatePass.DoesNotExist:
            return Response(
                {'error': 'Gate pass not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if gate_pass.status != 'REQUESTED':
            return Response(
                {'error': f'Gate pass is already {gate_pass.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get staff profile from user
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Staff profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if action_type == 'approve':
            gate_pass.status = 'APPROVED'
            gate_pass.approved_by = staff
            gate_pass.approved_at = timezone.now()
        else:  # reject
            if not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            gate_pass.status = 'REJECTED'
            gate_pass.approved_by = staff
            gate_pass.approved_at = timezone.now()
            gate_pass.rejection_reason = rejection_reason
        
        gate_pass.save()
        
        response_serializer = GatePassSerializer(gate_pass)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """
        Guard scans a QR code (token) to check in/out.
        
        POST /api/security/gate-passes/scan/
        {
            "token": "uuid",
            "action": "IN" or "OUT",
            "notes": "optional notes"
        }
        """
        serializer = ScanGatePassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        action_type = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            gate_pass = GatePass.objects.get(
                token=token,
                tenant=get_current_tenant(),
                is_deleted=False
            )
        except GatePass.DoesNotExist:
            return Response(
                {'error': 'Invalid Pass'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validation
        now = timezone.now()
        if now < gate_pass.valid_from or now > gate_pass.valid_until:
            return Response(
                {'error': 'Pass Expired or Not Yet Valid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if gate_pass.status != 'APPROVED':
            return Response(
                {'error': f'Pass is {gate_pass.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get guard (staff) from user
        try:
            from staff.models import Staff
            guard = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            guard = None
        
        # Log the scan
        GateLog.objects.create(
            tenant=get_current_tenant(),
            gate_pass=gate_pass,
            action=action_type,
            guard=guard,
            notes=notes
        )
        
        # Update gate pass status
        if action_type == 'OUT':
            gate_pass.status = 'USED'
            gate_pass.save()
        
        return Response({
            'status': 'allowed',
            'student': gate_pass.student.get_full_name() if gate_pass.student else gate_pass.visitor_name,
            'pass_type': gate_pass.get_pass_type_display(),
            'valid_until': gate_pass.valid_until
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending gate pass requests."""
        tenant = get_current_tenant()
        pending_passes = GatePass.objects.filter(
            tenant=tenant,
            is_deleted=False,
            status='REQUESTED'
        ).select_related('student', 'approved_by')
        
        serializer = self.get_serializer(pending_passes, many=True)
        return Response(serializer.data)


class GateLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for GateLog (read-only)."""
    
    serializer_class = GateLogSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['gate_pass', 'action', 'guard']
    search_fields = ['gate_pass__student__user__first_name', 'notes']
    ordering_fields = ['scanned_at']
    ordering = ['-scanned_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return GateLog.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('gate_pass', 'guard')


class CampusVisitorViewSet(viewsets.ModelViewSet):
    """ViewSet for Visitor management."""
    
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visitor_type', 'status', 'person_to_meet']
    search_fields = ['name', 'phone', 'email', 'organization', 'purpose']
    ordering_fields = ['check_in_time', 'check_out_time']
    ordering = ['-check_in_time']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return CampusVisitor.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('person_to_meet', 'checked_in_by', 'checked_out_by')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VisitorListSerializer
        return VisitorSerializer
    
    def perform_create(self, serializer):
        # Get staff profile from user
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=self.request.user, is_deleted=False)
        except Staff.DoesNotExist:
            staff = None
        
        serializer.save(
            tenant=get_current_tenant(),
            checked_in_by=staff
        )
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """
        Check out a visitor.
        
        POST /api/security/visitors/{id}/checkout/
        {
            "badge_returned": true,
            "notes": "optional notes"
        }
        """
        visitor = self.get_object()
        
        if visitor.status == 'CHECKED_OUT':
            return Response(
                {'error': 'Visitor already checked out'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get staff profile from user
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            staff = None
        
        visitor.check_out_time = timezone.now()
        visitor.status = 'CHECKED_OUT'
        visitor.checked_out_by = staff
        visitor.badge_returned = request.data.get('badge_returned', True)
        
        if request.data.get('notes'):
            visitor.notes += f"\n\nCheckout Notes: {request.data.get('notes')}"
        
        visitor.save()
        
        serializer = self.get_serializer(visitor)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all currently checked-in visitors."""
        tenant = get_current_tenant()
        active_visitors = CampusVisitor.objects.filter(
            tenant=tenant,
            is_deleted=False,
            status='CHECKED_IN'
        ).select_related('person_to_meet', 'checked_in_by')
        
        serializer = self.get_serializer(active_visitors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overstayed(self, request):
        """Get all visitors who have overstayed."""
        tenant = get_current_tenant()
        now = timezone.now()
        
        overstayed_visitors = CampusVisitor.objects.filter(
            tenant=tenant,
            is_deleted=False,
            status='CHECKED_IN',
            expected_checkout_time__lt=now
        ).select_related('person_to_meet', 'checked_in_by')
        
        # Update their status
        for visitor in overstayed_visitors:
            visitor.status = 'OVERSTAYED'
            visitor.save(update_fields=['status'])
        
        serializer = self.get_serializer(overstayed_visitors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get visitor statistics."""
        tenant = get_current_tenant()
        today = timezone.now().date()
        
        stats = {
            'today': {
                'total': CampusVisitor.objects.filter(
                    tenant=tenant,
                    is_deleted=False,
                    check_in_time__date=today
                ).count(),
                'checked_in': CampusVisitor.objects.filter(
                    tenant=tenant,
                    is_deleted=False,
                    check_in_time__date=today,
                    status='CHECKED_IN'
                ).count(),
                'checked_out': CampusVisitor.objects.filter(
                    tenant=tenant,
                    is_deleted=False,
                    check_in_time__date=today,
                    status='CHECKED_OUT'
                ).count(),
                'overstayed': CampusVisitor.objects.filter(
                    tenant=tenant,
                    is_deleted=False,
                    check_in_time__date=today,
                    status='OVERSTAYED'
                ).count(),
            },
            'by_type': {}
        }
        
        # Count by visitor type
        for choice in Visitor.VISITOR_TYPE_CHOICES:
            type_code = choice[0]
            type_name = choice[1]
            count = CampusVisitor.objects.filter(
                tenant=tenant,
                is_deleted=False,
                check_in_time__date=today,
                visitor_type=type_code
            ).count()
            stats['by_type'][type_name] = count
        
        return Response(stats)


class CampusVisitorLogViewSet(viewsets.ModelViewSet):
    """ViewSet for VisitorLog management."""
    
    serializer_class = VisitorLogSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visitor', 'logged_by']
    search_fields = ['location', 'action', 'notes']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return CampusVisitorLog.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('visitor', 'logged_by')
    
    def perform_create(self, serializer):
        # Get staff profile from user
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=self.request.user, is_deleted=False)
        except Staff.DoesNotExist:
            staff = None
        
        serializer.save(
            tenant=get_current_tenant(),
            logged_by=staff
        )
