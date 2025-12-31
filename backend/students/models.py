"""
Student Models for 360° Golden Record
Includes Universal Remarks System and comprehensive student data
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel
from django.core.validators import MinValueValidator, MaxValueValidator
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
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True)
    
    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField()
    
    # Family
    father_name = models.CharField(max_length=100)
    father_phone = models.CharField(max_length=20)
    father_email = models.EmailField(blank=True)
    father_occupation = models.CharField(max_length=100, blank=True)
    
    mother_name = models.CharField(max_length=100)
    mother_phone = models.CharField(max_length=20, blank=True)
    mother_email = models.EmailField(blank=True)
    mother_occupation = models.CharField(max_length=100, blank=True)
    
    guardian_name = models.CharField(max_length=100, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    guardian_relation = models.CharField(max_length=50, blank=True)
    
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
    
    def __str__(self):
        return f"{self.admission_number} - {self.get_full_name()}"
    
    def get_full_name(self):
        """Get student's full name."""
        return f"{self.first_name} {self.last_name}"
    
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
    """
    
    DOCUMENT_TYPE_CHOICES = [
        ('BIRTH_CERTIFICATE', 'Birth Certificate'),
        ('TRANSFER_CERTIFICATE', 'Transfer Certificate'),
        ('REPORT_CARD', 'Report Card'),
        ('MEDICAL', 'Medical Document'),
        ('ID_PROOF', 'ID Proof'),
        ('PHOTO', 'Photograph'),
        ('OTHER', 'Other'),
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
    
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='verified_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_documents'
        verbose_name = _('Student Document')
        verbose_name_plural = _('Student Documents')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.title}"


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
