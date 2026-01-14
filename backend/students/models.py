"""
Student Models for 360° Golden Record
Includes Universal Remarks System and comprehensive student data
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords
from core.models import BaseModel
from core.fields import EncryptedCharField
from core.utils import (
    validate_indian_phone, 
    validate_email_enhanced, 
    validate_aadhar
)
from django.core.validators import MinValueValidator, MaxValueValidator, EmailValidator
from decimal import Decimal


class Student(BaseModel):
    """
    Core Student Profile model (The Profile).
    Contains permanent student information.
    Enrollment details are in StudentEnrollment model.
    """
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]
    
    # Tenant
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='students'
    )
    
    # Basic Information
    admission_number = models.CharField(
        max_length=50,
        db_index=True,
        help_text=_('Unique admission number')
    )
    
    admission_date = models.DateField(
        help_text=_('Date of admission to school')
    )
    
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, help_text=_('Middle Name (Optional)'))
    last_name = models.CharField(max_length=100, blank=True, help_text=_('Last Name (Optional)'))
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True)
    
    # Personal Details
    nationality = models.CharField(max_length=100, blank=True, default='', help_text=_('Nationality'))
    citizenship = models.CharField(max_length=100, blank=True, default='', help_text=_('Citizenship Status'))
    religion = models.CharField(max_length=100, blank=True, default='', help_text=_('Religion'))
    caste = models.CharField(max_length=100, blank=True, default='', help_text=_('Caste'))
    
    # Contact
    email = models.EmailField(
        blank=True,
        validators=[EmailValidator(), validate_email_enhanced]
    )
    phone = models.CharField(
        max_length=20, 
        blank=True,
        validators=[validate_indian_phone]
    )
    address = models.TextField()
    
    # Family
    father_name = models.CharField(max_length=100)
    father_phone = models.CharField(
        max_length=20,
        validators=[validate_indian_phone]
    )
    father_email = models.EmailField(
        blank=True,
        validators=[EmailValidator(), validate_email_enhanced]
    )
    father_occupation = models.CharField(max_length=100, blank=True)
    father_profession = models.CharField(max_length=150, blank=True, help_text=_('Father Profession/Job Title'))
    
    mother_name = models.CharField(max_length=100)
    mother_phone = models.CharField(
        max_length=20,
        validators=[validate_indian_phone]
    )
    mother_email = models.EmailField(
        blank=True,
        validators=[EmailValidator(), validate_email_enhanced]
    )
    mother_occupation = models.CharField(max_length=100, blank=True)
    mother_profession = models.CharField(max_length=150, blank=True, help_text=_('Mother Profession/Job Title'))
    
    guardian_name = models.CharField(max_length=100, blank=True)
    guardian_phone = models.CharField(
        max_length=20, 
        blank=True,
        validators=[validate_indian_phone]
    )
    guardian_relation = models.CharField(max_length=50, blank=True)
    
    # Government IDs and Identification Numbers
    pen_number = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Permanent Education Number')
    )
    
    aadhar_number = EncryptedCharField(
        max_length=255,  # Increased for encrypted data
        blank=True,
        validators=[validate_aadhar],
        help_text=_('Aadhar Card Number (12 digits) - Encrypted')
    )
    
    aapar_number = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Aapar Number / Other ID')
    )
    
    # Previous School Details
    previous_school_name = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Name of Previous School')
    )
    previous_school_address = models.TextField(
        blank=True,
        help_text=_('Address of Previous School')
    )
    previous_school_class = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Last Class/Grade Attended')
    )
    transfer_certificate_number = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Transfer Certificate Number')
    )
    
    # Sibling Logic
    family_id = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text=_('Unique family identifier for sibling linking')
    )
    
    # Media
    photo = models.ImageField(upload_to='students/photos/', blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    notes = models.TextField(blank=True, help_text=_('Internal notes'))
    
    class Meta:
        db_table = 'students'
        verbose_name = _('Student')
        verbose_name_plural = _('Students')
        ordering = ['admission_number']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'admission_number'],
                name='unique_admission_number_per_tenant'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'admission_number']),
            models.Index(fields=['family_id']),
        ]
    
    # Audit trail - tracks all changes to student records
    history = HistoricalRecords(
        history_change_reason_field=models.TextField(null=True),
        excluded_fields=['updated_at'],  # Don't track auto-updated fields
    )
    
    def __str__(self):
        return f"{self.admission_number} - {self.get_full_name()}"
    
    def get_full_name(self):
        """Get student's full name."""
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        if self.last_name:
            parts.append(self.last_name)
        return ' '.join(parts)
    
    def get_siblings(self):
        """Get all siblings (students with same family_id)."""
        if not self.family_id:
            return Student.objects.none()
        
        return Student.objects.filter(
            tenant=self.tenant,
            family_id=self.family_id,
            is_active=True
        ).exclude(id=self.id)
    
    def get_age(self):
        """Calculate student's age."""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def get_current_enrollment(self):
        """Get current active enrollment."""
        return self.enrollments.filter(status='ACTIVE').first()


