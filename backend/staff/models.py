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
    
    CATEGORY_CHOICES = [
        ('PERSONAL', 'Personal Documents'),
        ('ACADEMIC', 'Academic Certificates'),
        ('EXPERIENCE', 'Experience Certificates'),
        ('ID_PROOFS', 'ID Proofs'),
        ('APPOINTMENT', 'Appointment Letter'),
        ('CONTRACTS', 'Agreements/Contracts'),
        ('APPRAISAL', 'Appraisal Documents'),
        ('TRAINING', 'Training Certificates'),
        ('OTHER', 'Other'),
    ]
    
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
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified'),
        ('EXPIRED', 'Expired'),
        ('REJECTED', 'Rejected'),
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
    
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='OTHER'
    )
    
    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPES
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    document_number = models.CharField(max_length=100, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    issuing_authority = models.CharField(max_length=200, blank=True)
    
    file = models.FileField(
        upload_to='staff/documents/'
    )
    
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_staff_documents'
    )
    
    # Verification fields
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_staff_documents'
    )
    verification_date = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
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
        ('WEEK_OFF', 'Week Off'),
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
    
    is_late = models.BooleanField(default=False)
    is_early_going = models.BooleanField(default=False)
    overtime_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        help_text="Overtime hours worked"
    )
    
    remarks = models.TextField(blank=True)
    
    marked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_staff_attendance'
    )
    
    # Biometric integration fields
    biometric_punch_in = models.TimeField(null=True, blank=True)
    biometric_punch_out = models.TimeField(null=True, blank=True)
    biometric_device_id = models.CharField(max_length=50, blank=True)
    
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


class StaffHealthProfile(BaseModel):
    """
    Staff health profile with basic health information.
    """
    
    staff = models.OneToOneField(
        Staff,
        on_delete=models.CASCADE,
        related_name='health_profile'
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_health_profiles'
    )
    
    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Height in cm"
    )
    
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weight in kg"
    )
    
    bmi = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Body Mass Index (auto-calculated)"
    )
    
    known_allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    
    emergency_contact_medical = models.CharField(max_length=100, blank=True)
    emergency_contact_phone_medical = models.CharField(max_length=20, blank=True)
    
    preferred_hospital = models.CharField(max_length=200, blank=True)
    
    health_insurance_provider = models.CharField(max_length=200, blank=True)
    health_insurance_policy_number = models.CharField(max_length=100, blank=True)
    health_insurance_coverage_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    health_insurance_policy_expiry = models.DateField(null=True, blank=True)
    health_insurance_policy_document = models.FileField(
        upload_to='staff/health_insurance/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'staff_health_profiles'
        verbose_name = 'Staff Health Profile'
        verbose_name_plural = 'Staff Health Profiles'
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - Health Profile"
    
    def save(self, *args, **kwargs):
        # Auto-calculate BMI
        if self.height and self.weight:
            height_m = self.height / 100  # convert cm to meters
            self.bmi = self.weight / (height_m * height_m)
        super().save(*args, **kwargs)


class StaffMedicalHistory(BaseModel):
    """
    Track staff medical history and events.
    """
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='medical_history'
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_medical_history'
    )
    
    date = models.DateField()
    condition_illness = models.CharField(max_length=200)
    treatment = models.TextField()
    doctor_hospital = models.CharField(max_length=200, blank=True)
    documents = models.FileField(
        upload_to='staff/medical_history/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'staff_medical_history'
        verbose_name = 'Staff Medical History'
        verbose_name_plural = 'Staff Medical History'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.condition_illness} ({self.date})"


