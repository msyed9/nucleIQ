"""
Django Admin for ID Cards
"""

from django.contrib import admin
from .models import IDCardTemplate, IDCardDesign, IDCardGeneration


@admin.register(IDCardTemplate)
class IDCardTemplateAdmin(admin.ModelAdmin):
    """Admin interface for ID card templates."""
    
    list_display = [
        'name', 'card_type', 'orientation', 'category',
        'is_global', 'is_active'
    ]
    list_filter = ['card_type', 'orientation', 'category', 'is_global', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'description', 'card_type', 'orientation', 'category')
        }),
        ('Dimensions', {
            'fields': ('width_mm', 'height_mm')
        }),
        ('Design', {
            'fields': ('design_json', 'preview_image')
        }),
        ('Settings', {
            'fields': ('is_global', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['make_global', 'make_tenant_specific']
    
    def make_global(self, request, queryset):
        """Make templates global."""
        count = queryset.update(is_global=True, tenant=None)
        self.message_user(request, f'{count} template(s) made global.')
    make_global.short_description = 'Make selected templates global'
    
    def make_tenant_specific(self, request, queryset):
        """Make templates tenant-specific."""
        count = queryset.update(is_global=False)
        self.message_user(request, f'{count} template(s) made tenant-specific.')
    make_tenant_specific.short_description = 'Make selected templates tenant-specific'


@admin.register(IDCardDesign)
class IDCardDesignAdmin(admin.ModelAdmin):
    """Admin interface for ID card designs."""
    
    list_display = [
        'name', 'tenant', 'card_type', 'orientation',
        'is_default', 'is_active'
    ]
    list_filter = ['card_type', 'orientation', 'is_default', 'is_active', 'tenant']
    search_fields = ['name', 'description', 'tenant__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'description', 'card_type', 'orientation')
        }),
        ('Dimensions', {
            'fields': ('width_mm', 'height_mm')
        }),
        ('Design', {
            'fields': ('design_json',)
        }),
        ('Settings', {
            'fields': ('is_active', 'is_default')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(IDCardGeneration)
class IDCardGenerationAdmin(admin.ModelAdmin):
    """Admin interface for ID card generations."""
    
    list_display = [
        'design', 'tenant', 'card_type', 'total_cards',
        'status', 'generated_by', 'created_at'
    ]
    list_filter = ['status', 'card_type', 'tenant', 'created_at']
    search_fields = ['design__name', 'tenant__name']
    readonly_fields = ['created_at', 'updated_at', 'generated_by']
    
    fieldsets = (
        ('Generation Details', {
            'fields': ('tenant', 'design', 'card_type', 'filters', 'total_cards')
        }),
        ('Output', {
            'fields': ('output_file', 'status', 'error_message')
        }),
        ('Metadata', {
            'fields': ('generated_by', 'created_at', 'updated_at')
        }),
    )
    
    def has_add_permission(self, request):
        """Disable manual creation."""
        return False
