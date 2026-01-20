"""
Dashboard API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser, IsPlatformAdmin, IsTenantAdmin
from .analytics_service import AnalyticsService, SuperAdminAnalytics
from .models import (
    WidgetDefinition, 
    DashboardLayout, 
    RoleDefaultLayout,
    ParentDashboardConfig,
    Leaderboard,
    LeaderboardEntry
)
from .serializers import (
    WidgetDefinitionSerializer,
    DashboardLayoutSerializer,
    LayoutUpdateSerializer,
    WidgetConfigSerializer,
    RoleDefaultLayoutSerializer,
    ParentDashboardConfigSerializer,
    LeaderboardSerializer,
    LeaderboardEntrySerializer
)
from .services import DashboardService, LeaderboardService, WidgetDataService


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
    
    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """Get data for a specific widget."""
        widget = self.get_object()
        config = request.query_params.dict()
        
        service = WidgetDataService(request.user.tenant, request.user)
        data = service.get_widget_data(widget.widget_id, config)
        
        return Response(data)


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
        
        # Initialize with default layout if new
        if created:
            DashboardService.initialize_user_dashboard(self.request.user)
            layout.refresh_from_db()
        
        return layout
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's dashboard layout."""
        layout = self.get_object()
        serializer = self.get_serializer(layout)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_widgets(self, request):
        """Get widgets available to add to dashboard."""
        # Get user's current widgets
        layout = self.get_object()
        current_widgets = [w.get('i') for w in layout.layout]
        
        # Get all available widgets
        all_widgets = WidgetDefinition.objects.filter(is_active=True)
        available = []
        
        for widget in all_widgets:
            if widget.is_available_for_user(request.user) and widget.widget_id not in current_widgets:
                available.append({
                    'id': widget.widget_id,
                    'name': widget.name,
                    'description': widget.description,
                    'category': widget.category,
                    'icon': widget.icon,
                    'default_width': widget.default_width,
                    'default_height': widget.default_height
                })
        
        return Response(available)
    
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
            layout.is_customized = True
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
            {'error': 'Widget already exists in dashboard'},
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
        
        success = layout.remove_widget(widget_id)
        
        if not success:
            return Response(
                {'error': 'Cannot remove system widget'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        role_code = request.data.get('role_code')
        layout.reset_to_default(role_code)
        
        serializer = self.get_serializer(layout)
        return Response(serializer.data)


class RoleDefaultLayoutViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing role default layouts.
    Only accessible by tenant admins.
    """
    serializer_class = RoleDefaultLayoutSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        return RoleDefaultLayout.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        # Deactivate other layouts for the same role if this one is active
        if serializer.validated_data.get('is_active', True):
            RoleDefaultLayout.objects.filter(
                tenant=self.request.user.tenant,
                role_code=serializer.validated_data['role_code'],
                is_active=True
            ).update(is_active=False)
        
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """Get layouts grouped by role."""
        layouts = self.get_queryset()
        serializer = self.get_serializer(layouts, many=True)
        
        grouped = {}
        for layout in serializer.data:
            role = layout['role_code']
            if role not in grouped:
                grouped[role] = []
            grouped[role].append(layout)
        
        return Response(grouped)
    
    @action(detail=False, methods=['get'])
    def available_widgets(self, request):
        """Get all available widgets for layout configuration."""
        role_code = request.query_params.get('role')
        
        widgets = WidgetDefinition.objects.filter(is_active=True)
        
        if role_code:
            widgets = widgets.filter(available_for_roles__contains=[role_code])
        
        return Response([
            {
                'id': w.widget_id,
                'name': w.name,
                'description': w.description,
                'category': w.category,
                'icon': w.icon,
                'default_width': w.default_width,
                'default_height': w.default_height,
                'min_width': w.min_width,
                'min_height': w.min_height,
                'max_width': w.max_width,
                'max_height': w.max_height
            }
            for w in widgets
        ])
    
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """Preview a layout before saving."""
        layout_data = request.data.get('layout', [])
        
        # Validate all widgets exist
        widget_ids = [w.get('i') for w in layout_data]
        existing = WidgetDefinition.objects.filter(
            widget_id__in=widget_ids,
            is_active=True
        ).values_list('widget_id', flat=True)
        
        invalid = set(widget_ids) - set(existing)
        
        if invalid:
            return Response({
                'valid': False,
                'invalid_widgets': list(invalid)
            })
        
        return Response({
            'valid': True,
            'layout': layout_data
        })


class ParentDashboardConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing parent dashboard configuration.
    Only accessible by tenant admins.
    """
    serializer_class = ParentDashboardConfigSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        return ParentDashboardConfig.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        # Deactivate other configs if this one is active
        if serializer.validated_data.get('is_active', True):
            ParentDashboardConfig.objects.filter(
                tenant=self.request.user.tenant,
                is_active=True
            ).update(is_active=False)
        
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current active parent dashboard config."""
        try:
            config = ParentDashboardConfig.objects.get(
                tenant=request.user.tenant,
                is_active=True
            )
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        except ParentDashboardConfig.DoesNotExist:
            # Return default config
            return Response({
                'id': None,
                'name': 'Default Parent Dashboard',
                'layout': DashboardService.get_default_layout_for_role('parent'),
                'visible_widgets': [],
                'hidden_widgets': [],
                'quick_links': [],
                'show_announcements': True,
                'max_announcements': 5,
                'show_activity_feed': True,
                'activity_feed_days': 7
            })
    
    @action(detail=False, methods=['get'])
    def available_widgets(self, request):
        """Get widgets available for parent dashboard."""
        widgets = WidgetDefinition.objects.filter(
            is_active=True,
            available_for_roles__contains=['parent']
        )
        
        return Response([
            {
                'id': w.widget_id,
                'name': w.name,
                'description': w.description,
                'category': w.category,
                'icon': w.icon
            }
            for w in widgets
        ])


class LeaderboardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leaderboards.
    """
    serializer_class = LeaderboardSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        queryset = Leaderboard.objects.filter(tenant=self.request.user.tenant)
        
        # Filter by visibility based on user role
        user = self.request.user
        
        if hasattr(user, 'is_parent') and user.is_parent:
            queryset = queryset.filter(visible_to_parents=True)
        # Add more role-based filtering as needed
        
        return queryset.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def entries(self, request, pk=None):
        """Get leaderboard entries."""
        leaderboard = self.get_object()
        service = LeaderboardService(request.user.tenant)
        data = service.get_leaderboard_data(leaderboard.id)
        
        if data:
            return Response(data)
        return Response({'error': 'Leaderboard not found'}, status=404)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTenantAdmin])
    def refresh(self, request, pk=None):
        """Manually refresh leaderboard rankings."""
        leaderboard = self.get_object()
        service = LeaderboardService(request.user.tenant)
        count = service.update_leaderboard(leaderboard)
        
        return Response({
            'message': f'Leaderboard refreshed with {count} entries',
            'entries_count': count
        })
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get leaderboards grouped by type."""
        leaderboards = self.get_queryset()
        serializer = self.get_serializer(leaderboards, many=True)
        
        grouped = {}
        for lb in serializer.data:
            lb_type = lb['leaderboard_type']
            if lb_type not in grouped:
                grouped[lb_type] = []
            grouped[lb_type].append(lb)
        
        return Response(grouped)
    
    @action(detail=False, methods=['get'])
    def student_leaderboards(self, request):
        """Get all student leaderboards with data."""
        leaderboards = self.get_queryset().filter(target='STUDENT')
        service = LeaderboardService(request.user.tenant)
        
        result = []
        for lb in leaderboards:
            data = service.get_leaderboard_data(lb.id)
            if data:
                result.append(data)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def teacher_leaderboards(self, request):
        """Get all teacher leaderboards with data."""
        leaderboards = self.get_queryset().filter(target='TEACHER')
        service = LeaderboardService(request.user.tenant)
        
        result = []
        for lb in leaderboards:
            data = service.get_leaderboard_data(lb.id)
            if data:
                result.append(data)
        
        return Response(result)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsTenantAdmin])
    def refresh_all(self, request):
        """Refresh all leaderboards."""
        service = LeaderboardService(request.user.tenant)
        service.update_all_leaderboards()
        
        return Response({'message': 'All leaderboards refreshed successfully'})


class WidgetDataViewSet(viewsets.ViewSet):
    """
    ViewSet for fetching widget data.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    @action(detail=False, methods=['get'], url_path='(?P<widget_id>[^/.]+)')
    def get_data(self, request, widget_id=None):
        """Get data for a specific widget."""
        config = request.query_params.dict()
        service = WidgetDataService(request.user.tenant, request.user)
        data = service.get_widget_data(widget_id, config)
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def batch(self, request):
        """Get data for multiple widgets at once."""
        widget_requests = request.data.get('widgets', [])
        service = WidgetDataService(request.user.tenant, request.user)
        
        result = {}
        for widget_req in widget_requests:
            widget_id = widget_req.get('id')
            config = widget_req.get('config', {})
            result[widget_id] = service.get_widget_data(widget_id, config)
        
        return Response(result)