class StaffMedicalCheckup(BaseModel):
    """
    Record periodic health checkups for staff.
    """
    
    CHECKUP_TYPES = [
        ('ANNUAL', 'Annual Checkup'),
        ('PRE_EMPLOYMENT', 'Pre-employment'),
        ('FITNESS', 'Fitness Test'),
        ('ROUTINE', 'Routine Checkup'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('FIT', 'Fit'),
        ('UNFIT', 'Unfit'),
        ('PENDING', 'Pending'),
    ]
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='medical_checkups'
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_medical_checkups'
    )
    
    checkup_date = models.DateField()
    checkup_type = models.CharField(max_length=20, choices=CHECKUP_TYPES)
    
    # Vitals
    blood_pressure = models.CharField(max_length=20, blank=True)
    sugar_level = models.CharField(max_length=20, blank=True)
    temperature = models.CharField(max_length=20, blank=True)
    pulse_rate = models.CharField(max_length=20, blank=True)
    oxygen_level = models.CharField(max_length=20, blank=True)
    
    lab_tests_conducted = models.TextField(blank=True)
    reports = models.FileField(
        upload_to='staff/medical_checkups/',
        null=True,
        blank=True
    )
    
    doctors_notes = models.TextField(blank=True)
    fit_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    class Meta:
        db_table = 'staff_medical_checkups'
        verbose_name = 'Staff Medical Checkup'
        verbose_name_plural = 'Staff Medical Checkups'
        ordering = ['-checkup_date']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.checkup_type} ({self.checkup_date})"


class StaffVaccination(BaseModel):
    """
    Track staff vaccinations.
    """
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='vaccinations'
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_vaccinations'
    )
    
    vaccine_name = models.CharField(max_length=200)
    date_administered = models.DateField()
    next_due_date = models.DateField(null=True, blank=True)
    certificate = models.FileField(
        upload_to='staff/vaccinations/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'staff_vaccinations'
        verbose_name = 'Staff Vaccination'
        verbose_name_plural = 'Staff Vaccinations'
        ordering = ['-date_administered']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.vaccine_name} ({self.date_administered})"


