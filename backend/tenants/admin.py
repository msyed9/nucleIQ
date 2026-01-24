"""
Tenant admin configuration for NucleiQ
"""

from django import forms
from django.contrib import admin
from config.admin import admin_site
from .models import Tenant, TenantBranding, Domain, AcademicYear

print("DEBUG: Tenants Admin loading...")

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


class TenantAdminForm(forms.ModelForm):
    """Custom form for Tenant admin with checkbox selection for modules."""
    
    # Selection field for modules
    module_selection = forms.MultipleChoiceField(
        choices=Tenant.AVAILABLE_MODULES,
        widget=forms.CheckboxSelectMultiple(attrs={
            'class': 'module-checkbox-list'
        }),
        required=False,
        label="Module Access Control",
        help_text="Select modules for this tenant. Basic modules are always included."
    )
    
    class Meta:
        model = Tenant
        fields = ['name', 'subdomain', 'plan', 'is_active', 'admin_email', 'admin_phone', 
                 'max_students', 'max_staff', 'trial_ends_at', 'subscription_starts_at', 
                 'subscription_ends_at', 'session_timeout_minutes', 'refresh_timeout_days', 
                 'admin_session_timeout_minutes', 'metadata']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-select the enabled modules
        if self.instance and self.instance.pk:
            self.initial['module_selection'] = self.instance.get_all_enabled_modules()
        else:
            self.initial['module_selection'] = Tenant.BASIC_MODULES
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.enabled_modules = self.cleaned_data.get('module_selection', [])
        if commit:
            instance.save()
        return instance


@admin.register(Tenant, site=admin_site)
class TenantAdmin(admin.ModelAdmin):
    """Admin interface for Tenant model."""
    
    form = TenantAdminForm
    
    list_display = (
        'name', 'subdomain', 'plan', 'is_active', 
        'admin_email', 'module_count', 'created_at'
    )
    list_filter = ('plan', 'is_active', 'created_at')
    search_fields = ('name', 'subdomain', 'admin_email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'subdomain', 'is_active', 'module_selection')
        }),
        ('Contact Information', {
            'fields': ('admin_email', 'admin_phone')
        }),
        ('Subscription & Limits', {
            'fields': (
                'plan', 'trial_ends_at', 
                'subscription_starts_at', 'subscription_ends_at',
                'max_students', 'max_staff'
            )
        }),
        ('Advanced Configuration', {
            'fields': (
                'session_timeout_minutes',
                'refresh_timeout_days',
                'admin_session_timeout_minutes',
                'metadata'
            ),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [TenantBrandingInline, DomainInline, AcademicYearInline]
    
    def module_count(self, obj):
        """Display count of enabled modules."""
        modules = obj.get_all_enabled_modules()
        return f"{len(modules)} / {len(Tenant.AVAILABLE_MODULES)}"
    module_count.short_description = 'Modules'
    
    class Media:
        css = {
            'all': ('admin/css/module_access.css',)
        }


@admin.register(TenantBranding, site=admin_site)
class TenantBrandingAdmin(admin.ModelAdmin):
    """Admin interface for TenantBranding model."""
    
    list_display = ('tenant', 'school_name', 'primary_color', 'created_at')
    search_fields = ('tenant__name', 'school_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Tenant Link', {
            'fields': ('tenant',)
        }),
        ('School Identity', {
            'fields': ('school_name', 'school_address', 'school_phone', 'school_email')
        }),
        ('Visual Branding', {
            'fields': (
                'logo_url', 'favicon_url', 
                'login_background_url', 'email_header_image',
                'primary_color', 'secondary_color', 'sidebar_color',
                'font_family'
            )
        }),
        ('Icons & Themes', {
            'fields': ('icon_theme', 'icon_set')
        }),
        ('Documents', {
            'fields': ('receipt_copies', 'receipt_footer_text')
        }),
        ('Advanced', {
            'fields': ('gallery_images', 'custom_css'),
            'classes': ('collapse',)
        }),
    )


# Do not register on default admin.site to avoid conflicts
# The custom NucleiQ admin site already handles registration via decoarators.

admin_site.register(Domain)
admin_site.register(AcademicYear)
