"""
Enhanced Data Migration Models for 10-Year School Data Migration
Implements the comprehensive migration architecture with:
- Data scope classification (Global, AcademicYear, Term)
- Crosswalk tables for idempotent migrations
- Phase-based migration tracking
- Reconciliation and audit capabilities
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import BaseModel
import uuid


class DataScope(models.TextChoices):
    """
    Classification of data scope for migration purposes.
    Determines how data is associated with the tenant vs academic year.
    """
    GLOBAL = 'GLOBAL', _('Global/Evergreen')  # Tenant-level, not tied to AcademicYear
    ACADEMIC_YEAR = 'ACADEMIC_YEAR', _('Academic Year Scoped')  # Changes each year
    TERM = 'TERM', _('Term/Semester Scoped')  # Subdivision of academic year
    TIMESTAMPED = 'TIMESTAMPED', _('Time-Stamped')  # Date-based, computed year mapping


class MigrationPhase(models.TextChoices):
    """
    Migration phases for 10-year data migration.
    Strict order must be followed for data integrity.
    """
    PREFLIGHT = 'PREFLIGHT', _('Phase 0: Preflight & Discovery')
    STAGING = 'STAGING', _('Phase 1: Staging & Crosswalk')
    REFERENCE = 'REFERENCE', _('Phase 2: Reference & Evergreen')
    ACADEMIC_CORE = 'ACADEMIC_CORE', _('Phase 3: Academic Year Core')
    TRANSACTIONAL = 'TRANSACTIONAL', _('Phase 4: Year-Scoped Transactional')
    RECONCILIATION = 'RECONCILIATION', _('Phase 5: Reconciliation & Validation')


class EntityType(models.TextChoices):
    """
    Entity types for migration classification.
    Maps to the data scope model.
    """
    # Global / Evergreen Entities
    TENANT = 'TENANT', _('Tenant')
    CAMPUS = 'CAMPUS', _('Campus')
    DEPARTMENT = 'DEPARTMENT', _('Department')
    GRADE_LEVEL = 'GRADE_LEVEL', _('Grade Level')
    SUBJECT = 'SUBJECT', _('Subject')
    FEE_CATEGORY = 'FEE_CATEGORY', _('Fee Category')
    TRANSPORT_ROUTE = 'TRANSPORT_ROUTE', _('Transport Route')
    TRANSPORT_STOP = 'TRANSPORT_STOP', _('Transport Stop')
    EXAM_TYPE = 'EXAM_TYPE', _('Exam Type')
    STUDENT = 'STUDENT', _('Student Identity')
    GUARDIAN = 'GUARDIAN', _('Guardian/Parent')
    STAFF = 'STAFF', _('Staff Identity')
    USER = 'USER', _('User Account')
    
    # Academic Year Scoped Entities
    ACADEMIC_YEAR = 'ACADEMIC_YEAR', _('Academic Year')
    ACADEMIC_TERM = 'ACADEMIC_TERM', _('Academic Term')
    SECTION = 'SECTION', _('Section Instance')
    ENROLLMENT = 'ENROLLMENT', _('Student Enrollment')
    STAFF_ASSIGNMENT = 'STAFF_ASSIGNMENT', _('Staff Assignment')
    TIMETABLE = 'TIMETABLE', _('Timetable')
    ATTENDANCE = 'ATTENDANCE', _('Attendance Record')
    EXAM_SCHEDULE = 'EXAM_SCHEDULE', _('Exam Schedule')
    MARKS = 'MARKS', _('Marks/Grades')
    REPORT_CARD = 'REPORT_CARD', _('Report Card')
    FEE_STRUCTURE = 'FEE_STRUCTURE', _('Fee Structure')
    FEE_INVOICE = 'FEE_INVOICE', _('Fee Invoice')
    FEE_PAYMENT = 'FEE_PAYMENT', _('Fee Payment')
    TRANSPORT_ALLOCATION = 'TRANSPORT_ALLOCATION', _('Transport Allocation')
    HOSTEL_ALLOCATION = 'HOSTEL_ALLOCATION', _('Hostel Allocation')
    PROMOTION = 'PROMOTION', _('Promotion Record')


# =============================================================================
# MIGRATION RUN MODELS
# =============================================================================

class MigrationRun(BaseModel):
    """
    Tracks a complete migration run across all phases.
    A migration run represents a full data migration session.
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('ROLLED_BACK', 'Rolled Back'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='migration_runs',
        help_text=_('Tenant this migration is for')
    )
    
    run_code = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Unique run identifier (e.g., MIG-2024-001)')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of this migration run')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    current_phase = models.CharField(
        max_length=30,
        choices=MigrationPhase.choices,
        default=MigrationPhase.PREFLIGHT
    )
    
    # Source system information
    source_system_name = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Name of source system (e.g., "Legacy ERP", "Excel Files")')
    )
    
    source_data_summary = models.JSONField(
        default=dict,
        help_text=_('Summary of source data: table counts, date ranges, etc.')
    )
    
    # Academic year boundaries
    start_academic_year = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Earliest academic year to migrate (e.g., 2014-2015)')
    )
    
    end_academic_year = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Latest academic year to migrate (e.g., 2024-2025)')
    )
    
    # Progress tracking
    total_records = models.IntegerField(default=0)
    processed_records = models.IntegerField(default=0)
    successful_records = models.IntegerField(default=0)
    failed_records = models.IntegerField(default=0)
    skipped_records = models.IntegerField(default=0)
    
    # Phase completion status
    phase_status = models.JSONField(
        default=dict,
        help_text=_('Completion status of each phase')
    )
    
    # Configuration
    config = models.JSONField(
        default=dict,
        help_text=_('Migration configuration: batch sizes, retry policies, etc.')
    )
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # User tracking
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_migration_runs'
    )
    
    class Meta:
        db_table = 'migration_runs'
        verbose_name = _('Migration Run')
        verbose_name_plural = _('Migration Runs')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.run_code} - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.run_code:
            # Generate unique run code
            import random
            import string
            suffix = ''.join(random.choices(string.digits, k=4))
            self.run_code = f"MIG-{timezone.now().strftime('%Y%m%d')}-{suffix}"
        super().save(*args, **kwargs)
    
    def get_progress_percentage(self):
        """Calculate overall progress percentage."""
        if self.total_records == 0:
            return 0
        return round((self.processed_records / self.total_records) * 100, 2)
    
    def advance_to_phase(self, phase: str):
        """Advance to the next phase."""
        self.phase_status[self.current_phase] = {
            'status': 'COMPLETED',
            'completed_at': timezone.now().isoformat()
        }
        self.current_phase = phase
        self.phase_status[phase] = {
            'status': 'RUNNING',
            'started_at': timezone.now().isoformat()
        }
        self.save()