class StaffInjuryReport(BaseModel):
    """
    Report workplace injuries and accidents.
    """
    
    SEVERITY_CHOICES = [
        ('MINOR', 'Minor'),
        ('MODERATE', 'Moderate'),
        ('SEVERE', 'Severe'),
        ('CRITICAL', 'Critical'),
    ]
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='injury_reports'
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_injury_reports'
    )
    
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    first_aid_provided = models.TextField(blank=True)
    medical_treatment = models.TextField(blank=True)
    compensation_claim = models.BooleanField(default=False)
    
    photos_reports = models.FileField(
        upload_to='staff/injury_reports/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'staff_injury_reports'
        verbose_name = 'Staff Injury Report'
        verbose_name_plural = 'Staff Injury Reports'
        ordering = ['-date', '-time']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - Injury on {self.date}"


class TrainingProgram(BaseModel):
    """
    Staff training and development programs.
    """
    
    CATEGORY_CHOICES = [
        ('TECHNICAL', 'Technical'),
        ('SOFT_SKILLS', 'Soft Skills'),
        ('LEADERSHIP', 'Leadership'),
        ('SAFETY', 'Safety'),
        ('COMPLIANCE', 'Compliance'),
        ('OTHER', 'Other'),
    ]
    
    MODE_CHOICES = [
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('HYBRID', 'Hybrid'),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='training_programs'
    )
    
    program_name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    objectives = models.TextField()
    
    duration_hours = models.DecimalField(max_digits=6, decimal_places=2)
    trainer_name = models.CharField(max_length=200)
    is_external_trainer = models.BooleanField(default=False)
    
    start_date = models.DateField()
    end_date = models.DateField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    venue_link = models.CharField(max_length=500, blank=True)
    
    max_capacity = models.IntegerField()
    is_mandatory = models.BooleanField(default=False)
    cost_per_person = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    material = models.FileField(
        upload_to='training/materials/',
        null=True,
        blank=True
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    class Meta:
        db_table = 'training_programs'
        verbose_name = 'Training Program'
        verbose_name_plural = 'Training Programs'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.program_name} ({self.start_date})"


class TrainingEnrollment(BaseModel):
    """
    Staff enrollment in training programs.
    """
    
    STATUS_CHOICES = [
        ('ENROLLED', 'Enrolled'),
        ('WAITLIST', 'Waitlist'),
        ('COMPLETED', 'Completed'),
        ('DROPPED', 'Dropped'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='training_enrollments'
    )
    
    training_program = models.ForeignKey(
        TrainingProgram,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='training_enrollments'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ENROLLED')
    attendance_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Percentage of sessions attended"
    )
    
    assessment_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    certificate_issued = models.BooleanField(default=False)
    certificate = models.FileField(
        upload_to='training/certificates/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'training_enrollments'
        verbose_name = 'Training Enrollment'
        verbose_name_plural = 'Training Enrollments'
        unique_together = [['training_program', 'staff']]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.training_program.program_name}"


class TrainingFeedback(BaseModel):
    """
    Staff feedback on training programs.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='training_feedbacks'
    )
    
    enrollment = models.OneToOneField(
        TrainingEnrollment,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    
    content_quality_rating = models.IntegerField(help_text="Rating 1-5")
    trainer_effectiveness_rating = models.IntegerField(help_text="Rating 1-5")
    relevance_rating = models.IntegerField(help_text="Rating 1-5")
    would_recommend = models.BooleanField(default=True)
    
    comments = models.TextField(blank=True)
    
    class Meta:
        db_table = 'training_feedbacks'
        verbose_name = 'Training Feedback'
        verbose_name_plural = 'Training Feedbacks'
    
    def __str__(self):
        return f"Feedback - {self.enrollment}"


class AppraisalCycle(BaseModel):
    """
    Define appraisal cycles (annual, mid-year, etc.)
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='appraisal_cycles'
    )
    
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    submission_deadline = models.DateField()
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'appraisal_cycles'
        verbose_name = 'Appraisal Cycle'
        verbose_name_plural = 'Appraisal Cycles'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"


class StaffAppraisal(BaseModel):
    """
    Staff performance appraisal.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SELF_COMPLETED', 'Self Appraisal Completed'),
        ('MANAGER_REVIEW', 'Manager Review'),
        ('COMPLETED', 'Completed'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_appraisals'
    )
    
    appraisal_cycle = models.ForeignKey(
        AppraisalCycle,
        on_delete=models.CASCADE,
        related_name='appraisals'
    )
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='appraisals'
    )
    
    manager = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_appraisals'
    )
    
    # Self ratings (JSON: {parameter: rating})
    self_ratings = models.JSONField(default=dict, blank=True)
    self_achievements = models.TextField(blank=True)
    self_goals = models.TextField(blank=True)
    training_needs = models.TextField(blank=True)
    self_comments = models.TextField(blank=True)
    
    # Manager ratings
    manager_ratings = models.JSONField(default=dict, blank=True)
    strengths = models.TextField(blank=True)
    areas_of_improvement = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    promotion_suggested = models.BooleanField(default=False)
    increment_suggested = models.BooleanField(default=False)
    manager_comments = models.TextField(blank=True)
    
    # Final rating
    final_rating = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    meeting_date = models.DateField(null=True, blank=True)
    action_points = models.TextField(blank=True)
    
    class Meta:
        db_table = 'staff_appraisals'
        verbose_name = 'Staff Appraisal'
        verbose_name_plural = 'Staff Appraisals'
        unique_together = [['appraisal_cycle', 'staff']]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.appraisal_cycle.name}"


class StaffGoal(BaseModel):
    """
    Staff goals and KPIs.
    """
    
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='staff_goals'
    )
    
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='goals'
    )
    
    appraisal = models.ForeignKey(
        StaffAppraisal,
        on_delete=models.CASCADE,
        related_name='goals',
        null=True,
        blank=True
    )
    
    goal_description = models.TextField()
    target_date = models.DateField()
    kpis = models.TextField(help_text="Key Performance Indicators")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    progress_percentage = models.IntegerField(default=0)
    
    completion_date = models.DateField(null=True, blank=True)
    achievement_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'staff_goals'
        verbose_name = 'Staff Goal'
        verbose_name_plural = 'Staff Goals'
        ordering = ['target_date']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - Goal ({self.target_date})"
