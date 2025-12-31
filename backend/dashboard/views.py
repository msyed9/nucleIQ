"""
Dashboard API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser, IsPlatformAdmin
from .analytics_service import AnalyticsService, SuperAdminAnalytics
from .models import WidgetDefinition, DashboardLayout
from .serializers import (
    WidgetDefinitionSerializer,
    DashboardLayoutSerializer,
    LayoutUpdateSerializer,
    WidgetConfigSerializer
)


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard operations and analytics.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get overview statistics for dashboard."""
        analytics = AnalyticsService(request.user.tenant)
        stats = analytics.get_overview_stats()
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def academic_heatmap(self, request):
        """Get academic performance heatmap."""
        analytics = AnalyticsService(request.user.tenant)
        heatmap = analytics.get_academic_heatmap()
        return Response(heatmap)
    
    @action(detail=False, methods=['get'])
    def financial_health(self, request):
        """Get financial health metrics."""
        analytics = AnalyticsService(request.user.tenant)
        health = analytics.get_financial_health()
        return Response(health)
    
    @action(detail=False, methods=['get'])
    def staff_efficiency(self, request):
        """Get staff efficiency metrics."""
        analytics = AnalyticsService(request.user.tenant)
        efficiency = analytics.get_staff_efficiency()
        return Response(efficiency)
    
    @action(detail=False, methods=['get'])
    def attendance_trends(self, request):
        """Get attendance trends."""
        analytics = AnalyticsService(request.user.tenant)
        trends = analytics.get_attendance_trends()
        return Response(trends)
    
    @action(detail=False, methods=['post'])
    def invalidate_cache(self, request):
        """Invalidate analytics cache."""
        analytics = AnalyticsService(request.user.tenant)
        analytics.invalidate_cache()
        return Response({'message': 'Cache invalidated successfully'})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsPlatformAdmin])
    def system_health(self, request):
        """Get system health (Super Admin only)."""
        analytics = SuperAdminAnalytics()
        health = analytics.get_system_health()
        return Response(health)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsPlatformAdmin])
    def tenant_growth(self, request):
        """Get tenant growth (Super Admin only)."""
        analytics = SuperAdminAnalytics()
        growth = analytics.get_tenant_growth()
        return Response(growth)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsPlatformAdmin])
    def revenue_trend(self, request):
        """Get revenue trend (Super Admin only)."""
        analytics = SuperAdminAnalytics()
        trend = analytics.get_revenue_trend()
        return Response(trend)


class WidgetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for widget definitions.
    Read-only - widgets are managed by admins.
    """
    queryset = WidgetDefinition.objects.filter(is_active=True)
    serializer_class = WidgetDefinitionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter widgets based on user role and permissions."""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Platform admins see all widgets
        if user.is_platform_admin:
            return queryset
        
        # Filter widgets available for user
        available_widgets = []
        for widget in queryset:
            if widget.is_available_for_user(user):
                available_widgets.append(widget.id)
        
        return queryset.filter(id__in=available_widgets)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get widgets grouped by category."""
        widgets = self.get_queryset()
        serializer = self.get_serializer(widgets, many=True)
        
        # Group by category
        grouped = {}
        for widget in serializer.data:
            category = widget['category']
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(widget)
        
        return Response(grouped)


class DashboardLayoutViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user dashboard layouts.
    """
    serializer_class = DashboardLayoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get current user's dashboard layout."""
        return DashboardLayout.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create dashboard layout for current user."""
        layout, created = DashboardLayout.objects.get_or_create(
            user=self.request.user
        )
        return layout
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's dashboard layout."""
        layout = self.get_object()
        serializer = self.get_serializer(layout)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_layout(self, request):
        """
        Update dashboard layout.
        
        Request body:
        {
            "layout": [
                {
                    "i": "widget_fee_trend",
                    "x": 0,
                    "y": 0,
                    "w": 2,
                    "h": 2,
                    "config": {...}
                }
            ]
        }
        """
        layout = self.get_object()
        serializer = LayoutUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            layout.layout = serializer.validated_data['layout']
            layout.save()
            
            response_serializer = self.get_serializer(layout)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def add_widget(self, request):
        """
        Add a widget to the layout.
        
        Request body:
        {
            "widget_id": "fee_trend",
            "x": 0,
            "y": 0,
            "w": 2,  // optional
            "h": 2,  // optional
            "config": {...}  // optional
        }
        """
        layout = self.get_object()
        
        widget_id = request.data.get('widget_id')
        if not widget_id:
            return Response(
                {'error': 'widget_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if widget exists and is available
        try:
            widget_def = WidgetDefinition.objects.get(
                widget_id=widget_id,
                is_active=True
            )
        except WidgetDefinition.DoesNotExist:
            return Response(
                {'error': 'Widget not found or not active'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user can access this widget
        if not widget_def.is_available_for_user(request.user):
            return Response(
                {'error': 'You do not have permission to use this widget'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Add widget
        success = layout.add_widget(
            widget_id=widget_id,
            x=request.data.get('x', 0),
            y=request.data.get('y', 0),
            w=request.data.get('w'),
            h=request.data.get('h'),
            config=request.data.get('config')
        )
        
        if success:
            serializer = self.get_serializer(layout)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Failed to add widget'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['post'])
    def remove_widget(self, request):
        """
        Remove a widget from the layout.
        
        Request body:
        {
            "widget_id": "fee_trend"
        }
        """
        layout = self.get_object()
        
        widget_id = request.data.get('widget_id')
        if not widget_id:
            return Response(
                {'error': 'widget_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        layout.remove_widget(widget_id)
        
        serializer = self.get_serializer(layout)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_widget_config(self, request):
        """
        Update widget configuration.
        
        Request body:
        {
            "widget_id": "fee_trend",
            "config": {
                "period": "monthly",
                "showLegend": true
            }
        }
        """
        layout = self.get_object()
        serializer = WidgetConfigSerializer(data=request.data)
        
        if serializer.is_valid():
            layout.update_widget_config(
                widget_id=serializer.validated_data['widget_id'],
                config=serializer.validated_data['config']
            )
            
            response_serializer = self.get_serializer(layout)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_to_default(self, request):
        """Reset dashboard to default layout."""
        layout = self.get_object()
        layout.layout = []
        layout.save()
        
        serializer = self.get_serializer(layout)
        return Response(serializer.data)
