"""
Security & Gate Pass Models
"""
from django.db import models
from core.models import TenantAwareModel
from django.utils import timezone
from django.core.validators import RegexValidator

class GatePass(TenantAwareModel):
    """
    Pass for leaving campus
    """
    TYPE_CHOICES = [
        ('EARLY_EXIT', 'Early Exit'),
        ('VISITOR', 'Visitor Entry'),
        ('MATERIAL', 'Material Outward'),
    ]
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('USED', 'Used (Exited)'),
    ]
    
    pass_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='EARLY_EXIT')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, null=True, blank=True)
    visitor_name = models.CharField(max_length=100, blank=True)
    
    reason = models.TextField()
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED')
    
    approved_by = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, related_name='approved_passes')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # QR Code Token (Simple UUID)
    token = models.CharField(max_length=100, unique=True, blank=True)

    class Meta:
        db_table = 'security_gate_passes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'created_at']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        if self.student:
            return f"{self.get_pass_type_display()} - {self.student.get_full_name()}"
        return f"{self.get_pass_type_display()} - {self.visitor_name}"

    def save(self, *args, **kwargs):
        if not self.token:
            import uuid
            self.token = str(uuid.uuid4())
        super().save(*args, **kwargs)

class GateLog(TenantAwareModel):
    """
    Scan Log
    """
    gate_pass = models.ForeignKey(GatePass, on_delete=models.CASCADE, related_name='logs')
    guard = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True) # Guard user
    scanned_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=[('IN', 'In'), ('OUT', 'Out')])
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'security_gate_logs'
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['tenant', 'scanned_at']),
            models.Index(fields=['gate_pass', 'action']),
        ]

    def __str__(self):
        return f"{self.action} - {self.gate_pass} at {self.scanned_at}"


class CampusVisitor(TenantAwareModel):
    """
    Campus Visitor Registration and Tracking
    """
    VISITOR_TYPE_CHOICES = [
        ('PARENT', 'Parent/Guardian'),
        ('VENDOR', 'Vendor/Supplier'),
        ('GUEST', 'Guest Speaker'),
        ('OFFICIAL', 'Government Official'),
        ('CONTRACTOR', 'Contractor'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('OVERSTAYED', 'Overstayed'),
    ]
    
    # Visitor Information
    name = models.CharField(max_length=200)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField(blank=True)
    
    visitor_type = models.CharField(
        max_length=20,
        choices=VISITOR_TYPE_CHOICES,
        default='OTHER'
    )
    
    organization = models.CharField(max_length=200, blank=True)
    id_proof_type = models.CharField(
        max_length=50,
        blank=True,
        help_text='e.g., Aadhar, Passport, Driving License'
    )
    id_proof_number = models.CharField(max_length=100, blank=True)
    
    # Visit Details
    purpose = models.TextField()
    person_to_meet = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campus_visitors',
        help_text='Staff member being visited'
    )
    department_to_visit = models.CharField(max_length=100, blank=True)
    
    # Check-in/Check-out
    check_in_time = models.DateTimeField(auto_now_add=True)
    expected_checkout_time = models.DateTimeField()
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CHECKED_IN'
    )
    
    # Security
    checked_in_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='checked_in_campus_visitors'
    )
    checked_out_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_out_campus_visitors'
    )
    
    # Additional Information
    vehicle_number = models.CharField(max_length=20, blank=True)
    items_carried = models.TextField(
        blank=True,
        help_text='List of items carried (bags, laptops, etc.)'
    )
    photo = models.ImageField(
        upload_to='visitors/photos/%Y/%m/',
        blank=True,
        null=True
    )
    signature = models.ImageField(
        upload_to='visitors/signatures/%Y/%m/',
        blank=True,
        null=True
    )
    
    # Badge/Pass
    badge_number = models.CharField(max_length=50, blank=True)
    badge_returned = models.BooleanField(default=False)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'security_campus_visitors'
        verbose_name = 'Campus Visitor'
        verbose_name_plural = 'Campus Visitors'
        ordering = ['-check_in_time']
        indexes = [
            models.Index(fields=['tenant', 'status', 'check_in_time']),
            models.Index(fields=['phone']),
            models.Index(fields=['person_to_meet', 'check_in_time']),
            models.Index(fields=['check_in_time', 'check_out_time']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.visitor_type} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Auto-update status based on checkout
        if self.check_out_time and self.status == 'CHECKED_IN':
            self.status = 'CHECKED_OUT'
        
        # Check for overstay
        if self.status == 'CHECKED_IN' and not self.check_out_time:
            if timezone.now() > self.expected_checkout_time:
                self.status = 'OVERSTAYED'
        
        super().save(*args, **kwargs)
    
    @property
    def duration(self):
        """Calculate visit duration."""
        if self.check_out_time:
            return self.check_out_time - self.check_in_time
        return timezone.now() - self.check_in_time
    
    @property
    def is_overstayed(self):
        """Check if visitor has overstayed."""
        if self.status == 'CHECKED_IN':
            return timezone.now() > self.expected_checkout_time
        return False


class CampusVisitorLog(TenantAwareModel):
    """
    Activity log for campus visitor movements within campus
    """
    visitor = models.ForeignKey(
        CampusVisitor,
        on_delete=models.CASCADE,
        related_name='activity_logs'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=200)
    action = models.CharField(
        max_length=50,
        help_text='e.g., Entered Building A, Met Principal, etc.'
    )
    logged_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'security_campus_visitor_logs'
        verbose_name = 'Campus Visitor Log'
        verbose_name_plural = 'Campus Visitor Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tenant', 'visitor', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.visitor.name} - {self.action} at {self.timestamp}"