class StudentEnrollment(BaseModel):
    """
    Student Enrollment model (The Session Record).
    Tracks student's enrollment in a specific academic year and section.
    Maintains history of all enrollments.
    """
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PROMOTED', 'Promoted'),
        ('DETAINED', 'Detained'),
        ('SUSPENDED', 'Suspended'),
        ('LEFT', 'Left'),
        ('TRANSFERRED', 'Transferred'),
        ('COMPLETED', 'Completed'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='student_enrollments'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text=_('Student profile')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text=_('Academic year for this enrollment')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text=_('Section (which links to grade level)')
    )
    
    roll_number = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Roll number for this session')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        db_index=True,
        help_text=_('Enrollment status')
    )
    
    enrollment_date = models.DateField(
        help_text=_('Date of enrollment in this session')
    )
    
    exit_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Date of exit from this session')
    )
    
    exit_reason = models.TextField(
        blank=True,
        help_text=_('Reason for exit (if applicable)')
    )
    
    # Attendance summary (can be updated periodically)
    total_days = models.IntegerField(default=0)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    
    # Academic performance summary
    final_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))]
    )
    
    final_grade = models.CharField(max_length=5, blank=True)
    
    # Promotion details
    promoted_to_section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promoted_from_enrollments',
        help_text=_('Section promoted to (if promoted)')
    )
    
    # Notes
    notes = models.TextField(blank=True, help_text=_('Internal notes for this enrollment'))
    
    class Meta:
        db_table = 'student_enrollments'
        verbose_name = _('Student Enrollment')
        verbose_name_plural = _('Student Enrollments')
        ordering = ['-enrollment_date']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'academic_year'],
                name='unique_student_per_academic_year'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'academic_year', 'status']),
            models.Index(fields=['student', '-enrollment_date']),
            models.Index(fields=['section', 'status']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.section} ({self.academic_year.name})"
    
    def get_attendance_percentage(self):
        """Calculate attendance percentage."""
        if self.total_days > 0:
            return round((self.present_days / self.total_days) * 100, 2)
        return 0.0


class StudentRemark(BaseModel):
    """
    Universal Remarks System - Central feed for all student interactions.
    Any staff member can post remarks visible in the 360° profile.
    """
    
    REMARK_TYPE_CHOICES = [
        ('POSITIVE', 'Positive'),
        ('NEGATIVE', 'Negative'),
        ('NEUTRAL', 'Neutral'),
        ('COMPLAINT', 'Complaint'),
        ('ACHIEVEMENT', 'Achievement'),
        ('DISCIPLINE', 'Discipline'),
        ('SYSTEM', 'System Generated'),
    ]
    
    CATEGORY_CHOICES = [
        ('ACADEMIC', 'Academic'),
        ('BEHAVIORAL', 'Behavioral'),
        ('ATTENDANCE', 'Attendance'),
        ('TRANSPORT', 'Transport'),
        ('LIBRARY', 'Library'),
        ('HOSTEL', 'Hostel'),
        ('HEALTH', 'Health'),
        ('FINANCE', 'Finance'),
        ('GENERAL', 'General'),
    ]
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='remarks'
    )
    
    remark_type = models.CharField(
        max_length=20,
        choices=REMARK_TYPE_CHOICES,
        db_index=True
    )
    
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        db_index=True
    )
    
    title = models.CharField(
        max_length=200,
        help_text=_('Brief title of the remark')
    )
    
    description = models.TextField(
        help_text=_('Detailed description')
    )
    
    # Staff who created the remark
    created_by_staff = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='student_remarks_created'
    )
    
    # Visibility
    visible_to_parent = models.BooleanField(
        default=True,
        help_text=_('Whether parents can see this remark')
    )
    
    visible_to_student = models.BooleanField(
        default=False,
        help_text=_('Whether student can see this remark')
    )
    
    # Priority
    is_important = models.BooleanField(
        default=False,
        help_text=_('Mark as important/urgent')
    )
    
    # System generated
    is_system_generated = models.BooleanField(
        default=False,
        help_text=_('Auto-generated by system')
    )
    
    # Source module (for system-generated remarks)
    source_module = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Module that generated this remark (e.g., library, transport)')
    )
    
    source_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Reference ID from source module')
    )
    
    # Attachments
    attachment = models.FileField(
        upload_to='student_remarks/',
        blank=True,
        null=True
    )
    
    # Follow-up
    requires_action = models.BooleanField(default=False)
    action_taken = models.BooleanField(default=False)
    action_notes = models.TextField(blank=True)
    
    # Parent acknowledgment
    parent_acknowledged = models.BooleanField(default=False)
    parent_acknowledged_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_remarks'
        verbose_name = _('Student Remark')
        verbose_name_plural = _('Student Remarks')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['remark_type', 'category']),
            models.Index(fields=['visible_to_parent']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.title}"
    
    def get_color_class(self):
        """Get CSS class based on remark type."""
        color_map = {
            'POSITIVE': 'success',
            'NEGATIVE': 'danger',
            'NEUTRAL': 'secondary',
            'COMPLAINT': 'warning',
            'ACHIEVEMENT': 'primary',
            'DISCIPLINE': 'danger',
            'SYSTEM': 'info',
        }
        return color_map.get(self.remark_type, 'secondary')


