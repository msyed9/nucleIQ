from django.db import models
from django.contrib.auth import get_user_model
from core.models import TenantAwareModel
import json

User = get_user_model()


class WebsiteTemplate(models.Model):
    """
    System-level website templates that can be forked by tenants.
    Stored centrally (not tenant-specific) for reuse across all tenants.
    """
    CATEGORY_CHOICES = [
        ('modern', 'Modern'),
        ('classic', 'Classic'),
        ('minimal', 'Minimal'),
        ('vibrant', 'Vibrant'),
        ('professional', 'Professional'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='modern')
    thumbnail = models.TextField(blank=True, help_text="CSS gradient or image URL")
    
    # Theme settings
    primary_color = models.CharField(max_length=20, default='#2563eb')
    secondary_color = models.CharField(max_length=20, default='#1e40af')
    accent_color = models.CharField(max_length=20, default='#60a5fa')
    font_family = models.CharField(max_length=100, default='Inter, sans-serif')
    
    # Template structure (JSON containing pages & sections)
    structure = models.JSONField(default=dict, help_text="JSON structure with pages and sections")
    
    # Metadata
    is_system = models.BooleanField(default=True, help_text="System templates cannot be modified")
    is_active = models.BooleanField(default=True)
    version = models.CharField(max_length=20, default='1.0')
    
    # For user-uploaded templates
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='uploaded_templates'
    )
    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, null=True, blank=True,
        related_name='custom_templates', help_text="Null for system templates"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cms_website_templates'
        ordering = ['-is_system', 'name']
    
    def __str__(self):
        prefix = "[System]" if self.is_system else "[Custom]"
        return f"{prefix} {self.name}"
    
    def get_pages(self):
        """Returns the pages from the structure"""
        return self.structure.get('pages', [])
    
    def clone_for_tenant(self, tenant, user):
        """Creates a copy of this template for a tenant to customize"""
        new_template = WebsiteTemplate.objects.create(
            name=f"{self.name} (Copy)",
            description=self.description,
            category=self.category,
            thumbnail=self.thumbnail,
            primary_color=self.primary_color,
            secondary_color=self.secondary_color,
            accent_color=self.accent_color,
            font_family=self.font_family,
            structure=self.structure,
            is_system=False,
            tenant=tenant,
            uploaded_by=user,
            version=self.version
        )
        return new_template