class MigrationPhaseLog(BaseModel):
    """
    Detailed log for each phase execution within a migration run.
    """
    
    migration_run = models.ForeignKey(
        MigrationRun,
        on_delete=models.CASCADE,
        related_name='phase_logs'
    )
    
    phase = models.CharField(
        max_length=30,
        choices=MigrationPhase.choices
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('RUNNING', 'Running'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
        ],
        default='PENDING'
    )
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Progress for this phase
    total_entities = models.IntegerField(default=0)
    processed_entities = models.IntegerField(default=0)
    successful_entities = models.IntegerField(default=0)
    failed_entities = models.IntegerField(default=0)
    
    # Details by entity type
    entity_counts = models.JSONField(
        default=dict,
        help_text=_('Counts per entity type processed in this phase')
    )
    
    # Errors summary
    error_summary = models.JSONField(
        default=list,
        help_text=_('Summary of errors encountered')
    )
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'migration_phase_logs'
        verbose_name = _('Migration Phase Log')
        ordering = ['migration_run', 'created_at']
        unique_together = [['migration_run', 'phase']]
    
    def __str__(self):
        return f"{self.migration_run.run_code} - {self.phase}"


# =============================================================================
# CROSSWALK TABLES
# =============================================================================

class CrosswalkEntry(BaseModel):
    """
    Maps source system IDs to target system IDs.
    Essential for idempotent migrations and relationship resolution.
    
    Natural key normalization example:
    - student key = {tenant_id, admission_no} or {tenant_id, legacy_student_id}
    """
    
    migration_run = models.ForeignKey(
        MigrationRun,
        on_delete=models.CASCADE,
        related_name='crosswalk_entries'
    )
    
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices,
        db_index=True
    )
    
    # Source identification
    source_id = models.CharField(
        max_length=255,
        help_text=_('ID from source system')
    )
    
    source_natural_key = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Normalized natural key from source (e.g., tenant_id:admission_no)')
    )
    
    source_data = models.JSONField(
        default=dict,
        help_text=_('Original source data for reference')
    )
    
    # Target identification
    target_id = models.UUIDField(
        null=True,
        blank=True,
        help_text=_('UUID of created record in target system')
    )
    
    target_natural_key = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Natural key in target system')
    )
    
    # Academic year context (for year-scoped entities)
    academic_year_code = models.CharField(
        max_length=20,
        blank=True,
        db_index=True,
        help_text=_('Academic year code if applicable (e.g., 2014-2015)')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('MAPPED', 'Mapped'),
            ('CREATED', 'Created'),
            ('UPDATED', 'Updated'),
            ('SKIPPED', 'Skipped'),
            ('FAILED', 'Failed'),
        ],
        default='PENDING'
    )
    
    error_message = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'migration_crosswalk'
        verbose_name = _('Crosswalk Entry')
        ordering = ['migration_run', 'entity_type', 'source_id']
        indexes = [
            models.Index(fields=['migration_run', 'entity_type', 'source_id']),
            models.Index(fields=['migration_run', 'entity_type', 'source_natural_key']),
            models.Index(fields=['migration_run', 'entity_type', 'target_id']),
            models.Index(fields=['academic_year_code']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['migration_run', 'entity_type', 'source_id', 'academic_year_code'],
                name='unique_crosswalk_entry'
            )
        ]
    
    def __str__(self):
        return f"{self.entity_type}: {self.source_id} -> {self.target_id}"


