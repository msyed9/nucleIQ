"""
Serializers for User Management and RBAC
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    User, UserPreference, Role, Permission, 
    RolePermission, UserRole, ImpersonationLog
)


class UserPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user preferences."""
    
    is_rtl = serializers.ReadOnlyField()
    
    class Meta:
        model = UserPreference
        fields = [
            'theme_mode', 'density', 'language', 'notification_channels',
            'sidebar_collapsed', 'dashboard_widgets', 'timezone',
            'date_format', 'time_format', 'is_rtl'
        ]
    
    def validate_notification_channels(self, value):
        """Validate notification channels structure."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Notification channels must be a dictionary")
        
        valid_channels = ['email', 'sms', 'whatsapp', 'push']
        for channel in value.keys():
            if channel not in valid_channels:
                raise serializers.ValidationError(
                    f"Invalid channel: {channel}. Valid channels: {', '.join(valid_channels)}"
                )
        
        return value
    
    def validate_dashboard_widgets(self, value):
        """Validate dashboard widgets structure."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Dashboard widgets must be a list")
        
        for widget in value:
            if not isinstance(widget, dict):
                raise serializers.ValidationError("Each widget must be a dictionary")
            
            required_fields = ['widgetId', 'x', 'y', 'w', 'h']
            for field in required_fields:
                if field not in widget:
                    raise serializers.ValidationError(
                        f"Widget missing required field: {field}"
                    )
        
        return value


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for permissions."""
    
    class Meta:
        model = Permission
        fields = [
            'id', 'resource', 'action', 'code', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'created_at', 'updated_at']


class RolePermissionSerializer(serializers.ModelSerializer):
    """Serializer for role-permission relationships."""
    
    permission = PermissionSerializer(read_only=True)
    permission_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = RolePermission
        fields = [
            'id', 'permission', 'permission_id', 'granted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'granted_at', 'created_at', 'updated_at']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for roles."""
    
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'code', 'description', 'is_active',
            'permissions', 'permission_ids', 'user_count',
            'tenant', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
    
    def get_user_count(self, obj):
        """Get count of users with this role."""
        return obj.users.filter(is_active=True).count()
    
    def create(self, validated_data):
        """Create role with permissions."""
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        
        # Assign permissions
        for permission_id in permission_ids:
            RolePermission.objects.create(
                role=role,
                permission_id=permission_id
            )
        
        return role
    
    def update(self, instance, validated_data):
        """Update role and permissions."""
        permission_ids = validated_data.pop('permission_ids', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update permissions if provided
        if permission_ids is not None:
            # Remove existing permissions
            instance.role_permissions.all().delete()
            
            # Add new permissions
            for permission_id in permission_ids:
                RolePermission.objects.create(
                    role=instance,
                    permission_id=permission_id
                )
        
        return instance


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user-role relationships."""
    
    role = RoleSerializer(read_only=True)
    role_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'role', 'role_id', 'assigned_at', 'assigned_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_at', 'assigned_by', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user model."""
    
    preference = UserPreferenceSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    full_name = serializers.ReadOnlyField(source='get_full_name')
    short_name = serializers.ReadOnlyField(source='get_short_name')
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'short_name',
            'phone_number', 'avatar_url', 'is_active', 'is_2fa_enabled',
            'is_platform_admin', 'tenant', 'roles', 'role_ids', 'preference',
            'last_login', 'last_login_ip', 'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tenant', 'last_login', 'last_login_ip', 'date_joined',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        """Create user with roles."""
        role_ids = validated_data.pop('role_ids', [])
        user = User.objects.create_user(**validated_data)
        
        # Assign roles
        for role_id in role_ids:
            UserRole.objects.create(
                user=user,
                role_id=role_id,
                assigned_by=self.context.get('request').user if self.context.get('request') else None
            )
        
        # Create default preferences
        UserPreference.objects.create(user=user)
        
        return user
    
    def update(self, instance, validated_data):
        """Update user and roles."""
        role_ids = validated_data.pop('role_ids', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update roles if provided
        if role_ids is not None:
            # Remove existing roles
            instance.user_roles.all().delete()
            
            # Add new roles
            for role_id in role_ids:
                UserRole.objects.create(
                    user=instance,
                    role_id=role_id,
                    assigned_by=self.context.get('request').user if self.context.get('request') else None
                )
        
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration/creation with password."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    role_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'phone_number', 'avatar_url', 'role_ids'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match'
            })
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role_ids = validated_data.pop('role_ids', [])
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Assign roles
        for role_id in role_ids:
            UserRole.objects.create(
                user=user,
                role_id=role_id,
                assigned_by=self.context.get('request').user if self.context.get('request') else None
            )
        
        # Create default preferences
        UserPreference.objects.create(user=user)
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate passwords."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Passwords do not match'
            })
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset."""
    
    email = serializers.EmailField(required=True)


class ResetPasswordConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Passwords do not match'
            })
        return attrs


class ImpersonationLogSerializer(serializers.ModelSerializer):
    """Serializer for impersonation logs."""
    
    impersonator_email = serializers.ReadOnlyField(source='impersonator.email')
    impersonated_user_email = serializers.ReadOnlyField(source='impersonated_user.email')
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ImpersonationLog
        fields = [
            'id', 'impersonator', 'impersonator_email',
            'impersonated_user', 'impersonated_user_email',
            'tenant', 'tenant_name', 'started_at', 'ended_at',
            'duration', 'ip_address', 'reason', 'created_at'
        ]
        read_only_fields = ['id', 'started_at', 'created_at']
    
    def get_duration(self, obj):
        """Calculate impersonation duration."""
        if obj.ended_at:
            delta = obj.ended_at - obj.started_at
            return str(delta)
        return "Ongoing"


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (current user)."""
    
    preference = UserPreferenceSerializer()
    roles = RoleSerializer(many=True, read_only=True)
    permissions = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField(source='get_full_name')
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    tenant_branding = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'avatar_url', 'is_active', 'is_2fa_enabled',
            'is_platform_admin', 'tenant', 'tenant_name', 'tenant_branding',
            'roles', 'permissions', 'preference', 'last_login', 'date_joined'
        ]
        read_only_fields = fields
    
    def get_permissions(self, obj):
        """Get all permissions for the user."""
        if obj.is_platform_admin or obj.is_superuser:
            return ['*']  # All permissions
        
        permissions = Permission.objects.filter(
            role_permissions__role__users=obj,
            role_permissions__role__is_active=True
        ).distinct()
        
        return [f"{p.resource}.{p.action}" for p in permissions]
    
    def get_tenant_branding(self, obj):
        """Get tenant branding if available."""
        if obj.tenant and hasattr(obj.tenant, 'branding'):
            branding = obj.tenant.branding
            return {
                'logo_url': branding.logo_url,
                'favicon_url': branding.favicon_url,
                'primary_color': branding.primary_color,
                'secondary_color': branding.secondary_color,
                'sidebar_color': branding.sidebar_color,
                'font_family': branding.font_family,
            }
        return None
