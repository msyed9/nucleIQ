"""
Dashboard Serializers
"""

from rest_framework import serializers
from .models import (
    WidgetDefinition, 
    DashboardLayout, 
    RoleDefaultLayout,
    ParentDashboardConfig,
    Leaderboard,
    LeaderboardEntry
)


class WidgetDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for WidgetDefinition model."""
    
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = WidgetDefinition
        fields = [
            'id', 'widget_id', 'name', 'description', 'component_name',
            'category', 'category_display', 'available_for_roles', 'required_permissions',
            'default_width', 'default_height', 'min_width', 'min_height',
            'max_width', 'max_height', 'config_schema', 'default_config',
            'icon', 'preview_image', 'is_active', 'is_system', 'display_order',
            'data_endpoint', 'refresh_interval', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardLayoutSerializer(serializers.ModelSerializer):
    """Serializer for DashboardLayout model."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DashboardLayout
        fields = [
            'id', 'user', 'user_email', 'user_name', 'layout', 
            'is_customized', 'last_modified_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'user_name', 'last_modified_at', 'created_at']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class LayoutUpdateSerializer(serializers.Serializer):
    """Serializer for updating dashboard layout."""
    
    layout = serializers.ListField(
        child=serializers.DictField(),
        help_text='List of widget configurations'
    )
    
    def validate_layout(self, value):
        """Validate layout format."""
        required_keys = {'i', 'x', 'y', 'w', 'h'}
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError('Each layout item must be a dictionary')
            
            missing_keys = required_keys - set(item.keys())
            if missing_keys:
                raise serializers.ValidationError(
                    f'Layout item missing required keys: {missing_keys}'
                )
            
            # Validate position and size are non-negative
            for key in ['x', 'y', 'w', 'h']:
                if not isinstance(item[key], (int, float)) or item[key] < 0:
                    raise serializers.ValidationError(
                        f'{key} must be a non-negative number'
                    )
        
        return value


class WidgetConfigSerializer(serializers.Serializer):
    """Serializer for updating widget configuration."""
    
    widget_id = serializers.CharField(max_length=100)
    config = serializers.DictField()


class RoleDefaultLayoutSerializer(serializers.ModelSerializer):
    """Serializer for RoleDefaultLayout model."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = RoleDefaultLayout
        fields = [
            'id', 'tenant', 'tenant_name', 'role_code', 'name', 'description',
            'layout', 'is_active', 'priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'tenant_name', 'created_at', 'updated_at']


class ParentDashboardConfigSerializer(serializers.ModelSerializer):
    """Serializer for ParentDashboardConfig model."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = ParentDashboardConfig
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'description', 'layout',
            'visible_widgets', 'hidden_widgets', 'quick_links',
            'show_announcements', 'max_announcements',
            'show_activity_feed', 'activity_feed_days',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'tenant_name', 'created_at', 'updated_at']


class LeaderboardSerializer(serializers.ModelSerializer):
    """Serializer for Leaderboard model."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    leaderboard_type_display = serializers.CharField(source='get_leaderboard_type_display', read_only=True)
    period_display = serializers.CharField(source='get_period_display', read_only=True)
    target_display = serializers.CharField(source='get_target_display', read_only=True)
    class_filter_name = serializers.CharField(source='class_filter.name', read_only=True, allow_null=True)
    section_filter_name = serializers.CharField(source='section_filter.__str__', read_only=True, allow_null=True)
    entries_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Leaderboard
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'leaderboard_type', 'leaderboard_type_display',
            'target', 'target_display', 'period', 'period_display', 'description',
            'icon', 'color', 'max_entries', 'show_scores', 'show_rank_change',
            'is_public', 'visible_to_students', 'visible_to_parents', 'visible_to_teachers',
            'class_filter', 'class_filter_name', 'section_filter', 'section_filter_name',
            'scoring_config', 'is_active', 'entries_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'tenant_name', 'entries_count', 'created_at', 'updated_at']
    
    def get_entries_count(self, obj):
        return obj.entries.count()


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Serializer for LeaderboardEntry model."""
    
    leaderboard_name = serializers.CharField(source='leaderboard.name', read_only=True)
    entity_name = serializers.SerializerMethodField()
    entity_type = serializers.SerializerMethodField()
    entity_photo = serializers.SerializerMethodField()
    rank_change = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'leaderboard', 'leaderboard_name', 'student', 'staff', 'section',
            'entity_name', 'entity_type', 'entity_photo',
            'rank', 'previous_rank', 'rank_change', 'score',
            'period_start', 'period_end', 'details', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_entity_name(self, obj):
        if obj.student:
            return obj.student.get_full_name()
        elif obj.staff:
            return f"{obj.staff.first_name} {obj.staff.last_name}"
        elif obj.section:
            return str(obj.section)
        return None
    
    def get_entity_type(self, obj):
        if obj.student:
            return 'student'
        elif obj.staff:
            return 'staff'
        elif obj.section:
            return 'section'
        return None
    
    def get_entity_photo(self, obj):
        if obj.student and obj.student.photo:
            return obj.student.photo.url
        elif obj.staff and obj.staff.photo:
            return obj.staff.photo.url
        return None


class WidgetDataRequestSerializer(serializers.Serializer):
    """Serializer for widget data request."""
    
    widget_id = serializers.CharField(max_length=100)
    config = serializers.DictField(required=False, default=dict)


class BatchWidgetDataRequestSerializer(serializers.Serializer):
    """Serializer for batch widget data request."""
    
    widgets = serializers.ListField(
        child=WidgetDataRequestSerializer()
    )