# =============================================================================
# ERROR AND QUARANTINE TABLES
# =============================================================================

class MigrationError(BaseModel):
    """
    Detailed error tracking for migration row-level failures.
    Enables re-runnable migrations and error analysis.
    """
    
    SEVERITY_CHOICES = [
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    ERROR_TYPE_CHOICES = [
        ('SCHEMA', 'Schema Validation'),
        ('REFERENTIAL', 'Referential Integrity'),
        ('BUSINESS', 'Business Rule'),
        ('DUPLICATE', 'Duplicate Record'),
        ('MISSING_FK', 'Missing Foreign Key'),
        ('DATA_FORMAT', 'Data Format'),
        ('CONSTRAINT', 'Constraint Violation'),
        ('UNKNOWN', 'Unknown Error'),
    ]
    
    migration_run = models.ForeignKey(
        MigrationRun,
        on_delete=models.CASCADE,
        related_name='errors'
    )
    
    phase = models.CharField(
        max_length=30,
        choices=MigrationPhase.choices
    )
    
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices
    )
    
    # Source record info
    source_id = models.CharField(max_length=255, blank=True)
    source_row_number = models.IntegerField(null=True, blank=True)
    source_file = models.CharField(max_length=255, blank=True)
    source_data = models.JSONField(default=dict)
    
    # Academic year context
    academic_year_code = models.CharField(max_length=20, blank=True)
    
    # Error details
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='ERROR'
    )
    
    error_type = models.CharField(
        max_length=30,
        choices=ERROR_TYPE_CHOICES,
        default='UNKNOWN'
    )
    
    error_code = models.CharField(max_length=50, blank=True)
    error_message = models.TextField()
    error_details = models.JSONField(default=dict)
    
    # Resolution
    is_resolved = models.BooleanField(default=False)
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_migration_errors'
    )
    
    class Meta:
        db_table = 'migration_errors'
        verbose_name = _('Migration Error')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['migration_run', 'entity_type']),
            models.Index(fields=['migration_run', 'phase']),
            models.Index(fields=['error_type']),
            models.Index(fields=['is_resolved']),
        ]
    
    def __str__(self):
        return f"{self.entity_type} - {self.error_type}: {self.error_message[:50]}"


class QuarantineRecord(BaseModel):
    """
    Records that failed validation but are saved for later review/correction.
    Allows continue-on-error strategy with quarantining.
    """
    
    migration_run = models.ForeignKey(
        MigrationRun,
        on_delete=models.CASCADE,
        related_name='quarantine_records'
    )
    
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices
    )
    
    source_id = models.CharField(max_length=255)
    source_file = models.CharField(max_length=255, blank=True)
    source_row_number = models.IntegerField(null=True, blank=True)
    
    # Original data
    original_data = models.JSONField()
    
    # Academic year context
    academic_year_code = models.CharField(max_length=20, blank=True)
    
    # Quarantine reason
    reason = models.TextField()
    validation_errors = models.JSONField(default=list)
    
    # Resolution
    status = models.CharField(
        max_length=20,
        choices=[
            ('QUARANTINED', 'Quarantined'),
            ('CORRECTED', 'Corrected'),
            ('IMPORTED', 'Imported'),
            ('DISCARDED', 'Discarded'),
        ],
        default='QUARANTINED'
    )
    
    corrected_data = models.JSONField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'migration_quarantine'
        verbose_name = _('Quarantine Record')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.entity_type} - {self.source_id} ({self.status})"


# =============================================================================
# RECONCILIATION MODELS
# =============================================================================

