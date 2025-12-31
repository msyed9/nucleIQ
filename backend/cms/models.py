"""
CMS Models - Website Builder, Pages, Sections, Themes
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel


class Theme(TenantAwareModel):
    """
    Website theme/template
    """
    
    CATEGORY_CHOICES = [
        ('MODERN', 'Modern'),
        ('TRADITIONAL', 'Traditional'),
        ('IVY_LEAGUE', 'Ivy League'),
        ('PLAYFUL', 'Playful (Kindergarten)'),
        ('MINIMALIST', 'Minimalist'),
        ('CORPORATE', 'Corporate'),
    ]
    
    name = models.CharField(
        max_length=200,
        help_text=_('Theme name')
    )
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        help_text=_('Theme category')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Theme description')
    )
    
    # Preview
    preview_image = models.ImageField(
        upload_to='cms/themes/previews/',
        null=True,
        blank=True,
        help_text=_('Theme preview image')
    )
    
    # Configuration (Tailwind-based JSON)
    config = models.JSONField(
        default=dict,
        help_text=_('Theme configuration (colors, fonts, spacing, etc.)')
    )
    
    # Default sections for this theme
    default_sections = models.JSONField(
        default=list,
        help_text=_('Default sections configuration')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether theme is active')
    )
    
    is_premium = models.BooleanField(
        default=False,
        help_text=_('Whether theme is premium')
    )
    
    # Usage statistics
    usage_count = models.IntegerField(
        default=0,
        help_text=_('Number of times theme is used')
    )
    
    class Meta:
        db_table = 'cms_themes'
        verbose_name = _('Theme')
        verbose_name_plural = _('Themes')
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class Website(TenantAwareModel):
    """
    School website configuration
    """
    
    # Domain settings
    subdomain = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Subdomain (e.g., myschool for myschool.platform.com)')
    )
    
    custom_domain = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Custom domain (e.g., www.myschool.com)')
    )
    
    custom_domain_verified = models.BooleanField(
        default=False,
        help_text=_('Whether custom domain is verified')
    )
    
    # Theme
    theme = models.ForeignKey(
        Theme,
        on_delete=models.SET_NULL,
        null=True,
        related_name='websites',
        help_text=_('Active theme')
    )
    
    # SEO
    site_title = models.CharField(
        max_length=200,
        help_text=_('Website title')
    )
    
    site_tagline = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Website tagline')
    )
    
    meta_description = models.TextField(
        blank=True,
        help_text=_('Meta description for SEO')
    )
    
    meta_keywords = models.TextField(
        blank=True,
        help_text=_('Meta keywords for SEO')
    )
    
    # Social media
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    
    # Contact
    contact_email = models.EmailField(
        blank=True,
        help_text=_('Contact email')
    )
    
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Contact phone')
    )
    
    address = models.TextField(
        blank=True,
        help_text=_('School address')
    )
    
    # Map
    map_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text=_('Map latitude')
    )
    
    map_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text=_('Map longitude')
    )
    
    # Publishing
    is_published = models.BooleanField(
        default=False,
        help_text=_('Whether website is published')
    )
    
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When website was published')
    )
    
    # Analytics
    google_analytics_id = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Google Analytics tracking ID')
    )
    
    class Meta:
        db_table = 'cms_websites'
        verbose_name = _('Website')
        verbose_name_plural = _('Websites')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.site_title} ({self.subdomain})"
    
    def publish(self):
        """Publish the website."""
        self.is_published = True
        self.published_at = timezone.now()
        self.save()


class Page(TenantAwareModel):
    """
    Website page
    """
    
    PAGE_TYPE_CHOICES = [
        ('HOME', 'Home'),
        ('ABOUT', 'About Us'),
        ('ADMISSIONS', 'Admissions'),
        ('GALLERY', 'Gallery'),
        ('CONTACT', 'Contact'),
        ('NEWS', 'News'),
        ('CUSTOM', 'Custom Page'),
    ]
    
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name='pages',
        help_text=_('Website')
    )
    
    page_type = models.CharField(
        max_length=50,
        choices=PAGE_TYPE_CHOICES,
        help_text=_('Page type')
    )
    
    title = models.CharField(
        max_length=200,
        help_text=_('Page title')
    )
    
    slug = models.SlugField(
        max_length=200,
        help_text=_('URL slug')
    )
    
    # SEO
    meta_title = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Meta title for SEO')
    )
    
    meta_description = models.TextField(
        blank=True,
        help_text=_('Meta description for SEO')
    )
    
    # Order
    order = models.IntegerField(
        default=0,
        help_text=_('Display order')
    )
    
    # Visibility
    is_published = models.BooleanField(
        default=True,
        help_text=_('Whether page is published')
    )
    
    show_in_menu = models.BooleanField(
        default=True,
        help_text=_('Whether to show in navigation menu')
    )
    
    class Meta:
        db_table = 'cms_pages'
        verbose_name = _('Page')
        verbose_name_plural = _('Pages')
        ordering = ['website', 'order']
        unique_together = [['website', 'slug']]
        indexes = [
            models.Index(fields=['website', 'is_published']),
        ]
    
    def __str__(self):
        return f"{self.website.site_title} - {self.title}"


class Section(TenantAwareModel):
    """
    Page section/component
    """
    
    COMPONENT_TYPE_CHOICES = [
        ('HERO', 'Hero Slider'),
        ('ABOUT', 'About Section'),
        ('PRINCIPAL_MESSAGE', "Principal's Message"),
        ('FACULTY', 'Faculty Grid'),
        ('TESTIMONIALS', 'Testimonials'),
        ('GALLERY', 'Gallery'),
        ('NEWS', 'News/Events'),
        ('CONTACT', 'Contact Form'),
        ('MAP', 'Map'),
        ('STATS', 'Statistics'),
        ('FEATURES', 'Features'),
        ('CTA', 'Call to Action'),
        ('TEXT', 'Text Block'),
        ('IMAGE', 'Image Block'),
        ('VIDEO', 'Video'),
        ('CUSTOM', 'Custom HTML'),
    ]
    
    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name='sections',
        help_text=_('Page')
    )
    
    component_type = models.CharField(
        max_length=50,
        choices=COMPONENT_TYPE_CHOICES,
        help_text=_('Component type')
    )
    
    title = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Section title')
    )
    
    # Content (JSON configuration)
    content = models.JSONField(
        default=dict,
        help_text=_('Section content and configuration')
    )
    
    # Styling
    background_color = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Background color (hex or Tailwind class)')
    )
    
    text_color = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Text color (hex or Tailwind class)')
    )
    
    padding = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Padding (Tailwind class)')
    )
    
    custom_css = models.TextField(
        blank=True,
        help_text=_('Custom CSS')
    )
    
    # Order
    order = models.IntegerField(
        default=0,
        help_text=_('Display order')
    )
    
    # Visibility
    is_visible = models.BooleanField(
        default=True,
        help_text=_('Whether section is visible')
    )
    
    class Meta:
        db_table = 'cms_sections'
        verbose_name = _('Section')
        verbose_name_plural = _('Sections')
        ordering = ['page', 'order']
        indexes = [
            models.Index(fields=['page', 'order']),
        ]
    
    def __str__(self):
        return f"{self.page.title} - {self.get_component_type_display()}"


class Asset(TenantAwareModel):
    """
    Media assets (images, videos, documents)
    """
    
    ASSET_TYPE_CHOICES = [
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
        ('DOCUMENT', 'Document'),
        ('OTHER', 'Other'),
    ]
    
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name='assets',
        help_text=_('Website')
    )
    
    asset_type = models.CharField(
        max_length=50,
        choices=ASSET_TYPE_CHOICES,
        help_text=_('Asset type')
    )
    
    title = models.CharField(
        max_length=200,
        help_text=_('Asset title')
    )
    
    file = models.FileField(
        upload_to='cms/assets/%Y/%m/',
        help_text=_('Asset file')
    )
    
    # Metadata
    alt_text = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Alt text for images')
    )
    
    caption = models.TextField(
        blank=True,
        help_text=_('Caption')
    )
    
    # File info
    file_size = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('File size in bytes')
    )
    
    mime_type = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('MIME type')
    )
    
    # Usage tracking
    usage_count = models.IntegerField(
        default=0,
        help_text=_('Number of times asset is used')
    )
    
    class Meta:
        db_table = 'cms_assets'
        verbose_name = _('Asset')
        verbose_name_plural = _('Assets')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['website', 'asset_type']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_asset_type_display()})"


class Navigation(TenantAwareModel):
    """
    Navigation menu configuration
    """
    
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name='navigations',
        help_text=_('Website')
    )
    
    label = models.CharField(
        max_length=100,
        help_text=_('Menu item label')
    )
    
    # Link
    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='nav_items',
        help_text=_('Linked page')
    )
    
    external_url = models.URLField(
        blank=True,
        help_text=_('External URL (if not linking to page)')
    )
    
    # Parent (for dropdown menus)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        help_text=_('Parent menu item')
    )
    
    # Order
    order = models.IntegerField(
        default=0,
        help_text=_('Display order')
    )
    
    # Visibility
    is_visible = models.BooleanField(
        default=True,
        help_text=_('Whether menu item is visible')
    )
    
    class Meta:
        db_table = 'cms_navigation'
        verbose_name = _('Navigation Item')
        verbose_name_plural = _('Navigation Items')
        ordering = ['website', 'order']
    
    def __str__(self):
        return f"{self.website.site_title} - {self.label}"
