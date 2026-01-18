from rest_framework import serializers
from .models import (
    Website, Page, Section, Media, MenuItem,
    WebsiteTemplate, TenantWebsiteInstance
)


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = [
            'id', 'page', 'section_type', 'title', 'content', 'config', 
            'order', 'is_active', 'background_color', 'text_color',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PageSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'website', 'title', 'slug', 'page_type', 'content', 
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


# ========================================
# NEW TEMPLATE SYSTEM SERIALIZERS
# ========================================

class WebsiteTemplateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for template gallery"""
    pages_count = serializers.SerializerMethodField()
    is_custom = serializers.SerializerMethodField()
    
    class Meta:
        model = WebsiteTemplate
        fields = [
            'id', 'name', 'description', 'category', 'thumbnail',
            'primary_color', 'secondary_color', 'accent_color', 'font_family',
            'is_system', 'is_custom', 'pages_count', 'version',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_pages_count(self, obj):
        structure = obj.structure or {}
        return len(structure.get('pages', []))
    
    def get_is_custom(self, obj):
        return not obj.is_system


class WebsiteTemplateDetailSerializer(serializers.ModelSerializer):
    """Full serializer with structure for template editing"""
    pages_count = serializers.SerializerMethodField()
    is_custom = serializers.SerializerMethodField()
    
    class Meta:
        model = WebsiteTemplate
        fields = [
            'id', 'name', 'description', 'category', 'thumbnail',
            'primary_color', 'secondary_color', 'accent_color', 'font_family',
            'structure', 'is_system', 'is_custom', 'is_active',
            'pages_count', 'version', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_system']
    
    def get_pages_count(self, obj):
        structure = obj.structure or {}
        return len(structure.get('pages', []))
    
    def get_is_custom(self, obj):
        return not obj.is_system


class WebsiteTemplateUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading custom templates"""
    
    class Meta:
        model = WebsiteTemplate
        fields = [
            'name', 'description', 'category', 'thumbnail',
            'primary_color', 'secondary_color', 'accent_color', 'font_family',
            'structure'
        ]
    
    def validate_structure(self, value):
        """Validate the template structure format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Structure must be a JSON object")
        
        if 'pages' not in value:
            raise serializers.ValidationError("Structure must contain 'pages' array")
        
        if not isinstance(value['pages'], list):
            raise serializers.ValidationError("'pages' must be an array")
        
        # Validate each page has required fields
        for idx, page in enumerate(value['pages']):
            if not isinstance(page, dict):
                raise serializers.ValidationError(f"Page {idx} must be an object")
            if 'title' not in page:
                raise serializers.ValidationError(f"Page {idx} missing 'title'")
            if 'slug' not in page:
                raise serializers.ValidationError(f"Page {idx} missing 'slug'")
            if 'sections' not in page:
                raise serializers.ValidationError(f"Page {idx} missing 'sections' array")
        
        return value


class TenantWebsiteInstanceSerializer(serializers.ModelSerializer):
    """Full serializer for tenant website instances"""
    source_template_name = serializers.CharField(source='source_template.name', read_only=True)
    effective_structure = serializers.SerializerMethodField()
    effective_theme = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantWebsiteInstance
        fields = [
            'id', 'name', 'source_template', 'source_template_name',
            'domain', 'subdomain',
            'primary_color', 'secondary_color', 'accent_color', 'font_family',
            'logo', 'favicon',
            'custom_structure', 'effective_structure', 'effective_theme',
            'meta_title', 'meta_description', 'meta_keywords',
            'status', 'is_published', 'published_at', 'visitor_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'visitor_count', 'published_at']
    
    def get_effective_structure(self, obj):
        return obj.get_effective_structure()
    
    def get_effective_theme(self, obj):
        return obj.get_effective_theme()


class TenantWebsiteInstanceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing instances"""
    source_template_name = serializers.CharField(source='source_template.name', read_only=True)
    pages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantWebsiteInstance
        fields = [
            'id', 'name', 'source_template', 'source_template_name',
            'domain', 'subdomain', 'status', 'is_published',
            'pages_count', 'visitor_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'visitor_count']
    
    def get_pages_count(self, obj):
        structure = obj.get_effective_structure()
        return len(structure.get('pages', []))


class ForkTemplateSerializer(serializers.Serializer):
    """Serializer for forking a template to create an instance"""
    template_id = serializers.IntegerField()
    name = serializers.CharField(max_length=200, required=False)
    subdomain = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_template_id(self, value):
        try:
            template = WebsiteTemplate.objects.get(id=value, is_active=True)
            return value
        except WebsiteTemplate.DoesNotExist:
            raise serializers.ValidationError("Template not found or inactive")


class UpdateSectionSerializer(serializers.Serializer):
    """Serializer for updating a section in an instance"""
    page_index = serializers.IntegerField(min_value=0)
    section_index = serializers.IntegerField(min_value=0)
    updates = serializers.DictField()
    
    def validate_updates(self, value):
        allowed_fields = [
            'title', 'content', 'background_color', 'text_color',
            'is_visible', 'config', 'order'
        ]
        for key in value.keys():
            if key not in allowed_fields:
                raise serializers.ValidationError(f"Field '{key}' is not allowed for section updates")
        return value


class ReorderSectionsSerializer(serializers.Serializer):
    """Serializer for reordering sections within a page"""
    page_index = serializers.IntegerField(min_value=0)
    section_order = serializers.ListField(child=serializers.IntegerField())


class AddPageSerializer(serializers.Serializer):
    """Serializer for adding a new page to an instance"""
    title = serializers.CharField(max_length=200)
    slug = serializers.SlugField(max_length=200)
    page_type = serializers.ChoiceField(choices=[
        'HOME', 'ABOUT', 'ACADEMICS', 'ADMISSIONS', 
        'CONTACT', 'GALLERY', 'EVENTS', 'CUSTOM'
    ], default='CUSTOM')
    sections = serializers.ListField(child=serializers.DictField(), required=False, default=list)


class AddSectionSerializer(serializers.Serializer):
    """Serializer for adding a new section to a page"""
    page_index = serializers.IntegerField(min_value=0)
    section_type = serializers.CharField(max_length=30)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    content = serializers.DictField(required=False, default=dict)
    background_color = serializers.CharField(max_length=20, required=False, allow_blank=True)
    text_color = serializers.CharField(max_length=20, required=False, allow_blank=True)
    order = serializers.IntegerField(required=False)