class ReconciliationReport(BaseModel):
    """
    Reconciliation report for migration validation.
    Compares source vs target totals with variances.
    """
    
    REPORT_TYPE_CHOICES = [
        ('COUNT', 'Record Count Comparison'),
        ('FINANCIAL', 'Financial Totals'),
        ('ENROLLMENT', 'Enrollment Summary'),
        ('ATTENDANCE', 'Attendance Summary'),
        ('LONGITUDINAL', 'Student History Check'),
    ]
    
    migration_run = models.ForeignKey(
        MigrationRun,
        on_delete=models.CASCADE,
        related_name='reconciliation_reports'
    )
    
    report_type = models.CharField(
        max_length=30,
        choices=REPORT_TYPE_CHOICES
    )
    
    academic_year_code = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Academic year for year-specific reports')
    )
    
    # Totals comparison
    source_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True
    )
    
    target_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True
    )
    
    variance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True
    )
    
    variance_percentage = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        null=True, blank=True
    )
    
    # Detailed breakdown
    breakdown = models.JSONField(
        default=dict,
        help_text=_('Detailed breakdown by category (per class, per year, etc.)')
    )
    
    # Validation status
    is_valid = models.BooleanField(default=False)
    validation_notes = models.TextField(blank=True)
    
    # Spot check results
    spot_check_samples = models.JSONField(
        default=list,
        help_text=_('Sample records checked for validation')
    )
    
    class Meta:
        db_table = 'migration_reconciliation'
        verbose_name = _('Reconciliation Report')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.migration_run.run_code} - {self.report_type}"
    
    def calculate_variance(self):
        """Calculate variance between source and target."""
        if self.source_total is not None and self.target_total is not None:
            self.variance = self.target_total - self.source_total
            if self.source_total != 0:
                self.variance_percentage = (self.variance / self.source_total) * 100
            else:
                self.variance_percentage = 0
            self.save()


# =============================================================================
# ACADEMIC YEAR MIGRATION BATCH
# =============================================================================

class AcademicYearBatch(BaseModel):
    """
    Tracks migration progress for a specific academic year.
    Enables per-year rollback and parallel processing where safe.
    """
    
    migration_run = models.ForeignKey(
        MigrationRun,
        on_delete=models.CASCADE,
        related_name='year_batches'
    )
    
    academic_year_code = models.CharField(
        max_length=20,
        help_text=_('Academic year code (e.g., 2014-2015)')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='migration_batches',
        help_text=_('Created AcademicYear record')
    )
    
    # Ordering for chronological processing
    year_sequence = models.IntegerField(
        default=0,
        help_text=_('Sequence number for ordering (1 = oldest)')
    )
    
    # Date range for this year
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('IN_PROGRESS', 'In Progress'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
            ('ROLLED_BACK', 'Rolled Back'),
        ],
        default='PENDING'
    )
    
    # Progress tracking
    total_records = models.IntegerField(default=0)
    processed_records = models.IntegerField(default=0)
    successful_records = models.IntegerField(default=0)
    failed_records = models.IntegerField(default=0)
    
    # Entity-level progress
    entity_progress = models.JSONField(
        default=dict,
        help_text=_('Progress per entity type for this year')
    )
    
    # Created record IDs for rollback
    created_records = models.JSONField(
        default=dict,
        help_text=_('IDs of records created, grouped by entity type')
    )
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'migration_year_batches'
        verbose_name = _('Academic Year Batch')
        ordering = ['migration_run', 'year_sequence']
        unique_together = [['migration_run', 'academic_year_code']]
    
    def __str__(self):
        return f"{self.migration_run.run_code} - {self.academic_year_code}"


# =============================================================================
# DATA SCOPE CONFIGURATION
# =============================================================================

class EntityScopeConfig(BaseModel):
    """
    Configuration defining the scope of each entity type.
    Used for migration mapping and validation.
    """
    
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices,
        unique=True
    )
    
    data_scope = models.CharField(
        max_length=30,
        choices=DataScope.choices
    )
    
    model_path = models.CharField(
        max_length=100,
        help_text=_('Django model path (e.g., "students.Student")')
    )
    
    natural_key_fields = models.JSONField(
        default=list,
        help_text=_('Fields that form the natural key')
    )
    
    unique_field = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Primary unique field for duplicate detection')
    )
    
    # Dependencies
    depends_on = models.JSONField(
        default=list,
        help_text=_('Entity types this entity depends on')
    )
    
    # Migration order within scope
    migration_order = models.IntegerField(
        default=100,
        help_text=_('Order for migration within the same scope (lower = earlier)')
    )
    
    # Configuration
    supports_rollback = models.BooleanField(default=True)
    supports_update = models.BooleanField(default=True)
    batch_size = models.IntegerField(default=1000)
    
    class Meta:
        db_table = 'entity_scope_config'
        verbose_name = _('Entity Scope Configuration')
        ordering = ['data_scope', 'migration_order']
    
    def __str__(self):
        return f"{self.entity_type} ({self.data_scope})"
