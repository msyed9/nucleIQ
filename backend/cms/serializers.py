from rest_framework import serializers
from .models import Website, Page, Section, Media, MenuItem


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'section_type', 'title', 'content', 'config', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PageSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'website', 'title', 'slug', 'content', 
            'meta_title', 'meta_description', 'meta_keywords',
            'is_homepage', 'is_published', 'show_in_menu', 'menu_order',
            'template', 'sections', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MenuItemSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'label', 'page', 'external_url', 'parent', 
            'order', 'is_active', 'open_in_new_tab', 'children'
        ]
    
    def get_children(self, obj):
        if obj.children.exists():
            return MenuItemSerializer(obj.children.filter(is_active=True), many=True).data
        return []


class WebsiteSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)
    menu_items = MenuItemSerializer(many=True, read_only=True)
    pages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Website
        fields = [
            'id', 'name', 'domain', 'description', 'logo', 'favicon',
            'primary_color', 'secondary_color', 'font_family',
            'meta_title', 'meta_description', 'meta_keywords',
            'is_published', 'is_active', 'pages', 'menu_items',
            'pages_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_pages_count(self, obj):
        return obj.pages.count()


class WebsiteListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list view"""
    pages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Website
        fields = [
            'id', 'name', 'domain', 'description', 
            'is_published', 'is_active', 'pages_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_pages_count(self, obj):
        return obj.pages.count()


class MediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = [
            'id', 'title', 'file', 'file_url', 'media_type', 
            'alt_text', 'caption', 'file_size', 'mime_type',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'file_size', 'mime_type']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