class StudentDocument(BaseModel):
    """
    Student documents storage (certificates, reports, etc.)
    Enhanced with verification workflow and expiry tracking.
    """
    
    DOCUMENT_TYPE_CHOICES = [
        ('BIRTH_CERTIFICATE', 'Birth Certificate'),
        ('TRANSFER_CERTIFICATE', 'Transfer Certificate'),
        ('CHARACTER_CERTIFICATE', 'Character Certificate'),
        ('MIGRATION_CERTIFICATE', 'Migration Certificate'),
        ('REPORT_CARD', 'Report Card'),
        ('MARKSHEET', 'Marksheet'),
        ('MEDICAL_CERTIFICATE', 'Medical Certificate'),
        ('MEDICAL_REPORT', 'Medical Report'),
        ('VACCINATION_RECORD', 'Vaccination Record'),
        ('ID_PROOF', 'ID Proof'),
        ('AADHAR_CARD', 'Aadhar Card'),
        ('PASSPORT', 'Passport'),
        ('PHOTO', 'Photograph'),
        ('CASTE_CERTIFICATE', 'Caste Certificate'),
        ('INCOME_CERTIFICATE', 'Income Certificate'),
        ('DOMICILE_CERTIFICATE', 'Domicile Certificate'),
        ('DISABILITY_CERTIFICATE', 'Disability Certificate'),
        ('OTHER', 'Other'),
    ]
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='student_documents/')
    
    # Enhanced verification fields
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text=_('Document verification status')
    )
    
    # Legacy field - keeping for backward compatibility
    is_verified = models.BooleanField(
        default=False,
        help_text=_('Legacy verification flag - use verification_status instead')
    )
    
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='verified_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Rejection tracking
    rejection_reason = models.TextField(
        blank=True,
        help_text=_('Reason for document rejection')
    )
    rejected_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='rejected_documents'
    )
    rejected_at = models.DateTimeField(null=True, blank=True)
    
    # Expiry tracking
    issue_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Document issue date')
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Document expiry date (if applicable)')
    )
    
    # Document metadata
    document_number = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Official document number (e.g., certificate number)')
    )
    issuing_authority = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Authority that issued the document')
    )
    
    # File metadata
    file_size = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('File size in bytes')
    )
    file_type = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('MIME type of the file')
    )
    
    class Meta:
        db_table = 'student_documents'
        verbose_name = _('Student Document')
        verbose_name_plural = _('Student Documents')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'document_type']),
            models.Index(fields=['verification_status', 'created_at']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.title}"
    
    def save(self, *args, **kwargs):
        """
        Override save to sync is_verified with verification_status.
        Calculate file metadata.
        """
        # Sync legacy field
        self.is_verified = (self.verification_status == 'verified')
        
        # Calculate file metadata if file exists
        if self.file:
            try:
                self.file_size = self.file.size
                # Extract MIME type from filename
                import mimetypes
                self.file_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
            except:
                pass
        
        super().save(*args, **kwargs)
    
    def verify(self, user):
        """
        Mark document as verified.
        """
        from django.utils import timezone
        self.verification_status = 'verified'
        self.verified_by = user
        self.verified_at = timezone.now()
        self.is_verified = True
        self.save()
    
    def reject(self, user, reason):
        """
        Mark document as rejected.
        """
        from django.utils import timezone
        self.verification_status = 'rejected'
        self.rejected_by = user
        self.rejected_at = timezone.now()
        self.rejection_reason = reason
        self.is_verified = False
        self.save()
    
    @property
    def is_expired(self):
        """
        Check if document has expired.
        """
        if self.expiry_date:
            from django.utils import timezone
            return self.expiry_date < timezone.now().date()
        return False
    
    @property
    def days_until_expiry(self):
        """
        Calculate days until expiry.
        Returns None if no expiry date set.
        """
        if self.expiry_date:
            from django.utils import timezone
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None


