"""
Serializers for Dashboard app
"""

from rest_framework import serializers
from .models import WidgetDefinition, DashboardLayout


class WidgetDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for widget definitions."""
    
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = WidgetDefinition
        fields = [
            'id', 'widget_id', 'name', 'description', 'component_name',
            'category', 'available_for_roles', 'required_permissions',
            'default_width', 'default_height', 'min_width', 'min_height',
            'config_schema', 'is_active', 'display_order', 'is_available',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_available']
    
    def get_is_available(self, obj):
        """Check if widget is available for current user."""
        request = self.context.get('request')
        if request and request.user:
            return obj.is_available_for_user(request.user)
        return False


class DashboardLayoutSerializer(serializers.ModelSerializer):
    """Serializer for dashboard layouts."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    widget_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DashboardLayout
        fields = [
            'id', 'user', 'user_email', 'layout', 'widget_count',
            'last_modified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'user_email', 'widget_count',
            'last_modified_at', 'created_at', 'updated_at'
        ]
    
    def get_widget_count(self, obj):
        """Get number of widgets in layout."""
        return len(obj.layout) if obj.layout else 0


class LayoutUpdateSerializer(serializers.Serializer):
    """Serializer for updating dashboard layout."""
    
    layout = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of widget configurations"
    )
    
    def validate_layout(self, value):
        """Validate layout structure."""
        for widget in value:
            # Validate required fields
            required_fields = ['i', 'x', 'y', 'w', 'h']
            for field in required_fields:
                if field not in widget:
                    raise serializers.ValidationError(
                        f"Widget must have '{field}' field"
                    )
            
            # Validate types
            if not isinstance(widget['x'], int) or not isinstance(widget['y'], int):
                raise serializers.ValidationError("x and y must be integers")
            
            if not isinstance(widget['w'], int) or not isinstance(widget['h'], int):
                raise serializers.ValidationError("w and h must be integers")
            
            # Validate widget exists
            widget_id = widget['i']
            if not WidgetDefinition.objects.filter(
                widget_id=widget_id,
                is_active=True
            ).exists():
                raise serializers.ValidationError(
                    f"Widget '{widget_id}' does not exist or is not active"
                )
        
        return value


class WidgetConfigSerializer(serializers.Serializer):
    """Serializer for widget configuration."""
    
    widget_id = serializers.SlugField(required=True)
    config = serializers.DictField(required=True)
    
    def validate_widget_id(self, value):
        """Validate widget exists."""
        if not WidgetDefinition.objects.filter(
            widget_id=value,
            is_active=True
        ).exists():
            raise serializers.ValidationError("Widget does not exist or is not active")
        return value
