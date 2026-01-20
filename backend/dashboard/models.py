"""
Dashboard Models for NucleiQ
Widget registry, dashboard layout management, and role-based configurations
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, TenantAwareModel


class WidgetDefinition(BaseModel):
    """
    Registry of available dashboard widgets.
    Defines what widgets are available and who can use them.
    """
    
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('finance', 'Finance'),
        ('hr', 'Human Resources'),
        ('attendance', 'Attendance'),
        ('communication', 'Communication'),
        ('analytics', 'Analytics'),
        ('leaderboard', 'Leaderboard'),
        ('system', 'System'),
        ('parent', 'Parent'),
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    ]
    
    widget_id = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text=_('Unique widget identifier')
    )
    
    name = models.CharField(
        max_length=100,
        help_text=_('Widget display name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Widget description')
    )
    
    component_name = models.CharField(
        max_length=100,
        help_text=_('Frontend component name (e.g., FeeTrendChart)')
    )
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        db_index=True,
        help_text=_('Widget category')
    )
    
    # Role-based availability
    available_for_roles = models.JSONField(
        default=list,
        help_text=_('List of role codes that can use this widget (e.g., ["principal", "teacher"])')
    )
    
    required_permissions = models.JSONField(
        default=list,
        help_text=_('List of required permissions (e.g., ["student_module.read"])')
    )
    
    # Default size (for react-grid-layout)
    default_width = models.IntegerField(
        default=2,
        help_text=_('Default width in grid units')
    )
    
    default_height = models.IntegerField(
        default=2,
        help_text=_('Default height in grid units')
    )
    
    min_width = models.IntegerField(
        default=1,
        help_text=_('Minimum width in grid units')
    )
    
    min_height = models.IntegerField(
        default=1,
        help_text=_('Minimum height in grid units')
    )
    
    max_width = models.IntegerField(
        default=12,
        help_text=_('Maximum width in grid units')
    )
    
    max_height = models.IntegerField(
        default=8,
        help_text=_('Maximum height in grid units')
    )
    
    # Configuration schema
    config_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('JSON schema for widget configuration')
    )
    
    # Default configuration
    default_config = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Default widget configuration values')
    )
    
    # Widget icon
    icon = models.CharField(
        max_length=50,
        blank=True,
        default='📊',
        help_text=_('Icon for widget (emoji or icon class)')
    )
    
    # Preview image URL
    preview_image = models.URLField(
        blank=True,
        help_text=_('Preview image URL for widget library')
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this widget is available')
    )
    
    # Is this a system widget (cannot be removed)
    is_system = models.BooleanField(
        default=False,
        help_text=_('System widgets cannot be removed from dashboard')
    )
    
    display_order = models.IntegerField(
        default=0,
        help_text=_('Display order in widget library')
    )
    
    # Data endpoint
    data_endpoint = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('API endpoint for widget data (e.g., /api/dashboard/widgets/fee-trend/)')
    )
    
    # Refresh interval in seconds (0 = no auto refresh)
    refresh_interval = models.IntegerField(
        default=0,
        help_text=_('Auto-refresh interval in seconds (0 to disable)')
    )
    
    class Meta:
        db_table = 'widget_definitions'
        verbose_name = _('Widget Definition')
        verbose_name_plural = _('Widget Definitions')
        ordering = ['category', 'display_order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.widget_id})"
    
    def is_available_for_user(self, user):
        """
        Check if widget is available for a specific user.
        
        Args:
            user: User instance
        
        Returns:
            bool: True if user can access this widget
        """
        if not self.is_active:
            return False
        
        # Platform admins can access all widgets
        if user.is_platform_admin:
            return True
        
        # Check role availability
        if self.available_for_roles:
            user_role_codes = list(user.roles.values_list('code', flat=True))
            # Also check if user is a parent
            if hasattr(user, 'is_parent') and user.is_parent:
                user_role_codes.append('parent')
            if not any(role in self.available_for_roles for role in user_role_codes):
                return False
        
        # Check permissions
        if self.required_permissions:
            for permission in self.required_permissions:
                parts = permission.split('.')
                if len(parts) == 2:
                    resource, action = parts
                    if not user.has_permission(resource, action):
                        return False
        
        return True


class DashboardLayout(BaseModel):
    """
    User's dashboard layout configuration.
    Stores widget positions and configurations for drag-and-drop grid.
    """
    
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='dashboard_layout',
        help_text=_('User this layout belongs to')
    )
    
    # Layout configuration for react-grid-layout
    # Format: [
    #   {
    #     "i": "widget_fee_trend",
    #     "x": 0,
    #     "y": 0,
    #     "w": 2,
    #     "h": 2,
    #     "minW": 1,
    #     "minH": 1,
    #     "config": {
    #       "period": "monthly",
    #       "showLegend": true
    #     }
    #   }
    # ]
    layout = models.JSONField(
        default=list,
        help_text=_('Widget layout configuration')
    )
    
    # Whether user has customized their dashboard
    is_customized = models.BooleanField(
        default=False,
        help_text=_('Whether user has customized their dashboard')
    )
    
    # Metadata
    last_modified_at = models.DateTimeField(
        auto_now=True,
        help_text=_('When layout was last modified')
    )
    
    class Meta:
        db_table = 'dashboard_layouts'
        verbose_name = _('Dashboard Layout')
        verbose_name_plural = _('Dashboard Layouts')
    
    def __str__(self):
        return f"Dashboard for {self.user.email}"
    
    def add_widget(self, widget_id, x=0, y=0, w=None, h=None, config=None):
        """
        Add a widget to the layout.
        
        Args:
            widget_id: Widget identifier
            x, y: Position
            w, h: Size (optional, uses defaults)
            config: Widget configuration (optional)
        """
        try:
            widget_def = WidgetDefinition.objects.get(widget_id=widget_id)
        except WidgetDefinition.DoesNotExist:
            return False
        
        # Check if widget already exists
        if any(w.get('i') == widget_id for w in self.layout):
            return False
        
        widget_config = {
            'i': widget_id,
            'x': x,
            'y': y,
            'w': w or widget_def.default_width,
            'h': h or widget_def.default_height,
            'minW': widget_def.min_width,
            'minH': widget_def.min_height,
            'maxW': widget_def.max_width,
            'maxH': widget_def.max_height,
        }
        
        if config:
            widget_config['config'] = config
        elif widget_def.default_config:
            widget_config['config'] = widget_def.default_config
        
        self.layout.append(widget_config)
        self.is_customized = True
        self.save(update_fields=['layout', 'is_customized', 'last_modified_at'])
        return True
    
    def remove_widget(self, widget_id):
        """Remove a widget from the layout."""
        # Don't allow removing system widgets
        try:
            widget_def = WidgetDefinition.objects.get(widget_id=widget_id)
            if widget_def.is_system:
                return False
        except WidgetDefinition.DoesNotExist:
            pass
        
        self.layout = [w for w in self.layout if w.get('i') != widget_id]
        self.is_customized = True
        self.save(update_fields=['layout', 'is_customized', 'last_modified_at'])
        return True
    
    def update_widget_config(self, widget_id, config):
        """Update widget configuration."""
        for widget in self.layout:
            if widget.get('i') == widget_id:
                widget['config'] = config
                break
        
        self.is_customized = True
        self.save(update_fields=['layout', 'is_customized', 'last_modified_at'])
    
    def reset_to_default(self, role_code=None):
        """Reset dashboard to default layout for user's role."""
        from .services import DashboardService
        
        role = role_code or (self.user.roles.first().code if self.user.roles.exists() else 'staff')
        default_layout = DashboardService.get_default_layout_for_role(role, self.user.tenant)
        
        self.layout = default_layout
        self.is_customized = False
        self.save(update_fields=['layout', 'is_customized', 'last_modified_at'])