class StudentHealthRecord(BaseModel):
    """
    Student health records and medical history
    """
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='health_records'
    )
    
    date = models.DateField()
    
    # Vitals
    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Medical
    diagnosis = models.TextField(blank=True)
    treatment = models.TextField(blank=True)
    prescription = models.TextField(blank=True)
    
    # Allergies
    allergies = models.TextField(blank=True)
    
    # Vaccination
    vaccination_name = models.CharField(max_length=100, blank=True)
    vaccination_date = models.DateField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Medical staff
    examined_by = models.CharField(max_length=200, blank=True)
    
    class Meta:
        db_table = 'student_health_records'
        verbose_name = _('Health Record')
        verbose_name_plural = _('Health Records')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.date}"
    
    def get_bmi(self):
        """Calculate BMI if height and weight are available."""
        if self.height_cm and self.weight_kg:
            height_m = self.height_cm / 100
            return round(self.weight_kg / (height_m ** 2), 2)
        return None


class BulkStudentImport(BaseModel):
    """
    Track bulk student imports
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('PARTIALLY_COMPLETED', 'Partially Completed'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='bulk_imports'
    )
    
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    file = models.FileField(upload_to='bulk_imports/')
    photos_zip = models.FileField(upload_to='bulk_imports/photos/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    total_records = models.IntegerField(default=0)
    successful_records = models.IntegerField(default=0)
    failed_records = models.IntegerField(default=0)
    
    error_log = models.JSONField(default=list, blank=True)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'bulk_student_imports'
        verbose_name = _('Bulk Student Import')
        verbose_name_plural = _('Bulk Student Imports')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Import {self.id} - {self.status}"


class StudentPromotion(BaseModel):
    """
    Student promotion records
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='promotions'
    )
    
    academic_year_from = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='promotions_from'
    )
    
    academic_year_to = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='promotions_to'
    )
    
    section_from = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='promotions_from',
        null=True,
        blank=True
    )
    
    section_to = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='promotions_to',
        null=True,
        blank=True
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    total_students = models.IntegerField(default=0)
    promoted_count = models.IntegerField(default=0)
    detained_count = models.IntegerField(default=0)
    
    promotion_criteria = models.JSONField(
        default=dict,
        help_text=_('Criteria for promotion (min attendance, min marks, etc.)')
    )
    
    promoted_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='promotions_conducted'
    )
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='promotions_approved'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'student_promotions'
        verbose_name = _('Student Promotion')
        verbose_name_plural = _('Student Promotions')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Promotion {self.academic_year_from} → {self.academic_year_to}"


class StudentPromotionDetail(BaseModel):
    """
    Individual student promotion details
    """
    
    PROMOTION_STATUS_CHOICES = [
        ('PROMOTED', 'Promoted'),
        ('DETAINED', 'Detained'),
        ('CONDITIONAL', 'Conditional Promotion'),
    ]
    
    promotion = models.ForeignKey(
        StudentPromotion,
        on_delete=models.CASCADE,
        related_name='details'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='promotion_history'
    )
    
    enrollment_from = models.ForeignKey(
        StudentEnrollment,
        on_delete=models.CASCADE,
        related_name='promotion_from'
    )
    
    enrollment_to = models.ForeignKey(
        StudentEnrollment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='promotion_to'
    )
    
    promotion_status = models.CharField(max_length=20, choices=PROMOTION_STATUS_CHOICES)
    
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    detention_reason = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    parent_notified = models.BooleanField(default=False)
    parent_notified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_promotion_details'
        verbose_name = _('Student Promotion Detail')
        verbose_name_plural = _('Student Promotion Details')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.promotion_status}"


class StudentTransfer(BaseModel):
    """
    Student transfer records
    """
    
    TRANSFER_TYPE_CHOICES = [
        ('SECTION', 'Section Transfer'),
        ('SCHOOL', 'School Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='student_transfers'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='transfers'
    )
    
    transfer_type = models.CharField(max_length=20, choices=TRANSFER_TYPE_CHOICES)
    
    from_section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='transfers_from',
        null=True,
        blank=True
    )
    
    to_section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='transfers_to',
        null=True,
        blank=True
    )
    
    transfer_date = models.DateField()
    reason = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='transfers_requested'
    )
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='transfers_approved'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    
    transfer_certificate_generated = models.BooleanField(default=False)
    transfer_certificate = models.FileField(
        upload_to='transfer_certificates/',
        null=True,
        blank=True
    )
    
    class_teacher_notified = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'student_transfers'
        verbose_name = _('Student Transfer')
        verbose_name_plural = _('Student Transfers')
        ordering = ['-transfer_date']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.transfer_type}"


