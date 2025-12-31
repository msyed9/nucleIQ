"""
CMS Admin Configuration
"""

from django.contrib import admin
from .models import Theme, Website, Page, Section, Asset, Navigation


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'is_premium', 'usage_count']
    list_filter = ['category', 'is_active', 'is_premium']
    search_fields = ['name', 'description']
    ordering = ['category', 'name']


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ['site_title', 'subdomain', 'custom_domain', 'theme', 'is_published', 'published_at']
    list_filter = ['is_published', 'custom_domain_verified']
    search_fields = ['site_title', 'subdomain', 'custom_domain']
    readonly_fields = ['published_at']
    raw_id_fields = ['theme']


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'website', 'page_type', 'slug', 'order', 'is_published', 'show_in_menu']
    list_filter = ['page_type', 'is_published', 'show_in_menu']
    search_fields = ['title', 'slug']
    ordering = ['website', 'order']
    raw_id_fields = ['website']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'page', 'component_type', 'order', 'is_visible']
    list_filter = ['component_type', 'is_visible']
    search_fields = ['title']
    ordering = ['page', 'order']
    raw_id_fields = ['page']


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['title', 'website', 'asset_type', 'file_size', 'usage_count', 'created_at']
    list_filter = ['asset_type']
    search_fields = ['title', 'alt_text']
    ordering = ['-created_at']
    raw_id_fields = ['website']


@admin.register(Navigation)
class NavigationAdmin(admin.ModelAdmin):
    list_display = ['label', 'website', 'page', 'parent', 'order', 'is_visible']
    list_filter = ['is_visible']
    search_fields = ['label']
    ordering = ['website', 'order']
    raw_id_fields = ['website', 'page', 'parent']
