"""
Dashboard Models for NucleiQ
Widget registry and dashboard layout management
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


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
        ('system', 'System'),
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
    
    # Configuration schema
    config_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('JSON schema for widget configuration')
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this widget is available')
    )
    
    display_order = models.IntegerField(
        default=0,
        help_text=_('Display order in widget library')
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
            user_role_codes = user.roles.values_list('code', flat=True)
            if not any(role in self.available_for_roles for role in user_role_codes):
                return False
        
        # Check permissions
        if self.required_permissions:
            for permission in self.required_permissions:
                resource, action = permission.split('.')
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
        
        widget_config = {
            'i': widget_id,
            'x': x,
            'y': y,
            'w': w or widget_def.default_width,
            'h': h or widget_def.default_height,
            'minW': widget_def.min_width,
            'minH': widget_def.min_height,
        }
        
        if config:
            widget_config['config'] = config
        
        self.layout.append(widget_config)
        self.save(update_fields=['layout', 'last_modified_at'])
        return True
    
    def remove_widget(self, widget_id):
        """Remove a widget from the layout."""
        self.layout = [w for w in self.layout if w.get('i') != widget_id]
        self.save(update_fields=['layout', 'last_modified_at'])
    
    def update_widget_config(self, widget_id, config):
        """Update widget configuration."""
        for widget in self.layout:
            if widget.get('i') == widget_id:
                widget['config'] = config
                break
        
        self.save(update_fields=['layout', 'last_modified_at'])