class AlumniProfile(BaseModel):
    """
    Alumni profile extending student data
    """
    
    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        related_name='alumni_profile'
    )
    
    graduation_year = models.IntegerField()
    
    current_occupation = models.CharField(max_length=200, blank=True)
    current_company = models.CharField(max_length=200, blank=True)
    current_designation = models.CharField(max_length=200, blank=True)
    
    higher_education = models.TextField(blank=True)
    current_institution = models.CharField(max_length=200, blank=True)
    
    achievements = models.TextField(blank=True)
    
    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    
    willing_to_mentor = models.BooleanField(default=False)
    willing_to_recruit = models.BooleanField(default=False)
    
    portal_access = models.BooleanField(default=False)
    
    last_contact_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'alumni_profiles'
        verbose_name = _('Alumni Profile')
        verbose_name_plural = _('Alumni Profiles')
        ordering = ['-graduation_year']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.graduation_year}"


class AlumniEvent(BaseModel):
    """
    Alumni events
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='alumni_events'
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    event_date = models.DateTimeField()
    location = models.CharField(max_length=300)
    
    is_virtual = models.BooleanField(default=False)
    virtual_link = models.URLField(blank=True)
    
    max_attendees = models.IntegerField(null=True, blank=True)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    
    is_published = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    class Meta:
        db_table = 'alumni_events'
        verbose_name = _('Alumni Event')
        verbose_name_plural = _('Alumni Events')
        ordering = ['-event_date']
    
    def __str__(self):
        return self.title


class AlumniEventRegistration(BaseModel):
    """
    Alumni event registrations
    """
    
    STATUS_CHOICES = [
        ('REGISTERED', 'Registered'),
        ('ATTENDED', 'Attended'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    event = models.ForeignKey(
        AlumniEvent,
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    
    alumni = models.ForeignKey(
        AlumniProfile,
        on_delete=models.CASCADE,
        related_name='event_registrations'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REGISTERED')
    
    guests_count = models.IntegerField(default=0)
    special_requirements = models.TextField(blank=True)
    
    attended_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'alumni_event_registrations'
        verbose_name = _('Alumni Event Registration')
        verbose_name_plural = _('Alumni Event Registrations')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'alumni'],
                name='unique_event_registration'
            )
        ]
    
    def __str__(self):
        return f"{self.alumni} - {self.event.title}"


class AlumniJobPosting(BaseModel):
    """
    Job board for alumni
    """
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
        ('EXPIRED', 'Expired'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='alumni_jobs'
    )
    
    posted_by_alumni = models.ForeignKey(
        AlumniProfile,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='jobs_posted'
    )
    
    company_name = models.CharField(max_length=200)
    job_title = models.CharField(max_length=200)
    job_description = models.TextField()
    
    location = models.CharField(max_length=200)
    job_type = models.CharField(max_length=50)  # Full-time, Part-time, Contract, Internship
    
    experience_required = models.CharField(max_length=100, blank=True)
    skills_required = models.TextField(blank=True)
    
    application_link = models.URLField()
    application_deadline = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    views_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'alumni_job_postings'
        verbose_name = _('Alumni Job Posting')
        verbose_name_plural = _('Alumni Job Postings')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_title} at {self.company_name}"


class AlumniDonation(BaseModel):
    """
    Alumni donations tracking
    """
    
    STATUS_CHOICES = [
        ('PLEDGED', 'Pledged'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='alumni_donations'
    )
    
    alumni = models.ForeignKey(
        AlumniProfile,
        on_delete=models.CASCADE,
        related_name='donations'
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    
    donation_purpose = models.CharField(max_length=200)
    donation_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLEDGED')
    
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_reference = models.CharField(max_length=100, blank=True)
    
    receipt_generated = models.BooleanField(default=False)
    receipt_file = models.FileField(upload_to='donation_receipts/', null=True, blank=True)
    
    acknowledgment_sent = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'alumni_donations'
        verbose_name = _('Alumni Donation')
        verbose_name_plural = _('Alumni Donations')
        ordering = ['-donation_date']
    
    def __str__(self):
        return f"{self.alumni} - {self.amount} {self.currency}"


class StudentIDCard(BaseModel):
    """
    DEPRECATED: This model is superseded by the new idcards app.
    Use idcards.models.IDCardRecord instead.
    Retained for migration compatibility only.
    
    Student ID card records (legacy)
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('GENERATED', 'Generated'),
        ('PRINTED', 'Printed'),
        ('ISSUED', 'Issued'),
        ('LOST', 'Lost'),
        ('REISSUED', 'Re-issued'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_cards'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='id_cards'
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='id_cards'
    )
    
    card_number = models.CharField(max_length=50, unique=True)
    
    template = models.ForeignKey(
        'IDCardTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    qr_code_data = models.TextField(help_text=_('Data encoded in QR code'))
    qr_code_image = models.ImageField(upload_to='id_cards/qr_codes/', null=True, blank=True)
    
    generated_pdf = models.FileField(upload_to='id_cards/pdfs/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    issued_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='id_cards_issued'
    )
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'student_id_cards'
        verbose_name = _('Student ID Card')
        verbose_name_plural = _('Student ID Cards')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.card_number}"


