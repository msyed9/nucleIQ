"""
User Models for NucleIQ
Implements custom User model with tenant awareness, UserPreference, and RBAC models.
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, TenantAwareModel


class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier
    instead of username.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError(_('The Email field must be set'))
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_platform_admin', True)  # Superusers are platform admins
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, TenantAwareModel):
    """
    Custom User model inheriting from AbstractUser and TenantAwareModel.
    
    Key Features:
    - Email as username (globally unique)
    - Tenant-aware (multi-tenancy support)
    - Soft delete and audit trail from TenantAwareModel
    - Support for platform super admins (tenant=None)
    """
    
    # Override username to make it optional (we use email)
    username = None
    
    # Email as the primary identifier
    email = models.EmailField(
        _('email address'),
        unique=True,
        db_index=True,
        help_text=_('Globally unique email address')
    )
    
    # Override tenant field to allow null for super admins
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        db_index=True,
        help_text=_('Tenant this user belongs to (null for platform super admins)')
    )
    
    # Additional profile fields
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message='Phone number must be entered in the format: +999999999. Up to 15 digits allowed.'
            )
        ],
        help_text=_('Contact phone number')
    )
    
    avatar_url = models.URLField(
        max_length=500,
        blank=True,
        help_text=_('URL to user avatar image')
    )
    
    # Role relationship (many-to-many through UserRole for flexibility)
    roles = models.ManyToManyField(
        'Role',
        through='UserRole',
        through_fields=('user', 'role'),
        related_name='users',
        blank=True,
        help_text=_('Roles assigned to this user')
    )
    
    # Two-Factor Authentication
    is_2fa_enabled = models.BooleanField(
        default=False,
        help_text=_('Whether 2FA is enabled for this user')
    )
    
    totp_secret = models.CharField(
        max_length=32,
        blank=True,
        help_text=_('TOTP secret for 2FA')
    )
    
    # Last login tracking
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_('IP address of last login')
    )
    
    # Platform super admin flag
    is_platform_admin = models.BooleanField(
        default=False,
        db_index=True,
        help_text=_('Platform super admin (can manage all tenants)')
    )
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()
    
    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['email']
        indexes = [
            models.Index(fields=['tenant', 'email']),
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name or self.email
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name or self.email.split('@')[0]
    
    def save(self, *args, **kwargs):
        """Override save to handle platform admins (no tenant required)."""
        # Platform admins don't need a tenant
        if self.is_platform_admin:
            self.tenant = None
        
        # For regular users, tenant is required (handled by TenantAwareModel)
        if not self.is_platform_admin and not self.tenant_id:
            from core.middleware import get_current_tenant
            tenant = get_current_tenant()
            if tenant:
                self.tenant = tenant
            else:
                raise ValueError(
                    "Cannot save User without a tenant context. "
                    "Set is_platform_admin=True for platform admins."
                )
        
        super(AbstractUser, self).save(*args, **kwargs)
    
    def has_permission(self, resource, action):
        """
        Check if user has permission for a specific resource and action.
        
        Args:
            resource: Resource/module name (e.g., 'student_module')
            action: Action name (e.g., 'create', 'read', 'update', 'delete')
        
        Returns:
            bool: True if user has permission, False otherwise
        """
        if self.is_platform_admin or self.is_superuser:
            return True
        
        # Check through user's roles
        return self.roles.filter(
            role_permissions__permission__resource=resource,
            role_permissions__permission__action=action,
            is_active=True
        ).exists()


class UserPreference(models.Model):
    """
    User preferences for UI customization and personalization.
    
    Stores granular settings for:
    - Theme (light/dark/system)
    - UI density
    - Language and RTL support
    - Notification channels
    - Dashboard layout
    
    Note: Does not inherit from BaseModel to avoid primary key conflict.
    """
    
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]
    
    DENSITY_CHOICES = [
        ('compact', 'Compact'),
        ('comfortable', 'Comfortable'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('ar', 'Arabic'),
        ('ur', 'Urdu'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preference',
        primary_key=True,
        help_text=_('User these preferences belong to')
    )
    
    # UI Preferences
    theme_mode = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='system',
        help_text=_('UI theme preference')
    )
    
    density = models.CharField(
        max_length=15,
        choices=DENSITY_CHOICES,
        default='comfortable',
        help_text=_('UI density preference')
    )
    
    language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default='en',
        db_index=True,
        help_text=_('Preferred language')
    )
    
    # Notification Preferences
    notification_channels = models.JSONField(
        default=dict,
        help_text=_('Notification channel preferences (e.g., {"sms": true, "email": false, "whatsapp": true})')
    )
    
    # Layout Preferences
    sidebar_collapsed = models.BooleanField(
        default=False,
        help_text=_('Whether sidebar is collapsed by default')
    )
    
    dashboard_widgets = models.JSONField(
        default=list,
        help_text=_('Dashboard widget configuration (order and visibility)')
    )
    
    # Additional settings
    timezone = models.CharField(
        max_length=50,
        default='UTC',
        help_text=_('User timezone')
    )
    
    date_format = models.CharField(
        max_length=20,
        default='YYYY-MM-DD',
        help_text=_('Preferred date format')
    )
    
    time_format = models.CharField(
        max_length=10,
        default='24h',
        choices=[('12h', '12 Hour'), ('24h', '24 Hour')],
        help_text=_('Preferred time format')
    )
    
    # Font Customization
    font_family = models.CharField(
        max_length=100,
        default='Inter, sans-serif',
        help_text=_('Preferred font family (e.g., Inter, Roboto, Poppins)')
    )
    
    font_size = models.CharField(
        max_length=20,
        default='medium',
        choices=[
            ('small', 'Small (14px)'),
            ('medium', 'Medium (16px)'),
            ('large', 'Large (18px)'),
            ('extra-large', 'Extra Large (20px)'),
        ],
        help_text=_('Preferred font size')
    )
    
    font_color = models.CharField(
        max_length=7,
        default='#1a1a1a',
        help_text=_('Custom text color in hex format (e.g., #1a1a1a)')
    )
    
    heading_color = models.CharField(
        max_length=7,
        default='#1a1a1a',
        help_text=_('Custom heading color in hex format (e.g., #1a1a1a)')
    )
    
    link_color = models.CharField(
        max_length=7,
        default='#0066cc',
        help_text=_('Custom link color in hex format (e.g., #0066cc)')
    )
    
    class Meta:
        db_table = 'user_preferences'
        verbose_name = _('User Preference')
        verbose_name_plural = _('User Preferences')
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
    
    @property
    def is_rtl(self):
        """Check if current language requires RTL layout."""
        return self.language in ['ar', 'ur']
    
    def get_default_notification_channels(self):
        """Get default notification channels if not set."""
        if not self.notification_channels:
            return {
                'email': True,
                'sms': False,
                'whatsapp': False,
                'push': True
            }
        return self.notification_channels


class Role(TenantAwareModel):
    """
    Role model for RBAC.
    
    Roles are tenant-specific and can have multiple permissions.
    Examples: Principal, Teacher, Accountant, Librarian, etc.
    """
    
    name = models.CharField(
        max_length=100,
        help_text=_('Role name (e.g., Principal, Teacher)')
    )
    
    code = models.SlugField(
        max_length=50,
        help_text=_('Unique role code (e.g., principal, teacher)')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Role description')
    )
    
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this role is active')
    )
    
    # Permissions are linked through RolePermission model
    permissions = models.ManyToManyField(
        'Permission',
        through='RolePermission',
        related_name='roles',
        blank=True,
        help_text=_('Permissions assigned to this role')
    )
    
    class Meta:
        db_table = 'roles'
        verbose_name = _('Role')
        verbose_name_plural = _('Roles')
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'code'],
                name='unique_role_code_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name if self.tenant else 'Global'})"


class Permission(BaseModel):
    """
    Permission model for granular access control.
    
    Defines what actions can be performed on which resources.
    Permissions are global (not tenant-specific) but assigned to roles per tenant.
    """
    
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('export', 'Export'),
        ('import', 'Import'),
    ]
    
    resource = models.CharField(
        max_length=100,
        db_index=True,
        help_text=_('Resource/module name (e.g., student_module, fee_module)')
    )
    
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        db_index=True,
        help_text=_('Action that can be performed')
    )
    
    code = models.SlugField(
        max_length=150,
        unique=True,
        help_text=_('Unique permission code (e.g., student_module.create)')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Permission description')
    )
    
    class Meta:
        db_table = 'permissions'
        verbose_name = _('Permission')
        verbose_name_plural = _('Permissions')
        ordering = ['resource', 'action']
        constraints = [
            models.UniqueConstraint(
                fields=['resource', 'action'],
                name='unique_resource_action'
            )
        ]
    
    def __str__(self):
        return f"{self.resource}.{self.action}"
    
    def save(self, *args, **kwargs):
        """Auto-generate code from resource and action."""
        if not self.code:
            self.code = f"{self.resource}.{self.action}"
        super().save(*args, **kwargs)


class RolePermission(BaseModel):
    """
    Many-to-many relationship between Role and Permission.
    
    Allows for additional metadata on the relationship if needed.
    """
    
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        help_text=_('Role')
    )
    
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        help_text=_('Permission')
    )
    
    # Optional: Add constraints or conditions
    granted_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When this permission was granted to the role')
    )
    
    class Meta:
        db_table = 'role_permissions'
        verbose_name = _('Role Permission')
        verbose_name_plural = _('Role Permissions')
        constraints = [
            models.UniqueConstraint(
                fields=['role', 'permission'],
                name='unique_role_permission'
            )
        ]
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.code}"


class UserRole(BaseModel):
    """
    Many-to-many relationship between User and Role.
    
    Allows users to have multiple roles with additional metadata.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles',
        help_text=_('User')
    )
    
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles',
        help_text=_('Role')
    )
    
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When this role was assigned to the user')
    )
    
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_assigned',
        help_text=_('User who assigned this role')
    )
    
    class Meta:
        db_table = 'user_roles'
        verbose_name = _('User Role')
        verbose_name_plural = _('User Roles')
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'role'],
                name='unique_user_role'
            )
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.role.name}"


class ImpersonationLog(BaseModel):
    """
    Log of super admin impersonation sessions.
    
    Tracks when platform admins "login as" a tenant user for support purposes.
    """
    
    impersonator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='impersonations_made',
        help_text=_('Platform admin who performed the impersonation')
    )
    
    impersonated_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='impersonations_received',
        help_text=_('User who was impersonated')
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='impersonation_logs',
        help_text=_('Tenant context of the impersonation')
    )
    
    started_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When impersonation started')
    )
    
    ended_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When impersonation ended')
    )
    
    ip_address = models.GenericIPAddressField(
        help_text=_('IP address of the impersonator')
    )
    
    reason = models.TextField(
        help_text=_('Reason for impersonation')
    )
    
    class Meta:
        db_table = 'impersonation_logs'
        verbose_name = _('Impersonation Log')
        verbose_name_plural = _('Impersonation Logs')
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.impersonator.email} -> {self.impersonated_user.email} ({self.started_at})"
