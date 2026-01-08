"""
ID Card Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class IDCardTemplate(BaseModel):
    """
    ID Card Template with JSON-based design.
    Pre-built templates available to all tenants.
    """
    
    CARD_TYPES = [
        ('STUDENT', 'Student'),
        ('STAFF', 'Staff'),
        ('VISITOR', 'Visitor'),
    ]
    
    ORIENTATIONS = [
        ('HORIZONTAL', 'Horizontal'),
        ('VERTICAL', 'Vertical'),
    ]
    
    CATEGORIES = [
        ('ACADEMIC', 'Academic'),
        ('CORPORATE', 'Corporate'),
        ('PLAYFUL', 'Playful'),
        ('MINIMALIST', 'Minimalist'),
        ('MODERN', 'Modern'),
        ('CLASSIC', 'Classic'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_templates',
        null=True,
        blank=True,
        help_text="Tenant (null for global templates)"
    )
    
    name = models.CharField(
        max_length=200,
        help_text="Template name"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Template description"
    )
    
    card_type = models.CharField(
        max_length=20,
        choices=CARD_TYPES,
        help_text="Type of ID card"
    )
    
    orientation = models.CharField(
        max_length=20,
        choices=ORIENTATIONS,
        default='VERTICAL'
    )
    
    category = models.CharField(
        max_length=20,
        choices=CATEGORIES,
        default='ACADEMIC'
    )
    
    # Dimensions in mm (Credit Card CR80: 85.6 x 53.98 mm)
    width_mm = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=85.6,
        help_text="Card width in mm"
    )
    
    height_mm = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=53.98,
        help_text="Card height in mm"
    )
    
    # JSON design
    design_json = models.JSONField(
        default=dict,
        help_text="JSON design configuration"
    )
    
    # Preview
    preview_image = models.ImageField(
        upload_to='idcard_templates/',
        blank=True,
        null=True,
        help_text="Preview image"
    )
    
    is_global = models.BooleanField(
        default=False,
        help_text="Available to all tenants"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'id_card_templates'
        verbose_name = 'ID Card Template'
        verbose_name_plural = 'ID Card Templates'
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_card_type_display()})"


class IDCardDesign(BaseModel):
    """
    Custom ID Card Design created by tenant.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_designs'
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    card_type = models.CharField(
        max_length=20,
        choices=IDCardTemplate.CARD_TYPES
    )
    
    orientation = models.CharField(
        max_length=20,
        choices=IDCardTemplate.ORIENTATIONS,
        default='VERTICAL'
    )
    
    width_mm = models.DecimalField(max_digits=6, decimal_places=2, default=85.6)
    height_mm = models.DecimalField(max_digits=6, decimal_places=2, default=53.98)
    
    design_json = models.JSONField(default=dict)
    
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'id_card_designs'
        verbose_name = 'ID Card Design'
        verbose_name_plural = 'ID Card Designs'
        ordering = ['-is_default', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class IDCardGeneration(BaseModel):
    """
    Track ID card generation requests.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_generations'
    )
    
    design = models.ForeignKey(
        IDCardDesign,
        on_delete=models.CASCADE,
        related_name='generations'
    )
    
    card_type = models.CharField(max_length=20)
    
    # Filters used
    filters = models.JSONField(
        default=dict,
        help_text="Filters applied (e.g., {'grade': 'Class 5'})"
    )
    
    total_cards = models.IntegerField(default=0)
    
    # Output
    output_file = models.FileField(
        upload_to='idcard_outputs/',
        blank=True,
        null=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('PROCESSING', 'Processing'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
        ],
        default='PENDING'
    )
    
    error_message = models.TextField(blank=True)
    
    generated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    class Meta:
        db_table = 'id_card_generations'
        verbose_name = 'ID Card Generation'
        verbose_name_plural = 'ID Card Generations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.design.name} - {self.total_cards} cards"