class RoleDefaultLayout(TenantAwareModel):
    """
    Default dashboard layout for specific roles within a tenant.
    Allows tenant admins to configure default dashboards for each role.
    """
    
    role_code = models.CharField(
        max_length=50,
        db_index=True,
        help_text=_('Role code (e.g., principal, teacher, student, parent)')
    )
    
    name = models.CharField(
        max_length=100,
        help_text=_('Layout name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Layout description')
    )
    
    # Layout configuration (same format as DashboardLayout)
    layout = models.JSONField(
        default=list,
        help_text=_('Default widget layout for this role')
    )
    
    # Whether this layout is active
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this is the active default layout for this role')
    )
    
    # Priority (higher = preferred)
    priority = models.IntegerField(
        default=0,
        help_text=_('Priority when multiple layouts exist')
    )
    
    class Meta:
        db_table = 'role_default_layouts'
        verbose_name = _('Role Default Layout')
        verbose_name_plural = _('Role Default Layouts')
        ordering = ['role_code', '-priority']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'role_code', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_layout_per_role'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.role_code})"


class ParentDashboardConfig(TenantAwareModel):
    """
    Parent dashboard configuration managed by tenant admin.
    Parents cannot customize their own dashboard - it's controlled by the school.
    """
    
    name = models.CharField(
        max_length=100,
        default='Parent Dashboard',
        help_text=_('Configuration name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Configuration description')
    )
    
    # Layout configuration
    layout = models.JSONField(
        default=list,
        help_text=_('Widget layout for parent dashboard')
    )
    
    # Widgets to show/hide
    visible_widgets = models.JSONField(
        default=list,
        help_text=_('List of widget IDs visible to parents')
    )
    
    # Hidden widgets
    hidden_widgets = models.JSONField(
        default=list,
        help_text=_('List of widget IDs hidden from parents')
    )
    
    # Quick links for parents
    quick_links = models.JSONField(
        default=list,
        help_text=_('Quick action links for parents')
    )
    
    # Announcements section settings
    show_announcements = models.BooleanField(
        default=True,
        help_text=_('Show announcements section')
    )
    
    max_announcements = models.IntegerField(
        default=5,
        help_text=_('Maximum announcements to show')
    )
    
    # Activity feed settings
    show_activity_feed = models.BooleanField(
        default=True,
        help_text=_('Show activity feed')
    )
    
    activity_feed_days = models.IntegerField(
        default=7,
        help_text=_('Number of days of activity to show')
    )
    
    # Is this the active configuration
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this is the active parent dashboard config')
    )
    
    class Meta:
        db_table = 'parent_dashboard_configs'
        verbose_name = _('Parent Dashboard Configuration')
        verbose_name_plural = _('Parent Dashboard Configurations')
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_parent_dashboard'
            )
        ]
    
    def __str__(self):
        return f"{self.name} - {self.tenant.name}"


