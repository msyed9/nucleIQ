"""
Core Models for NucleiQ
Provides base models with audit trail, soft delete, and tenant isolation.
"""

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class BaseModelManager(models.Manager):
    """
    Custom manager that filters out soft-deleted records by default.
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def all_with_deleted(self):
        """Include soft-deleted records."""
        return super().get_queryset()
    
    def deleted_only(self):
        """Return only soft-deleted records."""
        return super().get_queryset().filter(is_deleted=True)


class BaseModel(models.Model):
    """
    Abstract base model providing:
    - UUID primary key
    - Audit trail (created/updated by and at)
    - Soft delete functionality
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for this record"
    )
    
    # Audit trail
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when this record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when this record was last updated"
    )
    # NOTE: User audit fields (created_by, updated_by, deleted_by) removed to avoid
    # circular dependency during initial migrations. Can be added later if needed.
    
    # Soft delete
    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Soft delete flag"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when this record was soft deleted"
    )
    # Temporarily changed to UUIDField to break circular dependency during fresh migration
    deleted_by_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="UUID of user who deleted this record"
    )
    
    # Custom manager
    objects = BaseModelManager()
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
        get_latest_by = 'created_at'
    
    def soft_delete(self, user=None):
        """
        Soft delete this record.
        
        Args:
            user: The user performing the deletion
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by_id = getattr(user, 'id', user)
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by_id'])
    
    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def save(self, *args, **kwargs):
        """Override save to handle audit trail."""
        # Note: created_by and updated_by should be set in views/serializers
        # using the request.user context
        super().save(*args, **kwargs)


class TenantAwareManager(BaseModelManager):
    """
    Manager for tenant-aware models.
    Automatically filters by current tenant and excludes soft-deleted records.
    """
    def get_queryset(self):
        """
        Filter by tenant if available in thread-local storage.
        This is a safety net in addition to RLS policies.
        """
        from .middleware import get_current_tenant
        
        qs = super().get_queryset()
        tenant = get_current_tenant()
        
        if tenant:
            qs = qs.filter(tenant=tenant)
        
        return qs
    
    def all_tenants(self):
        """
        Return queryset without tenant filtering.
        Use with caution - only for super admin operations.
        """
        return models.Manager.get_queryset(self).filter(is_deleted=False)


class TenantAwareModel(BaseModel):
    """
    Abstract model for tenant-aware records.
    Inherits from BaseModel and adds tenant foreign key.
    
    CRITICAL: All tenant-aware models MUST inherit from this.
    Row Level Security (RLS) policies are applied at the database level,
    but this model provides application-level safety.
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='%(class)s_set',
        db_index=True,
        help_text="Tenant this record belongs to"
    )
    
    # Override manager
    objects = TenantAwareManager()
    
    class Meta:
        abstract = True
        # Composite index for tenant + created_at for efficient queries
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['tenant', 'is_deleted']),
        ]
    
    def save(self, *args, **kwargs):
        """
        Override save to ensure tenant is set.
        """
        from .middleware import get_current_tenant
        
        # Auto-set tenant if not already set (for new records)
        if not self.tenant_id:
            # Check if this is a User model with is_platform_admin
            if hasattr(self, 'is_platform_admin') and self.is_platform_admin:
                # Platform admins don't need a tenant
                pass
            else:
                tenant = get_current_tenant()
                if tenant:
                    self.tenant = tenant
                else:
                    raise ValueError(
                        f"Cannot save {self.__class__.__name__} without a tenant context. "
                        "Ensure TenantMiddleware is properly configured."
                    )
        
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validate that tenant is set."""
        super().clean()
        if not self.tenant_id:
            from django.core.exceptions import ValidationError
            raise ValidationError("Tenant must be set for tenant-aware models.")