class IDCardTemplate(BaseModel):
    """
    DEPRECATED: This model is superseded by the new idcards app.
    Use idcards.models.IDCardTemplate instead.
    Retained for migration compatibility only.
    
    ID card templates (legacy)
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='id_card_templates'
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    grade_level = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text=_('Template for specific grade (optional)')
    )
    
    template_design = models.JSONField(
        default=dict,
        help_text=_('Template design configuration')
    )
    
    background_image = models.ImageField(upload_to='id_card_templates/', null=True, blank=True)
    
    include_photo = models.BooleanField(default=True)
    include_qr_code = models.BooleanField(default=True)
    include_barcode = models.BooleanField(default=False)
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'id_card_templates'
        verbose_name = _('ID Card Template')
        verbose_name_plural = _('ID Card Templates')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ParentUser(BaseModel):
    """
    Parent user accounts for portal access
    """
    
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='parent_profile'
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='parent_users'
    )
    
    students = models.ManyToManyField(
        Student,
        related_name='parent_accounts',
        help_text=_('Students linked to this parent')
    )
    
    relation_type = models.CharField(
        max_length=20,
        choices=[
            ('FATHER', 'Father'),
            ('MOTHER', 'Mother'),
            ('GUARDIAN', 'Guardian'),
        ]
    )
    
    occupation = models.CharField(max_length=200, blank=True)
    office_address = models.TextField(blank=True)
    
    preferred_language = models.CharField(max_length=10, default='en')
    
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    portal_access_enabled = models.BooleanField(default=True)
    
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'parent_users'
        verbose_name = _('Parent User')
        verbose_name_plural = _('Parent Users')
        ordering = ['user__first_name']
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.relation_type})"


class LeaveApplication(BaseModel):
    """
    Student leave applications
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    LEAVE_TYPE_CHOICES = [
        ('SICK', 'Sick Leave'),
        ('CASUAL', 'Casual Leave'),
        ('PLANNED', 'Planned Leave'),
        ('EMERGENCY', 'Emergency Leave'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='leave_applications'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='leave_applications'
    )
    
    applied_by_parent = models.ForeignKey(
        ParentUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leave_applications_submitted'
    )
    
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    
    from_date = models.DateField()
    to_date = models.DateField()
    
    reason = models.TextField()
    attachment = models.FileField(upload_to='leave_applications/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leave_applications_approved'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'student_leave_applications'
        verbose_name = _('Leave Application')
        verbose_name_plural = _('Leave Applications')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.from_date} to {self.to_date}"


class StudentAuditLog(BaseModel):
    """
    Comprehensive audit trail for student data changes
    """
    
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('BULK_UPDATE', 'Bulk Updated'),
        ('PROMOTE', 'Promoted'),
        ('TRANSFER', 'Transferred'),
        ('STATUS_CHANGE', 'Status Changed'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='student_audit_logs'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    field_name = models.CharField(max_length=100, blank=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    
    change_reason = models.TextField(blank=True)
    
    changed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='student_changes_made'
    )
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    additional_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'student_audit_logs'
        verbose_name = _('Student Audit Log')
        verbose_name_plural = _('Student Audit Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.action} - {self.created_at}"


class CommunicationTemplate(BaseModel):
    """
    Templates for SMS, Email, and WhatsApp communications
    """
    
    TEMPLATE_TYPE_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp'),
    ]
    
    CATEGORY_CHOICES = [
        ('ADMISSION', 'Admission'),
        ('ATTENDANCE', 'Attendance'),
        ('FEE', 'Fee'),
        ('EXAM', 'Exam'),
        ('EVENT', 'Event'),
        ('GENERAL', 'General'),
        ('EMERGENCY', 'Emergency'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='communication_templates'
    )
    
    name = models.CharField(max_length=200)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
    subject = models.CharField(max_length=200, blank=True, help_text=_('For emails'))
    content = models.TextField(help_text=_('Template content with variables like {{student_name}}, {{date}}, etc.'))
    
    variables = models.JSONField(
        default=list,
        help_text=_('List of available variables')
    )
    
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'communication_templates'
        verbose_name = _('Communication Template')
        verbose_name_plural = _('Communication Templates')
        ordering = ['template_type', 'name']
    
    def __str__(self):
        return f"{self.template_type} - {self.name}"


class CommunicationLog(BaseModel):
    """
    Log of all communications sent
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
        ('READ', 'Read'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='communication_logs'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='communications_received'
    )
    
    template = models.ForeignKey(
        CommunicationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    communication_type = models.CharField(max_length=20)
    
    recipient = models.CharField(max_length=200, help_text=_('Phone/Email/WhatsApp number'))
    subject = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    
    sent_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    external_id = models.CharField(max_length=200, blank=True, help_text=_('ID from SMS/Email provider'))
    
    class Meta:
        db_table = 'communication_logs'
        verbose_name = _('Communication Log')
        verbose_name_plural = _('Communication Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.communication_type} to {self.student.get_full_name()} - {self.status}"


class StudentBehaviorPoint(BaseModel):
    """
    Behavior points system for students
    """
    
    POINT_TYPE_CHOICES = [
        ('POSITIVE', 'Positive'),
        ('NEGATIVE', 'Negative'),
    ]
    
    CATEGORY_CHOICES = [
        ('DISCIPLINE', 'Discipline'),
        ('ACADEMIC', 'Academic'),
        ('SPORTS', 'Sports'),
        ('EXTRACURRICULAR', 'Extracurricular'),
        ('COMMUNITY_SERVICE', 'Community Service'),
        ('ATTENDANCE', 'Attendance'),
        ('CONDUCT', 'Conduct'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='behavior_points'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='behavior_points'
    )
    
    point_type = models.CharField(max_length=20, choices=POINT_TYPE_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    
    points = models.IntegerField(
        help_text=_('Number of points (positive or negative)')
    )
    
    reason = models.TextField()
    
    awarded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='behavior_points_awarded'
    )
    
    parent_notified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'student_behavior_points'
        verbose_name = _('Student Behavior Point')
        verbose_name_plural = _('Student Behavior Points')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.points} points"


class DisciplinaryAction(BaseModel):
    """
    Disciplinary actions taken against students
    """
    
    ACTION_TYPE_CHOICES = [
        ('WARNING', 'Warning'),
        ('DETENTION', 'Detention'),
        ('SUSPENSION', 'Suspension'),
        ('EXPULSION', 'Expulsion'),
        ('COMMUNITY_SERVICE', 'Community Service'),
        ('PARENT_MEETING', 'Parent Meeting'),
        ('COUNSELING', 'Counseling Referral'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='disciplinary_actions'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='disciplinary_actions'
    )
    
    action_type = models.CharField(max_length=30, choices=ACTION_TYPE_CHOICES)
    
    incident_date = models.DateField()
    incident_description = models.TextField()
    
    action_date = models.DateField()
    action_details = models.TextField()
    
    duration_days = models.IntegerField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    reported_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='disciplinary_actions_reported'
    )
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disciplinary_actions_approved'
    )
    
    parent_informed = models.BooleanField(default=False)
    parent_informed_date = models.DateField(null=True, blank=True)
    
    follow_up_required = models.BooleanField(default=False)
    follow_up_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'disciplinary_actions'
        verbose_name = _('Disciplinary Action')
        verbose_name_plural = _('Disciplinary Actions')
        ordering = ['-incident_date']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.action_type}"


class CounselingRecord(BaseModel):
    """
    Student counseling records
    """
    
    SESSION_TYPE_CHOICES = [
        ('INDIVIDUAL', 'Individual'),
        ('GROUP', 'Group'),
        ('FAMILY', 'Family'),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='counseling_records'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='counseling_records'
    )
    
    session_date = models.DateField()
    session_time = models.TimeField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    
    reason = models.TextField()
    
    counselor = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='counseling_sessions_conducted'
    )
    
    session_notes = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    
    parent_consent = models.BooleanField(default=False)
    parent_attended = models.BooleanField(default=False)
    
    is_confidential = models.BooleanField(
        default=True,
        help_text=_('Restricted access to counseling staff only')
    )
    
    class Meta:
        db_table = 'counseling_records'
        verbose_name = _('Counseling Record')
        verbose_name_plural = _('Counseling Records')
        ordering = ['-session_date', '-session_time']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.session_date}"


class ParentTeacherMeeting(BaseModel):
    """
    Parent-teacher meeting records
    """
    
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='parent_teacher_meetings'
    )
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='parent_teacher_meetings'
    )
    
    meeting_date = models.DateField()
    meeting_time = models.TimeField()
    
    requested_by_parent = models.ForeignKey(
        ParentUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='parent_meetings_attended'
    )
    
    purpose = models.TextField()
    
    agenda = models.TextField(blank=True)
    minutes = models.TextField(blank=True)
    action_items = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    parent_attended = models.BooleanField(default=False)
    teacher_attended = models.BooleanField(default=False)
    
    follow_up_required = models.BooleanField(default=False)
    next_meeting_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'parent_teacher_meetings'
        verbose_name = _('Parent-Teacher Meeting')
        verbose_name_plural = _('Parent-Teacher Meetings')
        ordering = ['-meeting_date', '-meeting_time']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.meeting_date}"


class StudentReport(BaseModel):
    """
    Generated student reports
    """
    
    REPORT_TYPE_CHOICES = [
        ('DIRECTORY', 'Student Directory'),
        ('CLASS_LIST', 'Class-wise List'),
        ('BIRTHDAY', 'Birthday List'),
        ('CONTACT', 'Contact List'),
        ('SIBLING', 'Sibling Report'),
        ('NEW_ADMISSION', 'New Admissions'),
        ('STRENGTH', 'Student Strength'),
        ('DEMOGRAPHIC', 'Demographic Report'),
        ('BLOOD_GROUP', 'Blood Group Report'),
        ('CUSTOM', 'Custom Report'),
    ]
    
    STATUS_CHOICES = [
        ('GENERATING', 'Generating'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='student_reports'
    )
    
    report_type = models.CharField(max_length=30, choices=REPORT_TYPE_CHOICES)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    filters = models.JSONField(
        default=dict,
        help_text=_('Report filter criteria')
    )
    
    generated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    file = models.FileField(upload_to='student_reports/', null=True, blank=True)
    file_format = models.CharField(max_length=10, default='PDF')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='GENERATING')
    
    record_count = models.IntegerField(default=0)
    
    generated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_reports'
        verbose_name = _('Student Report')
        verbose_name_plural = _('Student Reports')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.report_type} - {self.created_at.date()}"


class DocumentCategory(BaseModel):
    """
    Custom document categories for students
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='document_categories'
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    is_mandatory = models.BooleanField(default=False)
    required_for_admission = models.BooleanField(default=False)
    
    requires_verification = models.BooleanField(default=False)
    
    has_expiry = models.BooleanField(default=False)
    expiry_reminder_days = models.IntegerField(
        default=30,
        help_text=_('Days before expiry to send reminder')
    )
    
    allowed_file_types = models.JSONField(
        default=list,
        help_text=_('Allowed file extensions, e.g., ["pdf", "jpg", "png"]')
    )
    
    max_file_size_mb = models.IntegerField(default=5)
    
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'document_categories'
        verbose_name = _('Document Category')
        verbose_name_plural = _('Document Categories')
        ordering = ['display_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='unique_document_category_per_tenant'
            )
        ]
    
    def __str__(self):
        return self.name


class EnhancedStudentDocument(BaseModel):
    """
    Enhanced student documents with verification workflow
    """
    
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
    ]
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enhanced_documents'
    )
    
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    file = models.FileField(upload_to='student_documents_enhanced/')
    file_size_bytes = models.BigIntegerField(default=0)
    
    document_number = models.CharField(max_length=100, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='documents_uploaded'
    )
    
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents_verified'
    )
    
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
    rejection_reason = models.TextField(blank=True)
    
    expiry_reminder_sent = models.BooleanField(default=False)
    expiry_reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    digital_signature = models.TextField(blank=True, help_text=_('Digital signature hash'))
    
    class Meta:
        db_table = 'enhanced_student_documents'
        verbose_name = _('Enhanced Student Document')
        verbose_name_plural = _('Enhanced Student Documents')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'verification_status']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.category.name}"
    
    def is_expired(self):
        """Check if document is expired."""
        if self.expiry_date:
            from datetime.date import today
            return today() > self.expiry_date
        return False
    
    def days_until_expiry(self):
        """Calculate days until expiry."""
        if self.expiry_date:
            from datetime import date
            today = date.today()
            delta = self.expiry_date - today
            return delta.days
        return None