class TenantWebsiteInstance(TenantAwareModel):
    """
    A tenant's customized instance of a website template.
    This is the actual website with tenant-specific modifications.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    name = models.CharField(max_length=200, default='My School Website')
    source_template = models.ForeignKey(
        WebsiteTemplate, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='instances', help_text="Original template this was forked from"
    )
    
    # Website settings
    domain = models.CharField(max_length=255, blank=True)
    subdomain = models.CharField(max_length=100, blank=True)
    
    # Theme overrides
    primary_color = models.CharField(max_length=20, blank=True)
    secondary_color = models.CharField(max_length=20, blank=True)
    accent_color = models.CharField(max_length=20, blank=True)
    font_family = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to='cms/logos/', blank=True, null=True)
    favicon = models.ImageField(upload_to='cms/favicons/', blank=True, null=True)
    
    # Custom structure (tenant's modifications)
    custom_structure = models.JSONField(default=dict, help_text="Tenant's customized pages & sections")
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Analytics
    visitor_count = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='website_instances')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cms_tenant_website_instances'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name if self.tenant else 'No Tenant'})"
    
    def get_effective_structure(self):
        """
        Returns the effective structure by merging template defaults with custom structure
        """
        if self.source_template and not self.custom_structure:
            return self.source_template.structure
        return self.custom_structure or {}
    
    def get_effective_theme(self):
        """Returns theme with fallbacks to source template"""
        theme = {
            'primary_color': self.primary_color or (self.source_template.primary_color if self.source_template else '#2563eb'),
            'secondary_color': self.secondary_color or (self.source_template.secondary_color if self.source_template else '#1e40af'),
            'accent_color': self.accent_color or (self.source_template.accent_color if self.source_template else '#60a5fa'),
            'font_family': self.font_family or (self.source_template.font_family if self.source_template else 'Inter, sans-serif'),
        }
        return theme


class Website(TenantAwareModel):
    """Main website configuration (kept for backward compatibility)"""
    name = models.CharField(max_length=200, default='Default Website')
    domain = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='cms/logos/', blank=True, null=True)
    favicon = models.ImageField(upload_to='cms/favicons/', blank=True, null=True)
    
    # Link to new template system
    template_instance = models.ForeignKey(
        TenantWebsiteInstance, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='legacy_websites'
    )
    
    # Theme settings
    primary_color = models.CharField(max_length=7, default='#1976D2')
    secondary_color = models.CharField(max_length=7, default='#424242')
    font_family = models.CharField(max_length=100, default='Inter, sans-serif')
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    # Status
    is_published = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='websites_created')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cms_websites'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Page(TenantAwareModel):
    """Website pages"""
    PAGE_TYPES = [
        ('HOME', 'Home'),
        ('ABOUT', 'About'),
        ('ACADEMICS', 'Academics'),
        ('ADMISSIONS', 'Admissions'),
        ('CONTACT', 'Contact'),
        ('GALLERY', 'Gallery'),
        ('EVENTS', 'Events'),
        ('CUSTOM', 'Custom'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='pages')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    page_type = models.CharField(max_length=20, choices=PAGE_TYPES, default='CUSTOM')
    
    # Content (Can be empty if using sections)
    content = models.TextField(blank=True)
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    # Settings
    is_homepage = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    show_in_menu = models.BooleanField(default=True)
    menu_order = models.IntegerField(default=0)
    
    # Template
    template = models.CharField(max_length=100, default='default')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pages_created')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cms_pages'
        ordering = ['menu_order', 'title']
        unique_together = [['website', 'slug']]
    
    def __str__(self):
        return f"{self.website.name} - {self.title}"


class Section(TenantAwareModel):
    """Page sections/blocks"""
    SECTION_TYPES = [
        ('HERO', 'Hero Section'),
        ('FEATURES', 'Features'),
        ('ABOUT', 'About'),
        ('GALLERY', 'Gallery'),
        ('TESTIMONIALS', 'Testimonials'),
        ('CONTACT', 'Contact Form'),
        ('CTA', 'Call to Action'),
        ('TEXT', 'Text Block'),
        ('TEXT_BLOCK', 'Rich Text Block'),
        ('HTML', 'Custom HTML'),
        ('STATS', 'Statistics'),
        ('PRINCIPAL_MESSAGE', 'Principal Message'),
        ('PAGE_HEADER', 'Page Header'),
        ('TEXT_WITH_IMAGE', 'Text with Image'),
        ('MISSION_VISION', 'Mission & Vision'),
        ('IMAGE_GRID', 'Image Grid'),
        ('TIMELINE', 'Timeline'),
        ('PROGRAMS', 'Programs'),
        ('MAP', 'Map'),
        ('FAQ', 'FAQ'),
        ('NEWS', 'News Feed'),
        ('EVENTS', 'Events Display'),
        ('FACULTY', 'Faculty Grid'),
        ('VIDEO', 'Video Section'),
    ]
    
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=30, choices=SECTION_TYPES, default='TEXT')
    title = models.CharField(max_length=200, blank=True)
    
    # Content can store JSON for structured sections
    content = models.JSONField(default=dict, blank=True)
    
    # Configuration (extra styles, etc)
    config = models.JSONField(default=dict, blank=True)
    
    # Styles
    background_color = models.CharField(max_length=20, blank=True, null=True)
    text_color = models.CharField(max_length=20, blank=True, null=True)
    
    # Ordering
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cms_sections'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.page.title} - {self.get_section_type_display()}"


class Media(TenantAwareModel):
    """Media library for CMS"""
    MEDIA_TYPES = [
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
        ('DOCUMENT', 'Document'),
    ]
    
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='cms/media/')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    alt_text = models.CharField(max_length=200, blank=True)
    caption = models.TextField(blank=True)
    
    # Metadata
    file_size = models.IntegerField(default=0)  # in bytes
    mime_type = models.CharField(max_length=100, blank=True)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='cms_media')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cms_media'
        ordering = ['-created_at']
        verbose_name_plural = 'Media'
    
    def __str__(self):
        return self.title


class MenuItem(TenantAwareModel):
    """Navigation menu items"""
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='menu_items')
    label = models.CharField(max_length=100)
    
    # Link
    page = models.ForeignKey(Page, on_delete=models.CASCADE, null=True, blank=True, related_name='menu_items')
    external_url = models.URLField(blank=True)
    
    # Hierarchy
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    order = models.IntegerField(default=0)
    
    # Settings
    is_active = models.BooleanField(default=True)
    open_in_new_tab = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'cms_menu_items'
        ordering = ['order']
    
    def __str__(self):
        return self.label
