"""
ID Cards Models
Handles template design, QR code generation, and bulk ID card generation
"""

import uuid
import hashlib
import json
from datetime import datetime, timedelta
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import BaseModel


class IDCardTemplate(BaseModel):
    """
    ID Card Template with drag-and-drop configuration
    Stores both visual layout and data binding
    """
    ENTITY_TYPE_CHOICES = [
        ('student', 'Student'),
        ('staff', 'Staff'),
    ]
    
    ORIENTATION_CHOICES = [
        ('portrait', 'Portrait'),
        ('landscape', 'Landscape'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='idcard_templates_v2'
    )
    name = models.CharField(max_length=200, help_text=_('Template name'))
    description = models.TextField(blank=True, help_text=_('Template description'))
    entity_type = models.CharField(
        max_length=10,
        choices=ENTITY_TYPE_CHOICES,
        help_text=_('Entity type this template is for')
    )
    orientation = models.CharField(
        max_length=10,
        choices=ORIENTATION_CHOICES,
        default='portrait',
        help_text=_('Card orientation')
    )
    
    # Dimensions in millimeters (CR80 standard: 85.6 x 53.98 mm)
    width = models.FloatField(
        default=54.0,
        validators=[MinValueValidator(50.0), MaxValueValidator(100.0)],
        help_text=_('Card width in mm')
    )
    height = models.FloatField(
        default=86.0,
        validators=[MinValueValidator(50.0), MaxValueValidator(100.0)],
        help_text=_('Card height in mm')
    )
    
    # Template configuration in JSON format
    config = models.JSONField(
        default=dict,
        help_text=_('Template configuration with elements, styling, etc.')
    )
    
    # Background configuration
    background_type = models.CharField(
        max_length=20,
        choices=[
            ('color', 'Solid Color'),
            ('gradient', 'Gradient'),
            ('image', 'Image'),
        ],
        default='color'
    )
    background_value = models.TextField(
        blank=True,
        help_text=_('Background color hex, gradient JSON, or image URL')
    )
    
    # Template management
    is_default = models.BooleanField(
        default=False,
        help_text=_('Default template for this entity type')
    )
    is_system = models.BooleanField(
        default=False,
        help_text=_('System pre-loaded template (cannot be deleted)')
    )
    is_active = models.BooleanField(default=True)
    
    # Version control
    version = models.IntegerField(default=1)
    parent_template = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='template_versions'
    )
    
    class Meta:
        db_table = 'idcard_templates'
        verbose_name = _('ID Card Template')
        verbose_name_plural = _('ID Card Templates')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'entity_type', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_template_per_entity'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'entity_type', 'is_active']),
            models.Index(fields=['is_system', 'entity_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_entity_type_display()} - {self.get_orientation_display()})"
    
    def save(self, *args, **kwargs):
        # Ensure only one default template per tenant and entity type
        if self.is_default:
            IDCardTemplate.objects.filter(
                tenant=self.tenant,
                entity_type=self.entity_type,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class IDCardQRCode(BaseModel):
    """
    QR Code records for ID cards with encrypted payload
    Enables attendance tracking and verification
    """
    ENTITY_TYPE_CHOICES = [
        ('student', 'Student'),
        ('staff', 'Staff'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_qr_codes'
    )
    
    # Entity reference
    entity_type = models.CharField(max_length=10, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.UUIDField(help_text=_('Student or Staff ID'))
    
    # QR Code data
    qr_data = models.TextField(help_text=_('Encrypted JSON payload'))
    qr_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text=_('SHA-256 hash for quick lookup')
    )
    
    # Validity
    issued_date = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField(
        help_text=_('QR code expiry date')
    )
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    last_scanned = models.DateTimeField(null=True, blank=True)
    scan_count = models.IntegerField(default=0)
    
    # Associated ID card
    id_card = models.ForeignKey(
        'IDCardRecord',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='qr_codes'
    )
    
    class Meta:
        db_table = 'idcard_qr_codes'
        verbose_name = _('ID Card QR Code')
        verbose_name_plural = _('ID Card QR Codes')
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['tenant', 'entity_type', 'entity_id']),
            models.Index(fields=['qr_hash']),
            models.Index(fields=['is_active', 'valid_until']),
        ]
    
    def __str__(self):
        return f"QR Code for {self.entity_type} {self.entity_id}"
    
    def is_valid(self):
        """Check if QR code is still valid"""
        return self.is_active and self.valid_until > datetime.now()
    
    def generate_hash(self):
        """Generate SHA-256 hash of QR data"""
        return hashlib.sha256(self.qr_data.encode()).hexdigest()


class IDCardRecord(BaseModel):
    """
    Record of generated ID cards
    Tracks individual and bulk card generation
    """
    ENTITY_TYPE_CHOICES = [
        ('student', 'Student'),
        ('staff', 'Staff'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('replaced', 'Replaced'),
        ('revoked', 'Revoked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_records'
    )
    
    # Entity reference
    entity_type = models.CharField(max_length=10, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.UUIDField(help_text=_('Student or Staff ID'))
    
    # Template used
    template = models.ForeignKey(
        IDCardTemplate,
        on_delete=models.PROTECT,
        related_name='generated_cards'
    )
    
    # Generated file
    file_url = models.URLField(max_length=500, help_text=_('URL to generated PDF/PNG'))
    file_format = models.CharField(
        max_length=10,
        choices=[('pdf', 'PDF'), ('png', 'PNG'), ('jpg', 'JPG')],
        default='pdf'
    )
    
    # Status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    issued_date = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField(help_text=_('Card expiry date'))
    
    # Bulk generation reference
    bulk_job = models.ForeignKey(
        'IDCardGenerationJob',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='job_cards'
    )
    
    # Printing tracking
    printed_count = models.IntegerField(default=0)
    last_printed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'idcard_records'
        verbose_name = _('ID Card Record')
        verbose_name_plural = _('ID Card Records')
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['tenant', 'entity_type', 'entity_id']),
            models.Index(fields=['status', 'valid_until']),
            models.Index(fields=['bulk_job']),
        ]
    
    def __str__(self):
        return f"ID Card for {self.entity_type} {self.entity_id}"


class IDCardGenerationJob(BaseModel):
    """
    Tracks bulk ID card generation jobs
    Handles async background processing with Celery
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    OUTPUT_FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('png', 'PNG'),
        ('jpg', 'JPG'),
    ]
    
    LAYOUT_CHOICES = [
        ('individual', 'Individual Files'),
        ('grid', 'Grid Layout (9 per A4)'),
        ('sheet', 'Print Sheet'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_jobs'
    )
    
    # Job details
    entity_type = models.CharField(max_length=10, choices=[('student', 'Student'), ('staff', 'Staff')])
    filters = models.JSONField(
        default=dict,
        help_text=_('Filters applied (class, section, etc.)')
    )
    template = models.ForeignKey(
        IDCardTemplate,
        on_delete=models.PROTECT,
        related_name='generation_jobs'
    )
    
    # Output configuration
    output_format = models.CharField(
        max_length=10,
        choices=OUTPUT_FORMAT_CHOICES,
        default='pdf'
    )
    layout = models.CharField(
        max_length=20,
        choices=LAYOUT_CHOICES,
        default='individual'
    )
    include_qr = models.BooleanField(default=True)
    
    # Status tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    total_cards = models.IntegerField(default=0)
    completed_cards = models.IntegerField(default=0)
    failed_cards = models.IntegerField(default=0)
    
    # Results
    download_url = models.URLField(max_length=500, null=True, blank=True)
    individual_files = models.JSONField(
        default=list,
        help_text=_('List of individual file URLs')
    )
    
    # Execution info
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    celery_task_id = models.CharField(max_length=255, blank=True)
    
    # Created by
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='id_card_jobs'
    )
    
    class Meta:
        db_table = 'idcard_generation_jobs'
        verbose_name = _('ID Card Generation Job')
        verbose_name_plural = _('ID Card Generation Jobs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['celery_task_id']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Job {self.id} - {self.entity_type} - {self.status}"
    
    def update_progress(self):
        """Calculate and update progress percentage"""
        if self.total_cards > 0:
            self.progress = int((self.completed_cards / self.total_cards) * 100)
            self.save(update_fields=['progress'])


class QRAttendance(BaseModel):
    """
    Attendance records from QR code scanning
    Integrates with existing attendance system
    """
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('late', 'Late'),
        ('early_departure', 'Early Departure'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='qr_attendance_records'
    )
    
    # QR Code reference
    qr_code = models.ForeignKey(
        IDCardQRCode,
        on_delete=models.PROTECT,
        related_name='attendance_records'
    )
    
    # Entity references
    student = models.ForeignKey(
        'students.Student',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='qr_attendance'
    )
    staff = models.ForeignKey(
        'staff.Staff',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='qr_attendance'
    )
    
    # Scan details
    scan_timestamp = models.DateTimeField(db_index=True)
    scan_location = models.CharField(max_length=100, blank=True)
    scan_device = models.CharField(max_length=100, blank=True)
    scan_type = models.CharField(
        max_length=10,
        choices=[('entry', 'Entry'), ('exit', 'Exit')],
        default='entry'
    )
    
    # Attendance status
    attendance_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='present'
    )
    
    # Integration with main attendance system
    linked_attendance = models.ForeignKey(
        'attendance.AttendanceRecord',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='qr_scans'
    )
    
    # Validation
    is_duplicate = models.BooleanField(default=False)
    is_valid_scan = models.BooleanField(default=True)
    validation_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'qr_attendance'
        verbose_name = _('QR Attendance Record')
        verbose_name_plural = _('QR Attendance Records')
        ordering = ['-scan_timestamp']
        indexes = [
            models.Index(fields=['tenant', 'scan_timestamp']),
            models.Index(fields=['student', 'scan_timestamp']),
            models.Index(fields=['staff', 'scan_timestamp']),
            models.Index(fields=['qr_code', '-scan_timestamp']),
        ]
    
    def __str__(self):
        entity = self.student or self.staff
        return f"QR Scan - {entity} at {self.scan_timestamp}"
