from django.contrib import admin
from .models import Website, Page, Section, Media, MenuItem


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'domain', 'is_published', 'is_active', 'created_at']
    list_filter = ['is_published', 'is_active', 'created_at']
    search_fields = ['name', 'domain', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'website', 'slug', 'is_homepage', 'is_published', 'menu_order']
    list_filter = ['website', 'is_homepage', 'is_published', 'template']
    search_fields = ['title', 'slug', 'content']
    readonly_fields = ['created_at', 'updated_at']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['page', 'section_type', 'title', 'order', 'is_active']
    list_filter = ['section_type', 'is_active', 'page__website']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['title', 'media_type', 'file_size', 'uploaded_by', 'created_at']
    list_filter = ['media_type', 'created_at']
    search_fields = ['title', 'alt_text', 'caption']
    readonly_fields = ['created_at', 'updated_at', 'file_size', 'mime_type']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['label', 'website', 'page', 'parent', 'order', 'is_active']
    list_filter = ['website', 'is_active']
    search_fields = ['label']
