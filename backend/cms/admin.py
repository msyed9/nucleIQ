from django.contrib import admin
from .models import (
    Website, Page, Section, Media, MenuItem,
    WebsiteTemplate, TenantWebsiteInstance
)


@admin.register(WebsiteTemplate)
class WebsiteTemplateAdmin(admin.ModelAdmin):
    """Admin for managing website templates"""
    list_display = ['name', 'category', 'is_system', 'is_active', 'version', 'created_at']
    list_filter = ['category', 'is_system', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-is_system', 'name']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'category', 'thumbnail')
        }),
        ('Theme', {
            'fields': ('primary_color', 'secondary_color', 'accent_color', 'font_family')
        }),
        ('Structure', {
            'fields': ('structure',),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_system', 'is_active', 'version', 'tenant', 'uploaded_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TenantWebsiteInstance)
class TenantWebsiteInstanceAdmin(admin.ModelAdmin):
    """Admin for managing tenant website instances"""
    list_display = ['name', 'tenant', 'source_template', 'status', 'is_published', 'visitor_count', 'created_at']
    list_filter = ['status', 'is_published', 'tenant']
    search_fields = ['name', 'subdomain', 'domain']
    readonly_fields = ['visitor_count', 'published_at', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'tenant', 'source_template', 'subdomain', 'domain')
        }),
        ('Theme Overrides', {
            'fields': ('primary_color', 'secondary_color', 'accent_color', 'font_family', 'logo', 'favicon')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords')
        }),
        ('Structure', {
            'fields': ('custom_structure',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'is_published', 'published_at', 'visitor_count')
        }),
        ('Timestamps', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'domain', 'is_published', 'is_active', 'created_at']
    list_filter = ['is_published', 'is_active', 'tenant']
    search_fields = ['name', 'domain']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'website', 'page_type', 'is_homepage', 'is_published', 'menu_order']
    list_filter = ['page_type', 'is_homepage', 'is_published', 'website']
    search_fields = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'page', 'section_type', 'order', 'is_active']
    list_filter = ['section_type', 'is_active', 'page__website']
    search_fields = ['title']
    ordering = ['page', 'order']


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['title', 'media_type', 'file_size', 'uploaded_by', 'created_at']
    list_filter = ['media_type']
    search_fields = ['title', 'alt_text']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['label', 'website', 'parent', 'order', 'is_active']
    list_filter = ['is_active', 'website']
    search_fields = ['label']
    ordering = ['website', 'parent', 'order']
