"""
Analytics API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsPlatformAdmin
from .models import (
    TenantMetric,
    UsageLog,
    TenantHealthAlert,
    ChurnPrediction,
    UpsellOpportunity
)
from .serializers import (
    TenantMetricSerializer,
    UsageLogSerializer,
    TenantHealthAlertSerializer,
    ChurnPredictionSerializer,
    UpsellOpportunitySerializer,
    PlatformOverviewSerializer,
    HealthDistributionSerializer,
    ModulePopularitySerializer
)
from .services import PlatformAnalyticsService


class PlatformAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for platform-wide analytics (Super Admin only).
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get platform overview metrics."""
        service = PlatformAnalyticsService()
        data = service.get_platform_overview()
        
        serializer = PlatformOverviewSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def health_distribution(self, request):
        """Get tenant health score distribution."""
        service = PlatformAnalyticsService()
        distribution = service.get_tenant_health_distribution()
        
        serializer = HealthDistributionSerializer(distribution)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def module_popularity(self, request):
        """Get module usage statistics."""
        service = PlatformAnalyticsService()
        popularity = service.get_module_popularity()
        
        serializer = ModulePopularitySerializer(popularity, many=True)
        return Response(serializer.data)


class TenantMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for tenant metrics."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = TenantMetricSerializer
    queryset = TenantMetric.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by tenant if provided
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset.order_by('-date')


class UsageLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for usage logs."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = UsageLogSerializer
    queryset = UsageLog.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by tenant
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        # Filter by action type
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter errors only
        if self.request.query_params.get('errors_only') == 'true':
            queryset = queryset.filter(is_error=True)
        
        return queryset.order_by('-created_at')[:1000]  # Limit to 1000 recent logs


class TenantHealthAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for health alerts."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = TenantHealthAlertSerializer
    queryset = TenantHealthAlert.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by resolution status
        if self.request.query_params.get('unresolved_only') == 'true':
            queryset = queryset.filter(is_resolved=False)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark alert as resolved."""
        alert = self.get_object()
        
        from django.utils import timezone
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.resolution_notes = request.data.get('notes', '')
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)


class ChurnPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for churn predictions."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = ChurnPredictionSerializer
    queryset = ChurnPrediction.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by risk level
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)
        
        # Get latest predictions only
        if self.request.query_params.get('latest_only') == 'true':
            from datetime import date
            queryset = queryset.filter(prediction_date=date.today())
        
        return queryset.order_by('-prediction_date', '-churn_probability')


class UpsellOpportunityViewSet(viewsets.ModelViewSet):
    """ViewSet for upsell opportunities."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = UpsellOpportunitySerializer
    queryset = UpsellOpportunity.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by contact status
        if self.request.query_params.get('not_contacted_only') == 'true':
            queryset = queryset.filter(is_contacted=False)
        
        # Filter by conversion status
        if self.request.query_params.get('not_converted_only') == 'true':
            queryset = queryset.filter(is_converted=False)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_contacted(self, request, pk=None):
        """Mark opportunity as contacted."""
        opportunity = self.get_object()
        
        from django.utils import timezone
        opportunity.is_contacted = True
        opportunity.contacted_at = timezone.now()
        opportunity.save()
        
        serializer = self.get_serializer(opportunity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_converted(self, request, pk=None):
        """Mark opportunity as converted."""
        opportunity = self.get_object()
        
        from django.utils import timezone
        opportunity.is_converted = True
        opportunity.converted_at = timezone.now()
        opportunity.save()
        
        serializer = self.get_serializer(opportunity)
        return Response(serializer.data)
