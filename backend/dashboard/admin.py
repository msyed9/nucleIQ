"""
Django Admin configuration for Dashboard app
"""

from django.contrib import admin
from .models import WidgetDefinition, DashboardLayout


@admin.register(WidgetDefinition)
class WidgetDefinitionAdmin(admin.ModelAdmin):
    """Admin interface for widget definitions."""
    
    list_display = [
        'widget_id', 'name', 'category', 'is_active', 'display_order'
    ]
    list_filter = ['category', 'is_active']
    search_fields = ['widget_id', 'name', 'description']
    ordering = ['category', 'display_order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('widget_id', 'name', 'description', 'component_name', 'category')
        }),
        ('Availability', {
            'fields': ('available_for_roles', 'required_permissions')
        }),
        ('Size Configuration', {
            'fields': ('default_width', 'default_height', 'min_width', 'min_height')
        }),
        ('Configuration Schema', {
            'fields': ('config_schema',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'display_order')
        }),
    )


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    """Admin interface for dashboard layouts."""
    
    list_display = ['user', 'widget_count', 'last_modified_at']
    search_fields = ['user__email']
    readonly_fields = ['last_modified_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Layout', {
            'fields': ('layout',)
        }),
        ('Metadata', {
            'fields': ('last_modified_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def widget_count(self, obj):
        """Display number of widgets."""
        return len(obj.layout) if obj.layout else 0
    widget_count.short_description = 'Widgets'
