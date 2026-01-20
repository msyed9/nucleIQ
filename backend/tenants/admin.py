"""
Tenant admin configuration
"""

from django.contrib import admin
from config.admin import admin_site
from .models import Tenant, TenantBranding, Domain, AcademicYear


class TenantBrandingInline(admin.StackedInline):
    """Inline admin for tenant branding."""
    model = TenantBranding
    extra = 0
    can_delete = False


class DomainInline(admin.TabularInline):
    """Inline admin for tenant domains."""
    model = Domain
    extra = 1


class AcademicYearInline(admin.TabularInline):
    """Inline admin for academic years."""
    model = AcademicYear
    extra = 1
    fields = ('name', 'start_date', 'end_date', 'is_active', 'is_locked')


@admin.register(Tenant, site=admin_site)
class TenantAdmin(admin.ModelAdmin):
    """Admin interface for Tenant model."""
    
    list_display = (
        'name', 'subdomain', 'plan', 'is_active', 
        'admin_email', 'created_at'
    )
    list_filter = ('plan', 'is_active', 'created_at')
    search_fields = ('name', 'subdomain', 'admin_email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'subdomain', 'is_active')
        }),
        ('Contact Information', {
            'fields': ('admin_email', 'admin_phone')
        }),
        ('Subscription', {
            'fields': (
                'plan', 'trial_ends_at', 
                'subscription_starts_at', 'subscription_ends_at'
            )
        }),
        ('Limits', {
            'fields': ('max_students', 'max_staff')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [TenantBrandingInline, DomainInline, AcademicYearInline]


@admin.register(TenantBranding, site=admin_site)
class TenantBrandingAdmin(admin.ModelAdmin):
    """Admin interface for TenantBranding model."""
    
    list_display = ('tenant', 'primary_color', 'created_at')
    search_fields = ('tenant__name',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Tenant', {
            'fields': ('tenant',)
        }),
        ('Visual Assets', {
            'fields': (
                'logo_url', 'favicon_url', 
                'login_background_url', 'email_header_image'
            )
        }),
        ('Colors', {
            'fields': ('primary_color', 'secondary_color', 'sidebar_color')
        }),
        ('Typography', {
            'fields': ('font_family',)
        }),
        ('Gallery', {
            'fields': ('gallery_images',)
        }),
        ('Advanced', {
            'fields': ('custom_css',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Domain, site=admin_site)
class DomainAdmin(admin.ModelAdmin):
    """Admin interface for Domain model."""
    
    list_display = (
        'domain', 'tenant', 'is_primary', 
        'is_active', 'verified_at'
    )
    list_filter = ('is_primary', 'is_active', 'verified_at')
    search_fields = ('domain', 'tenant__name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(AcademicYear, site=admin_site)
class AcademicYearAdmin(admin.ModelAdmin):
    """Admin interface for AcademicYear model."""
    
    list_display = (
        'name', 'tenant', 'start_date', 'end_date', 
        'is_active', 'is_locked'
    )
    list_filter = ('is_active', 'is_locked', 'tenant')
    search_fields = ('name', 'tenant__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'description')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('is_active', 'is_locked')
        }),
        ('Audit', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
