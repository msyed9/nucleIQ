"""
Communication Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import models
from django.utils import timezone
from datetime import datetime

from .models import (
    CommunicationProvider, MessageTemplate, Notice,
    MessageLog, BroadcastMessage, SchoolEvent
)
from .serializers import (
    CommunicationProviderSerializer, MessageTemplateSerializer,
    NoticeSerializer, MessageLogSerializer, BroadcastMessageSerializer,
    SendMessageSerializer, SchoolEventSerializer
)

from core.middleware import get_current_tenant


class CommunicationProviderViewSet(viewsets.ModelViewSet):
    """ViewSet for CommunicationProvider management."""
    
    serializer_class = CommunicationProviderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provider_type', 'is_active', 'is_default']
    search_fields = ['name']
    ordering = ['provider_type', 'name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return CommunicationProvider.objects.filter(tenant=tenant, is_deleted=False)


class MessageTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for MessageTemplate management."""
    
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['template_type', 'category', 'is_active']
    search_fields = ['name', 'content']
    ordering = ['category', 'name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return MessageTemplate.objects.filter(tenant=tenant, is_deleted=False)


class NoticeViewSet(viewsets.ModelViewSet):
    """ViewSet for Notice management."""
    
    serializer_class = NoticeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['priority', 'target_audience', 'is_published']
    search_fields = ['title', 'content']
    ordering = ['-published_at', '-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Notice.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).prefetch_related('target_classes', 'target_sections')
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a notice."""
        notice = self.get_object()
        
        if notice.is_published:
            return Response(
                {'error': 'Notice is already published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get publisher from request (placeholder)
        publisher = None
        
        notice.publish(publisher)
        
        serializer = self.get_serializer(notice)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        """Increment view count."""
        notice = self.get_object()
        notice.view_count += 1
        notice.save()
        return Response({'view_count': notice.view_count})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active notices."""
        today = timezone.now().date()
        
        notices = self.get_queryset().filter(
            is_published=True,
            valid_from__lte=today
        ).filter(
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=today)
        )
        
        serializer = self.get_serializer(notices, many=True)
        return Response(serializer.data)


class MessageLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for MessageLog (read-only)."""
    
    serializer_class = MessageLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['message_type', 'status', 'recipient_type']
    search_fields = ['recipient_name', 'content']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return MessageLog.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('provider', 'template', 'notice')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get message statistics."""
        from django.db.models import Count
        
        queryset = self.get_queryset()
        
        stats = {
            'by_type': list(queryset.values('message_type').annotate(count=Count('id'))),
            'by_status': list(queryset.values('status').annotate(count=Count('id'))),
            'total': queryset.count(),
            'sent': queryset.filter(status='SENT').count(),
            'failed': queryset.filter(status='FAILED').count(),
        }
        
        return Response(stats)


class BroadcastMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for BroadcastMessage management."""
    
    serializer_class = BroadcastMessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['message_type', 'status', 'target_audience']
    search_fields = ['title', 'content']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return BroadcastMessage.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).prefetch_related('target_classes', 'target_sections')
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send broadcast message."""
        broadcast = self.get_object()
        
        if broadcast.status not in ['DRAFT', 'SCHEDULED']:
            return Response(
                {'error': 'Only draft or scheduled broadcasts can be sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status
        broadcast.status = 'SENDING'
        broadcast.save()
        
        try:
            # Placeholder for actual broadcast sending
            broadcast.status = 'SENT'
            broadcast.sent_at = timezone.now()
            broadcast.save()
            
            serializer = self.get_serializer(broadcast)
            return Response(serializer.data)
        
        except Exception as e:
            broadcast.status = 'FAILED'
            broadcast.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SchoolEventViewSet(viewsets.ModelViewSet):
    """ViewSet for SchoolEvent management (Calendar Events)."""
    
    serializer_class = SchoolEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['event_type', 'is_published']
    search_fields = ['title', 'description', 'location']
    ordering = ['start_date', 'start_time']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        queryset = SchoolEvent.objects.filter(
            tenant=tenant,
            is_deleted=False
        )
        
        # Only show published events to non-staff users
        if not (self.request.user.is_staff or getattr(self.request.user, 'role', '') == 'STAFF'):
            queryset = queryset.filter(is_published=True)
            
        queryset = queryset.prefetch_related('target_classes')
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(start_date__gte=start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(start_date__lte=end)
            except ValueError:
                pass
        
        return queryset
    
    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant and hasattr(self.request.user, 'tenant'):
            tenant = self.request.user.tenant
        serializer.save(tenant=tenant)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events."""
        today = timezone.now().date()
        limit = int(request.query_params.get('limit', 10))
        
        events = self.get_queryset().filter(
            start_date__gte=today
        ).order_by('start_date', 'start_time')[:limit]
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_month(self, request):
        """Get events for a specific month."""
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        from calendar import monthrange
        first_day = datetime(year, month, 1).date()
        last_day = datetime(year, month, monthrange(year, month)[1]).date()
        
        events = self.get_queryset().filter(
            start_date__gte=first_day,
            start_date__lte=last_day
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

