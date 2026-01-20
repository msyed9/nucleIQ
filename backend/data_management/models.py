"""
Data Migration Models
Store import job history and validation rules
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class ImportJob(BaseModel):
    """
    Track import job history for audit and rollback capability
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VALIDATING', 'Validating'),
        ('PREVIEW', 'Preview Ready'),
        ('IMPORTING', 'Importing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('ROLLED_BACK', 'Rolled Back'),
    ]
    
    MODULE_CHOICES = [
        ('students', 'Students'),
        ('staff', 'Staff'),
        ('classes', 'Classes & Sections'),
        ('subjects', 'Subjects'),
        ('fee_structures', 'Fee Structures'),
        ('fee_allocations', 'Fee Allocations'),
        ('student_enrollments', 'Student Enrollments'),
        ('attendance', 'Attendance Records'),
        ('transport', 'Transport Allocations'),
        ('parents', 'Parent Information'),
        ('student_photos', 'Student Photos'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='import_jobs'
    )
    
    module = models.CharField(
        max_length=50,
        choices=MODULE_CHOICES,
        help_text=_('Module being imported')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    # File info
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10, help_text=_('csv, xlsx, or xls'))
    total_rows = models.IntegerField(default=0)
    
    # Progress tracking
    processed_rows = models.IntegerField(default=0)
    successful_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    duplicate_rows = models.IntegerField(default=0)
    
    # Store created record IDs for rollback
    created_record_ids = models.JSONField(
        default=list,
        help_text=_('IDs of records created during import for rollback')
    )
    
    # Validation and error details
    validation_errors = models.JSONField(
        default=list,
        help_text=_('List of validation errors')
    )
    
    # Preview data
    preview_data = models.JSONField(
        default=list,
        help_text=_('Preview of data to be imported')
    )
    
    # Import options
    skip_duplicates = models.BooleanField(default=True)
    update_existing = models.BooleanField(default=False)
    
    # Initiated by
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='import_jobs'
    )
    
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'import_jobs'
        verbose_name = _('Import Job')
        verbose_name_plural = _('Import Jobs')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.module} import - {self.status} ({self.created_at})"


class ImportFieldMapping(BaseModel):
    """
    Define custom field mappings for import
    Allows tenants to map their column names to system fields
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='import_field_mappings'
    )
    
    module = models.CharField(max_length=50)
    source_column = models.CharField(max_length=100, help_text=_('Column name in CSV/Excel'))
    target_field = models.CharField(max_length=100, help_text=_('System field name'))
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'import_field_mappings'
        verbose_name = _('Import Field Mapping')
        verbose_name_plural = _('Import Field Mappings')
        unique_together = [['tenant', 'module', 'source_column']]
    
    def __str__(self):
        return f"{self.source_column} -> {self.target_field}"
