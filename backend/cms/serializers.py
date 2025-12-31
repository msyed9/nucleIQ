"""
CMS Serializers
"""

from rest_framework import serializers
from .models import Theme, Website, Page, Section, Asset, Navigation


class ThemeSerializer(serializers.ModelSerializer):
    """Serializer for Theme."""
    
    class Meta:
        model = Theme
        fields = [
            'id', 'name', 'category', 'description', 'preview_image',
            'config', 'default_sections', 'is_active', 'is_premium',
            'usage_count', 'created_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at']


class WebsiteSerializer(serializers.ModelSerializer):
    """Serializer for Website."""
    
    theme_name = serializers.CharField(source='theme.name', read_only=True)
    page_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Website
        fields = [
            'id', 'subdomain', 'custom_domain', 'custom_domain_verified',
            'theme', 'theme_name', 'site_title', 'site_tagline',
            'meta_description', 'meta_keywords',
            'facebook_url', 'twitter_url', 'instagram_url',
            'linkedin_url', 'youtube_url',
            'contact_email', 'contact_phone', 'address',
            'map_latitude', 'map_longitude',
            'is_published', 'published_at', 'google_analytics_id',
            'page_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'custom_domain_verified', 'published_at', 'created_at', 'updated_at']
    
    def get_page_count(self, obj):
        return obj.pages.filter(is_deleted=False).count()


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section."""
    
    class Meta:
        model = Section
        fields = [
            'id', 'page', 'component_type', 'title', 'content',
            'background_color', 'text_color', 'padding', 'custom_css',
            'order', 'is_visible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PageSerializer(serializers.ModelSerializer):
    """Serializer for Page."""
    
    sections = SectionSerializer(many=True, read_only=True)
    section_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Page
        fields = [
            'id', 'website', 'page_type', 'title', 'slug',
            'meta_title', 'meta_description', 'order',
            'is_published', 'show_in_menu',
            'sections', 'section_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_section_count(self, obj):
        return obj.sections.filter(is_deleted=False).count()


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset."""
    
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'website', 'asset_type', 'title', 'file', 'file_url',
            'alt_text', 'caption', 'file_size', 'mime_type',
            'usage_count', 'created_at'
        ]
        read_only_fields = ['id', 'file_size', 'mime_type', 'usage_count', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class NavigationSerializer(serializers.ModelSerializer):
    """Serializer for Navigation."""
    
    children = serializers.SerializerMethodField()
    page_title = serializers.CharField(source='page.title', read_only=True)
    
    class Meta:
        model = Navigation
        fields = [
            'id', 'website', 'label', 'page', 'page_title',
            'external_url', 'parent', 'order', 'is_visible',
            'children', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_children(self, obj):
        if obj.children.exists():
            return NavigationSerializer(
                obj.children.filter(is_deleted=False, is_visible=True),
                many=True,
                context=self.context
            ).data
        return []


class PageDetailSerializer(serializers.Serializer):
    """Serializer for public page rendering."""
    
    page = PageSerializer()
    website = WebsiteSerializer()
    navigation = NavigationSerializer(many=True)
