"""
Staff Management Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel


class Staff(BaseModel):
    """
    Staff/Employee model with comprehensive information.
    Links to User for authentication and role-based access.
    """
    
    DESIGNATION_CHOICES = [
        ('PRINCIPAL', 'Principal'),
        ('VICE_PRINCIPAL', 'Vice Principal'),
        ('HEAD_TEACHER', 'Head Teacher'),
        ('TEACHER', 'Teacher'),
        ('ASSISTANT_TEACHER', 'Assistant Teacher'),
        ('LIBRARIAN', 'Librarian'),
        ('LAB_ASSISTANT', 'Lab Assistant'),
        ('COUNSELOR', 'Counselor'),
        ('ACCOUNTANT', 'Accountant'),
        ('CLERK', 'Clerk'),
        ('RECEPTIONIST', 'Receptionist'),
        ('SECURITY', 'Security Guard'),
        ('PEON', 'Peon'),
        ('DRIVER', 'Driver'),
        ('OTHER', 'Other'),
    ]
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('TEMPORARY', 'Temporary'),
        ('PART_TIME', 'Part Time'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ON_LEAVE', 'On Leave'),
        ('SUSPENDED', 'Suspended'),
        ('RESIGNED', 'Resigned'),
        ('TERMINATED', 'Terminated'),
        ('RETIRED', 'Retired'),
    ]
    
    # Link to tenant and user
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_members'
    )
    
    user = models.OneToOneField(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_profile',
        help_text="Link to user account for login"
    )
    
    # Basic Information
    employee_id = models.CharField(
        max_length=50,
        help_text="Unique employee ID"
    )
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[
            ('MALE', 'Male'),
            ('FEMALE', 'Female'),
            ('OTHER', 'Other'),
        ],
        blank=True
    )
    
    # Contact Information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='India')
    
    # Employment Details
    designation = models.CharField(
        max_length=50,
        choices=DESIGNATION_CHOICES
    )
    
    department = models.ForeignKey(
        'tenants.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_members'
    )
    
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default='PERMANENT'
    )
    
    joining_date = models.DateField()
    leaving_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )
    
    # Qualifications (JSON field)
    qualifications = models.JSONField(
        default=list,
        blank=True,
        help_text="List of qualifications: [{degree, institution, year, percentage}]"
    )
    
    # Experience
    experience_years = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=0,
        help_text="Total years of experience"
    )
    
    previous_experience = models.JSONField(
        default=list,
        blank=True,
        help_text="Previous work experience: [{organization, position, from_date, to_date}]"
    )
    
    # Salary & Benefits
    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Monthly salary"
    )
    
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_ifsc = models.CharField(max_length=20, blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # Additional Information
    blood_group = models.CharField(
        max_length=5,
        choices=[
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
        ],
        blank=True
    )
    
    photo = models.ImageField(
        upload_to='staff/photos/',
        null=True,
        blank=True
    )
    
    # Government IDs
    aadhar_number = models.CharField(max_length=12, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)
    
    # Teaching specific (if applicable)
    subjects_taught = models.ManyToManyField(
        'tenants.Subject',
        blank=True,
        related_name='teaching_staff'
    )
    
    # Remarks
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'staff'
        verbose_name = 'Staff Member'
        verbose_name_plural = 'Staff Members'
        ordering = ['first_name', 'last_name']
        unique_together = [['tenant', 'employee_id']]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.employee_id})"
    
    def get_full_name(self):
        """Get full name."""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    def get_age(self):
        """Calculate age from date of birth."""
        if not self.date_of_birth:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def get_tenure_years(self):
        """Calculate tenure in years."""
        from datetime import date
        end_date = self.leaving_date or date.today()
        tenure = end_date.year - self.joining_date.year
        if (end_date.month, end_date.day) < (self.joining_date.month, self.joining_date.day):
            tenure -= 1
        return tenure


class StaffDocument(BaseModel):
    """
    Store staff-related documents (contracts, resumes, certificates, etc.)
    """
    
    DOCUMENT_TYPES = [
        ('RESUME', 'Resume/CV'),
        ('CONTRACT', 'Employment Contract'),
        ('CERTIFICATE', 'Educational Certificate'),
        ('EXPERIENCE', 'Experience Letter'),
        ('ID_PROOF', 'ID Proof'),
        ('ADDRESS_PROOF', 'Address Proof'),
        ('PHOTO', 'Photograph'),
        ('OTHER', 'Other'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_documents'
    )
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    
    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPES
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    file = models.FileField(
        upload_to='staff/documents/'
    )
    
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    class Meta:
        db_table = 'staff_documents'
        verbose_name = 'Staff Document'
        verbose_name_plural = 'Staff Documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.title}"


class StaffAttendance(BaseModel):
    """
    Track daily staff attendance.
    """
    
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('HALF_DAY', 'Half Day'),
        ('LATE', 'Late'),
        ('ON_LEAVE', 'On Leave'),
        ('HOLIDAY', 'Holiday'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_attendance'
    )
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    date = models.DateField()
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )
    
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    marked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_staff_attendance'
    )
    
    class Meta:
        db_table = 'staff_attendance'
        verbose_name = 'Staff Attendance'
        verbose_name_plural = 'Staff Attendance'
        ordering = ['-date']
        unique_together = [['staff', 'date']]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.date} - {self.status}"


class StaffLeave(BaseModel):
    """
    Manage staff leave applications.
    """
    
    LEAVE_TYPES = [
        ('CASUAL', 'Casual Leave'),
        ('SICK', 'Sick Leave'),
        ('EARNED', 'Earned Leave'),
        ('MATERNITY', 'Maternity Leave'),
        ('PATERNITY', 'Paternity Leave'),
        ('UNPAID', 'Unpaid Leave'),
        ('COMPENSATORY', 'Compensatory Leave'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_leaves'
    )
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='leave_applications'
    )
    
    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPES
    )
    
    from_date = models.DateField()
    to_date = models.DateField()
    
    total_days = models.IntegerField(default=1)
    
    reason = models.TextField()
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_staff_leaves'
    )
    
    approval_date = models.DateTimeField(null=True, blank=True)
    approval_remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'staff_leaves'
        verbose_name = 'Staff Leave'
        verbose_name_plural = 'Staff Leaves'
        ordering = ['-from_date']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.leave_type} ({self.from_date} to {self.to_date})"
    
    def save(self, *args, **kwargs):
        # Calculate total days
        if self.from_date and self.to_date:
            self.total_days = (self.to_date - self.from_date).days + 1
        super().save(*args, **kwargs)
