from django.db import models
from django.contrib.auth import get_user_model
from core.models import TenantAwareModel

User = get_user_model()


class Website(TenantAwareModel):
    """Main website configuration"""
    name = models.CharField(max_length=200, default='Default Website')
    domain = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='cms/logos/', blank=True, null=True)
    favicon = models.ImageField(upload_to='cms/favicons/', blank=True, null=True)
    
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
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='pages')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    
    # Content
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
        ('HTML', 'Custom HTML'),
    ]
    
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES, default='TEXT')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    
    # Configuration (JSON field for flexibility)
    config = models.JSONField(default=dict, blank=True)
    
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
