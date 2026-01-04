"""
Helpdesk & Ticketing Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q, Count

from .models import HelpdeskTicket, TicketComment
from .serializers import (
    HelpdeskTicketSerializer, HelpdeskTicketListSerializer,
    TicketCommentSerializer, CreateTicketSerializer,
    UpdateTicketStatusSerializer, AssignTicketSerializer,
    AddCommentSerializer
)
from core.middleware import get_current_tenant


class HelpdeskTicketViewSet(viewsets.ModelViewSet):
    """ViewSet for Helpdesk Ticket management."""
    
    serializer_class = HelpdeskTicketSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'status', 'priority', 'assigned_to', 'raised_by']
    search_fields = ['subject', 'description']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        queryset = HelpdeskTicket.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('raised_by', 'assigned_to').prefetch_related('comments')
        
        # Filter by user role
        user = self.request.user
        
        # If user is staff, show all tickets or assigned tickets
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=user, is_deleted=False)
            # Staff can see all tickets or only assigned to them
            if self.request.query_params.get('my_tickets'):
                queryset = queryset.filter(assigned_to=staff)
        except Staff.DoesNotExist:
            # Regular users can only see their own tickets
            queryset = queryset.filter(raised_by=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return HelpdeskTicketListSerializer
        return HelpdeskTicketSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=get_current_tenant(),
            raised_by=self.request.user
        )
    
    @action(detail=False, methods=['post'])
    def create_ticket(self, request):
        """
        Create a new helpdesk ticket.
        
        POST /api/helpdesk/tickets/create_ticket/
        {
            "category": "IT",
            "subject": "Cannot login",
            "description": "Detailed description",
            "priority": "HIGH"
        }
        """
        serializer = CreateTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ticket = HelpdeskTicket.objects.create(
            tenant=get_current_tenant(),
            raised_by=request.user,
            category=serializer.validated_data['category'],
            subject=serializer.validated_data['subject'],
            description=serializer.validated_data['description'],
            priority=serializer.validated_data.get('priority', 'MEDIUM')
        )
        
        response_serializer = HelpdeskTicketSerializer(ticket)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """
        Add a comment to a ticket.
        
        POST /api/helpdesk/tickets/{id}/add_comment/
        {
            "content": "Comment text"
        }
        """
        ticket = self.get_object()
        
        serializer = AddCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        comment = TicketComment.objects.create(
            tenant=get_current_tenant(),
            ticket=ticket,
            commented_by=request.user,
            content=serializer.validated_data['content']
        )
        
        comment_serializer = TicketCommentSerializer(comment)
        return Response(comment_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update ticket status.
        
        PATCH /api/helpdesk/tickets/{id}/update_status/
        {
            "status": "RESOLVED",
            "resolution_notes": "Issue fixed"
        }
        """
        ticket = self.get_object()
        
        serializer = UpdateTicketStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        resolution_notes = serializer.validated_data.get('resolution_notes', '')
        
        ticket.status = new_status
        
        if new_status in ['RESOLVED', 'CLOSED'] and not ticket.resolved_at:
            ticket.resolved_at = timezone.now()
        
        ticket.save()
        
        # Add resolution notes as a comment if provided
        if resolution_notes:
            TicketComment.objects.create(
                tenant=get_current_tenant(),
                ticket=ticket,
                commented_by=request.user,
                content=f"Status changed to {new_status}. Notes: {resolution_notes}"
            )
        
        response_serializer = HelpdeskTicketSerializer(ticket)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign ticket to a staff member.
        
        POST /api/helpdesk/tickets/{id}/assign/
        {
            "assigned_to": "staff_uuid"
        }
        """
        ticket = self.get_object()
        
        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        staff_id = serializer.validated_data['assigned_to']
        
        try:
            from staff.models import Staff
            staff = Staff.objects.get(pk=staff_id, is_deleted=False)
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Staff member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        ticket.assigned_to = staff
        ticket.save()
        
        # Add assignment comment
        TicketComment.objects.create(
            tenant=get_current_tenant(),
            ticket=ticket,
            commented_by=request.user,
            content=f"Ticket assigned to {staff.get_full_name()}"
        )
        
        response_serializer = HelpdeskTicketSerializer(ticket)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Mark ticket as resolved.
        
        POST /api/helpdesk/tickets/{id}/resolve/
        {
            "resolution_notes": "Issue fixed by..."
        }
        """
        ticket = self.get_object()
        
        if ticket.status in ['RESOLVED', 'CLOSED']:
            return Response(
                {'error': 'Ticket is already resolved/closed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = 'RESOLVED'
        ticket.resolved_at = timezone.now()
        ticket.save()
        
        # Add resolution comment
        resolution_notes = request.data.get('resolution_notes', 'Ticket resolved')
        TicketComment.objects.create(
            tenant=get_current_tenant(),
            ticket=ticket,
            commented_by=request.user,
            content=f"Ticket resolved. {resolution_notes}"
        )
        
        response_serializer = HelpdeskTicketSerializer(ticket)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        """Get tickets raised by current user."""
        tenant = get_current_tenant()
        tickets = HelpdeskTicket.objects.filter(
            tenant=tenant,
            is_deleted=False,
            raised_by=request.user
        ).select_related('raised_by', 'assigned_to').prefetch_related('comments')
        
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def assigned_to_me(self, request):
        """Get tickets assigned to current user (staff)."""
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Staff profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant = get_current_tenant()
        tickets = HelpdeskTicket.objects.filter(
            tenant=tenant,
            is_deleted=False,
            assigned_to=staff
        ).select_related('raised_by', 'assigned_to').prefetch_related('comments')
        
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get helpdesk statistics."""
        tenant = get_current_tenant()
        
        stats = {
            'total': HelpdeskTicket.objects.filter(
                tenant=tenant,
                is_deleted=False
            ).count(),
            'by_status': {},
            'by_category': {},
            'by_priority': {},
            'unassigned': HelpdeskTicket.objects.filter(
                tenant=tenant,
                is_deleted=False,
                assigned_to__isnull=True
            ).count()
        }
        
        # Count by status
        for choice in HelpdeskTicket.STATUS_CHOICES:
            status_code = choice[0]
            status_name = choice[1]
            count = HelpdeskTicket.objects.filter(
                tenant=tenant,
                is_deleted=False,
                status=status_code
            ).count()
            stats['by_status'][status_name] = count
        
        # Count by category
        for choice in HelpdeskTicket.CATEGORY_CHOICES:
            category_code = choice[0]
            category_name = choice[1]
            count = HelpdeskTicket.objects.filter(
                tenant=tenant,
                is_deleted=False,
                category=category_code
            ).count()
            stats['by_category'][category_name] = count
        
        # Count by priority
        for choice in HelpdeskTicket.PRIORITY_CHOICES:
            priority_code = choice[0]
            priority_name = choice[1]
            count = HelpdeskTicket.objects.filter(
                tenant=tenant,
                is_deleted=False,
                priority=priority_code
            ).count()
            stats['by_priority'][priority_name] = count
        
        return Response(stats)


class TicketCommentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for TicketComment (read-only)."""
    
    serializer_class = TicketCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['ticket', 'commented_by']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return TicketComment.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('ticket', 'commented_by')
