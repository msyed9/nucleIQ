"""
Attendance Models with Multi-Method Support
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from core.models import BaseModel


class AttendanceRecord(BaseModel):
    """
    Universal Attendance Record for Students and Staff.
    Supports multiple marking methods and smart calendar integration.
    """
    
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
        ('ON_LEAVE', 'On Leave'),
    ]
    
    METHOD_CHOICES = [
        ('MANUAL', 'Manual Entry'),
        ('QR_CODE', 'QR Code Scan'),
        ('FACE', 'Face Recognition'),
        ('RFID', 'RFID Card'),
        ('BIOMETRIC', 'Biometric'),
        ('GEO_TAG', 'Geo Tagging'),
        ('AUTO', 'Auto-Marked'),
    ]
    
    RECORD_TYPE_CHOICES = [
        ('STUDENT', 'Student'),
        ('STAFF', 'Staff'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    # Polymorphic fields - either student or staff
    record_type = models.CharField(
        max_length=10,
        choices=RECORD_TYPE_CHOICES
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='attendance_records',
        null=True,
        blank=True
    )
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        related_name='universal_attendance_records',
        null=True,
        blank=True
    )
    
    # Attendance details
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    
    # Academic year for optimization
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    # Time tracking
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    
    # Geo-location (for geo-tagging method)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    
    # Event integration
    is_event_day = models.BooleanField(
        default=False,
        help_text="Marked on event/non-instructional day"
    )
    event_name = models.CharField(max_length=200, blank=True)
    
    # Marked by
    marked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Additional info
    remarks = models.TextField(blank=True)
    device_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'attendance_records'
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date', 'record_type']),
            models.Index(fields=['academic_year', 'record_type']),
        ]
    
    def __str__(self):
        if self.record_type == 'STUDENT':
            return f"{self.student.get_full_name()} - {self.date} - {self.status}"
        return f"{self.staff.get_full_name()} - {self.date} - {self.status}"
    
    def clean(self):
        # Ensure either student or staff is set
        if self.record_type == 'STUDENT' and not self.student:
            raise ValidationError("Student is required for student attendance")
        if self.record_type == 'STAFF' and not self.staff:
            raise ValidationError("Staff is required for staff attendance")


class AttendanceConfiguration(BaseModel):
    """
    Tenant-specific attendance configuration.
    """
    
    tenant = models.OneToOneField(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='attendance_config'
    )
    
    # Student settings
    school_start_time = models.TimeField(
        default='08:30:00',
        help_text="School start time for students"
    )
    late_threshold_time = models.TimeField(
        default='09:30:00',
        help_text="Time after which students are marked as late"
    )
    student_cutoff_time = models.TimeField(
        default='10:00:00',
        help_text="Auto-absent cutoff time for students"
    )
    student_late_threshold_minutes = models.IntegerField(
        default=15,
        help_text="Minutes after which student is marked late"
    )
    
    # Staff settings
    staff_cutoff_time = models.TimeField(
        default='09:00:00',
        help_text="Auto-absent cutoff time for staff"
    )
    staff_shift_start_time = models.TimeField(
        default='08:30:00',
        help_text="Staff shift start time"
    )
    staff_late_buffer_minutes = models.IntegerField(
        default=10,
        help_text="Buffer minutes before marking staff late"
    )
    late_marks_for_half_day = models.IntegerField(
        default=3,
        help_text="Number of late marks equals one half day"
    )
    
    # Alert settings
    consecutive_absents_alert = models.IntegerField(
        default=3,
        help_text="Alert after N consecutive absents"
    )
    
    # WhatsApp reporting
    enable_monthly_whatsapp_reports = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'attendance_configuration'
        verbose_name = 'Attendance Configuration'
    
    def __str__(self):
        return f"Attendance Config - {self.tenant.name}"


class AttendanceMonthlyAggregate(BaseModel):
    """
    Pre-calculated monthly attendance statistics.
    Updated automatically via Celery signals.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='attendance_aggregates'
    )
    
    record_type = models.CharField(max_length=10)
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='attendance_aggregates'
    )
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='attendance_aggregates'
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE
    )
    
    month = models.DateField(help_text="First day of the month")
    
    # Calculated fields
    total_days = models.IntegerField(default=0)
    working_days = models.IntegerField(default=0)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    late_days = models.IntegerField(default=0)
    half_days = models.IntegerField(default=0)
    leave_days = models.IntegerField(default=0)
    
    attendance_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )
    
    # Report
    report_pdf = models.FileField(
        upload_to='attendance/reports/',
        null=True,
        blank=True
    )
    report_generated_at = models.DateTimeField(null=True, blank=True)
    whatsapp_sent = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'attendance_monthly_aggregates'
        verbose_name = 'Monthly Attendance Aggregate'
    
    def __str__(self):
        if self.record_type == 'STUDENT':
            return f"{self.student.get_full_name()} - {self.month.strftime('%B %Y')}"
        return f"{self.staff.get_full_name()} - {self.month.strftime('%B %Y')}"


class QRCodeToken(BaseModel):
    """
    Daily QR codes for teachers and students.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE
    )
    
    # For teacher QR
    teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='qr_tokens'
    )
    
    # For student QR (permanent on ID card)
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='qr_tokens'
    )
    
    token = models.CharField(max_length=100, unique=True, db_index=True)
    valid_date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'qr_code_tokens'
    
    def __str__(self):
        if self.teacher:
            return f"Teacher QR - {self.teacher.get_full_name()} - {self.valid_date}"
        return f"Student QR - {self.student.get_full_name()}"


class StudentFaceEncoding(BaseModel):
    """
    Stores face encodings for students to enable face recognition attendance.
    Each student can have one active face encoding.
    """
    
    student = models.OneToOneField(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='face_encoding'
    )
    
    # Store the face encoding as JSON (128-dimensional vector from face_recognition library)
    encoding_data = models.JSONField(
        help_text=_('Face encoding vector as JSON array')
    )
    
    # Store a reference image for verification/debugging
    reference_image = models.ImageField(
        upload_to='students/face_encodings/',
        blank=True,
        null=True,
        help_text=_('Reference image used for face encoding')
    )
    
    # Metadata
    encoded_at = models.DateTimeField(auto_now_add=True)
    encoded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='face_enrollments'
    )
    
    # Quality metrics
    confidence_score = models.FloatField(
        default=1.0,
        help_text=_('Confidence score of the face encoding (0-1)')
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'student_face_encodings'
        verbose_name = _('Student Face Encoding')
        verbose_name_plural = _('Student Face Encodings')
    
    def __str__(self):
        return f"Face Encoding - {self.student.get_full_name()}"
    
    def get_encoding_array(self):
        """Return the encoding as a numpy-compatible list."""
        if isinstance(self.encoding_data, list):
            return self.encoding_data
        return None