class Leaderboard(TenantAwareModel):
    """
    Leaderboard configuration and settings.
    Supports multiple leaderboard types for students and teachers.
    """
    
    LEADERBOARD_TYPES = [
        ('ACADEMIC', 'Academic Performance'),
        ('ATTENDANCE', 'Attendance'),
        ('ACTIVITIES', 'Extra-curricular Activities'),
        ('BEHAVIOR', 'Behavior Points'),
        ('HOMEWORK', 'Homework Completion'),
        ('SPORTS', 'Sports Achievement'),
        ('TEACHER_PERFORMANCE', 'Teacher Performance'),
        ('TEACHER_ATTENDANCE', 'Teacher Attendance'),
        ('CUSTOM', 'Custom'),
    ]
    
    PERIOD_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
        ('ALL_TIME', 'All Time'),
    ]
    
    TARGET_CHOICES = [
        ('STUDENT', 'Student'),
        ('TEACHER', 'Teacher'),
        ('CLASS', 'Class/Section'),
        ('HOUSE', 'House'),
    ]
    
    name = models.CharField(
        max_length=100,
        help_text=_('Leaderboard name')
    )
    
    leaderboard_type = models.CharField(
        max_length=30,
        choices=LEADERBOARD_TYPES,
        db_index=True,
        help_text=_('Type of leaderboard')
    )
    
    target = models.CharField(
        max_length=20,
        choices=TARGET_CHOICES,
        default='STUDENT',
        help_text=_('Who is ranked in this leaderboard')
    )
    
    period = models.CharField(
        max_length=20,
        choices=PERIOD_CHOICES,
        default='MONTHLY',
        help_text=_('Time period for rankings')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Leaderboard description')
    )
    
    # Display settings
    icon = models.CharField(
        max_length=50,
        default='🏆',
        help_text=_('Icon for this leaderboard')
    )
    
    color = models.CharField(
        max_length=20,
        default='gold',
        help_text=_('Theme color')
    )
    
    max_entries = models.IntegerField(
        default=10,
        help_text=_('Maximum entries to show')
    )
    
    show_scores = models.BooleanField(
        default=True,
        help_text=_('Show actual scores')
    )
    
    show_rank_change = models.BooleanField(
        default=True,
        help_text=_('Show rank changes from previous period')
    )
    
    # Visibility settings
    is_public = models.BooleanField(
        default=True,
        help_text=_('Visible on public website')
    )
    
    visible_to_students = models.BooleanField(
        default=True,
        help_text=_('Visible to students')
    )
    
    visible_to_parents = models.BooleanField(
        default=True,
        help_text=_('Visible to parents')
    )
    
    visible_to_teachers = models.BooleanField(
        default=True,
        help_text=_('Visible to teachers')
    )
    
    # Filtering
    class_filter = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leaderboards',
        help_text=_('Filter by class (optional)')
    )
    
    section_filter = models.ForeignKey(
        'tenants.Section',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leaderboards',
        help_text=_('Filter by section (optional)')
    )
    
    # Scoring configuration (for custom leaderboards)
    scoring_config = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Custom scoring configuration')
    )
    
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this leaderboard is active')
    )
    
    class Meta:
        db_table = 'leaderboards'
        verbose_name = _('Leaderboard')
        verbose_name_plural = _('Leaderboards')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_leaderboard_type_display()})"


class LeaderboardEntry(TenantAwareModel):
    """
    Individual leaderboard entries with scores and rankings.
    Updated periodically based on leaderboard type.
    """
    
    leaderboard = models.ForeignKey(
        Leaderboard,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    
    # The ranked entity
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboard_entries'
    )
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboard_entries'
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboard_entries',
        help_text=_('Section for class rankings')
    )
    
    # Ranking data
    rank = models.IntegerField(
        db_index=True,
        help_text=_('Current rank')
    )
    
    previous_rank = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('Previous rank for comparison')
    )
    
    score = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Score value')
    )
    
    # Period tracking
    period_start = models.DateField(
        help_text=_('Period start date')
    )
    
    period_end = models.DateField(
        help_text=_('Period end date')
    )
    
    # Additional data
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional details (breakdown, achievements, etc.)')
    )
    
    class Meta:
        db_table = 'leaderboard_entries'
        verbose_name = _('Leaderboard Entry')
        verbose_name_plural = _('Leaderboard Entries')
        ordering = ['rank']
        indexes = [
            models.Index(fields=['leaderboard', 'rank']),
            models.Index(fields=['leaderboard', 'period_start', 'period_end']),
            models.Index(fields=['student', 'leaderboard']),
            models.Index(fields=['staff', 'leaderboard']),
        ]
    
    def __str__(self):
        entity = self.student or self.staff or self.section
        return f"#{self.rank} - {entity}"
    
    @property
    def rank_change(self):
        """Calculate rank change from previous period."""
        if self.previous_rank is None:
            return None
        return self.previous_rank - self.rank  # Positive = moved up


class DashboardWidget(TenantAwareModel):
    """
    Widget data cache for dashboard widgets.
    Stores pre-computed widget data for performance.
    """
    
    widget = models.ForeignKey(
        WidgetDefinition,
        on_delete=models.CASCADE,
        related_name='data_cache'
    )
    
    # Cached data
    data = models.JSONField(
        default=dict,
        help_text=_('Cached widget data')
    )
    
    # Cache metadata
    last_updated = models.DateTimeField(
        auto_now=True,
        help_text=_('When data was last updated')
    )
    
    cache_valid_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When cache expires')
    )
    
    # Additional filters (for filtered widget instances)
    filters = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Filters applied to this widget instance')
    )
    
    class Meta:
        db_table = 'dashboard_widget_cache'
        verbose_name = _('Widget Data Cache')
        verbose_name_plural = _('Widget Data Caches')
        unique_together = ['tenant', 'widget', 'filters']
    
    def __str__(self):
        return f"{self.widget.name} - {self.tenant.name}"
    
    def is_valid(self):
        """Check if cache is still valid."""
        from django.utils import timezone
        if not self.cache_valid_until:
            return False
        return timezone.now() < self.cache_valid_until
