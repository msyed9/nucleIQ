"""
Tenant Models for NucleiQ Multi-Tenant SaaS
Defines Tenant, TenantBranding, Domain, and AcademicYear models.
"""

import uuid
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from core.models import BaseModel


class Tenant(BaseModel):
    """
    Tenant model representing a school/institution.
    
    Each tenant is isolated using Row Level Security (RLS) at the database level.
    """
    
    PLAN_CHOICES = [
        ('trial', 'Trial'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    ]
    
    name = models.CharField(
        max_length=255,
        help_text="School/Institution name"
    )
    
    subdomain = models.SlugField(
        max_length=63,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$',
                message='Subdomain must contain only lowercase letters, numbers, and hyphens'
            )
        ],
        help_text="Unique subdomain (e.g., 'myschool' for myschool.nucleiq.com)"
    )
    
    # NOTE: Using Shared Schema with Row Level Security (RLS) strategy.
    # All tenants share the same database schema, isolated by tenant_id FK.
    
    plan = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES,
        default='trial',
        help_text="Subscription plan"
    )
    
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this tenant is active"
    )
    
    # Contact information
    admin_email = models.EmailField(
        help_text="Primary admin email for this tenant"
    )
    admin_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Primary admin phone number"
    )
    
    # Subscription details
    trial_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the trial period ends"
    )
    subscription_starts_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the paid subscription started"
    )
    subscription_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the subscription expires"
    )
    
    # Limits
    max_students = models.PositiveIntegerField(
        default=100,
        help_text="Maximum number of students allowed"
    )
    max_staff = models.PositiveIntegerField(
        default=20,
        help_text="Maximum number of staff members allowed"
    )
    
    # Session Configuration
    session_timeout_minutes = models.PositiveIntegerField(
        default=60,
        help_text="Session timeout in minutes (JWT access token lifetime). Minimum: 5, Maximum: 1440 (24 hours)"
    )
    refresh_timeout_days = models.PositiveIntegerField(
        default=7,
        help_text="Refresh token lifetime in days (how long users stay logged in). Minimum: 1, Maximum: 30"
    )
    admin_session_timeout_minutes = models.PositiveIntegerField(
        default=120,
        help_text="Django admin session timeout in minutes. Minimum: 5, Maximum: 1440 (24 hours)"
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional tenant metadata"
    )
    
    # Module Access Control
    # List of available modules that can be enabled for tenants
    AVAILABLE_MODULES = [
        ('dashboard', 'Dashboard (Basic)'),
        ('settings', 'Settings (Basic)'),
        ('users', 'User Management (Basic)'),
        ('students', 'Students (Basic)'),
        ('staff', 'Staff Management'),
        ('attendance', 'Attendance'),
        ('fees', 'Fee Collection'),
        ('finance', 'Finance & Accounting'),
        ('academics', 'Academics & LMS'),
        ('exams', 'Examinations'),
        ('timetable', 'Timetable'),
        ('calendar', 'Calendar & Events'),
        ('communication', 'Communication'),
        ('notifications', 'Notifications'),
        ('reports', 'Reports & Analytics'),
        ('idcards', 'ID Cards'),
        ('library', 'Library'),
        ('inventory', 'Inventory'),
        ('transport', 'Transport'),
        ('hostel', 'Hostel'),
        ('hr', 'HR & Payroll'),
        ('crm', 'CRM & Leads'),
        ('alumni', 'Alumni Management'),
        ('placement', 'Placement'),
        ('cms', 'Website Builder'),
        ('security', 'Security & Visitors'),
        ('helpdesk', 'Helpdesk'),
        ('wellbeing', 'Wellbeing & Trackers'),
        ('admin', 'Admin Tools'),
    ]
    
    # Basic modules that are always included
    BASIC_MODULES = ['dashboard', 'settings', 'users', 'students']
    
    enabled_modules = models.JSONField(
        default=list,
        blank=True,
        help_text="List of enabled module keys for this tenant. Basic modules: dashboard, settings, users, students"
    )
    
    def save(self, *args, **kwargs):
        """Ensure basic modules are always included."""
        if not self.enabled_modules:
            self.enabled_modules = self.BASIC_MODULES.copy()
        else:
            # Ensure basic modules are always present
            for module in self.BASIC_MODULES:
                if module not in self.enabled_modules:
                    self.enabled_modules.append(module)
        super().save(*args, **kwargs)
    
    def get_all_enabled_modules(self):
        """Get all enabled modules including basic ones."""
        modules = list(self.enabled_modules) if self.enabled_modules else []
        for module in self.BASIC_MODULES:
            if module not in modules:
                modules.append(module)
        return modules
    
    def is_module_enabled(self, module_key):
        """Check if a specific module is enabled for this tenant."""
        return module_key in self.get_all_enabled_modules()
    
    class Meta:
        db_table = 'tenants'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.subdomain})"
    
    @property
    def is_trial(self):
        """Check if tenant is in trial period."""
        return self.plan == 'trial'
    
    @property
    def is_trial_expired(self):
        """Check if trial has expired."""
        if self.trial_ends_at:
            return timezone.now() > self.trial_ends_at
        return False
    
    @property
    def is_subscription_active(self):
        """Check if subscription is active."""
        if not self.subscription_ends_at:
            return False
        return timezone.now() < self.subscription_ends_at
    
    def clean(self):
        """Validate tenant constraints."""
        from django.core.exceptions import ValidationError
        
        # Validate session timeout (5 minutes to 24 hours)
        if self.session_timeout_minutes < 5:
            raise ValidationError({
                'session_timeout_minutes': 'Session timeout must be at least 5 minutes'
            })
        if self.session_timeout_minutes > 1440:
            raise ValidationError({
                'session_timeout_minutes': 'Session timeout cannot exceed 1440 minutes (24 hours)'
            })
        
        # Validate refresh timeout (1 to 30 days)
        if self.refresh_timeout_days < 1:
            raise ValidationError({
                'refresh_timeout_days': 'Refresh timeout must be at least 1 day'
            })
        if self.refresh_timeout_days > 30:
            raise ValidationError({
                'refresh_timeout_days': 'Refresh timeout cannot exceed 30 days'
            })
        
        # Validate admin session timeout (5 minutes to 24 hours)
        if self.admin_session_timeout_minutes < 5:
            raise ValidationError({
                'admin_session_timeout_minutes': 'Admin session timeout must be at least 5 minutes'
            })
        if self.admin_session_timeout_minutes > 1440:
            raise ValidationError({
                'admin_session_timeout_minutes': 'Admin session timeout cannot exceed 1440 minutes (24 hours)'
            })


class TenantBranding(BaseModel):
    """
    Tenant branding configuration.
    Stores logos, colors, fonts, and gallery images for customization.
    """
    
    RECEIPT_COPIES_CHOICES = [
        (1, 'Single Copy'),
        (2, 'Two Copies'),
        (3, 'Three Copies'),
    ]
    
    ICON_THEME_CHOICES = [
        ('modern_gradient', 'Modern Gradient'),
        ('minimal_outline', 'Minimal Outline'),
        ('duotone', 'Duotone'),
        ('retro_flat', 'Retro Flat'),
        ('neon_glow', 'Neon Glow'),
        ('classic_solid', 'Classic Solid'),
    ]

    ICON_SET_CHOICES = [
        ('lucide', 'Modern Line'),
        ('heroicons_outline', 'Heroicons Outline'),
        ('heroicons_solid', 'Heroicons Solid'),
        ('phosphor_regular', 'Phosphor Regular'),
        ('phosphor_bold', 'Phosphor Bold'),
        ('phosphor_fill', 'Phosphor Fill'),
        ('tabler', 'Tabler Icons'),
        ('material_outlined', 'Material Outlined'),
        # Additional icon sets supported via react-icons mappings and legacy keys
        ('bootstrap', 'Bootstrap Icons'),
        ('remix', 'Remix Icons'),
        ('boxicons_react', 'Boxicons (React)'),
        ('boxicons', 'Boxicons'),
        ('fontawesome_react', 'Font Awesome (React)'),
        ('fontawesome_solid', 'Font Awesome (Solid)'),
        ('fontawesome_regular', 'Font Awesome (Regular)'),
        ('game_icons', 'Game Icons'),
        ('ionicons_react', 'Ionicons (React)'),
        ('ionicons', 'Ionicons'),
        ('simple_icons_react', 'Simple Icons (React)'),
        ('simple_icons', 'Simple Icons'),
        ('ant_design', 'Ant Design'),
        ('feather', 'Feather Icons'),
        ('eva_icons', 'Eva Icons'),
        # Fun / colorful sets
        ('fun_neon', 'Fun Neon'),
        ('fun_pastel', 'Playful Pastel'),
        ('fun_cartoon', 'Cartoonish'),
        ('fun_emoji', 'Emoji Style'),
    ]
    
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='branding',
        help_text="Tenant this branding belongs to"
    )
    
    # School Information (for receipts and documents)
    school_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="School name for documents and receipts"
    )
    school_address = models.TextField(
        blank=True,
        help_text="School address for documents and receipts"
    )
    school_phone = models.CharField(
        max_length=50,
        blank=True,
        help_text="School phone number for documents"
    )
    school_email = models.EmailField(
        blank=True,
        help_text="School email for documents"
    )
    
    # Logo and visual assets
    logo_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="URL to the school logo"
    )
    favicon_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="URL to the favicon"
    )
    login_background_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="URL to the login page background image"
    )
    email_header_image = models.URLField(
        max_length=500,
        blank=True,
        help_text="URL to the email header image"
    )
    
    # Color scheme
    primary_color = models.CharField(
        max_length=7,
        default='#1976D2',
        validators=[
            RegexValidator(
                regex=r'^#[0-9A-Fa-f]{6}$',
                message='Color must be a valid hex code (e.g., #1976D2)'
            )
        ],
        help_text="Primary brand color (hex code)"
    )
    secondary_color = models.CharField(
        max_length=7,
        default='#424242',
        validators=[
            RegexValidator(
                regex=r'^#[0-9A-Fa-f]{6}$',
                message='Color must be a valid hex code'
            )
        ],
        help_text="Secondary brand color (hex code)"
    )
    sidebar_color = models.CharField(
        max_length=7,
        default='#263238',
        validators=[
            RegexValidator(
                regex=r'^#[0-9A-Fa-f]{6}$',
                message='Color must be a valid hex code'
            )
        ],
        help_text="Sidebar background color (hex code)"
    )
    
    # Typography
    font_family = models.CharField(
        max_length=100,
        default='Inter, sans-serif',
        help_text="Primary font family"
    )
    
    # Gallery images (for login carousel, school profile, etc.)
    gallery_images = models.JSONField(
        default=list,
        blank=True,
        help_text="List of gallery image URLs (JSON array)"
    )
    
    # Fee Receipt Configuration
    receipt_copies = models.IntegerField(
        choices=RECEIPT_COPIES_CHOICES,
        default=3,
        help_text="Number of receipt copies to print on a single A4 page"
    )
    receipt_footer_text = models.TextField(
        blank=True,
        default="This is a computer generated receipt.",
        help_text="Custom footer text for fee receipts"
    )
    
    # Icon/UI Theme
    icon_theme = models.CharField(
        max_length=30,
        choices=ICON_THEME_CHOICES,
        default='modern_gradient',
        help_text="Icon and UI theme style for the tenant"
    )

    icon_set = models.CharField(
        max_length=30,
        choices=ICON_SET_CHOICES,
        default='lucide',
        help_text="Icon library set for the tenant"
    )
    
    # Additional customization
    custom_css = models.TextField(
        blank=True,
        help_text="Custom CSS for advanced styling"
    )
    
    class Meta:
        db_table = 'tenant_branding'
        verbose_name = 'Tenant Branding'
        verbose_name_plural = 'Tenant Brandings'
    
    def __str__(self):
        return f"Branding for {self.tenant.name}"


class Domain(BaseModel):
    """
    Custom domain mapping for tenants.
    Allows schools to use their own domains (e.g., portal.myschool.com).
    """
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='domains',
        help_text="Tenant this domain belongs to"
    )
    
    domain = models.CharField(
        max_length=255,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$',
                message='Enter a valid domain name'
            )
        ],
        help_text="Custom domain (e.g., portal.myschool.com)"
    )
    
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary domain for the tenant"
    )
    
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this domain is active"
    )
    
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the domain was verified"
    )
    
    class Meta:
        db_table = 'tenant_domains'
        verbose_name = 'Domain'
        verbose_name_plural = 'Domains'
        ordering = ['-is_primary', 'domain']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'is_primary'],
                condition=models.Q(is_primary=True),
                name='unique_primary_domain_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.domain} ({'Primary' if self.is_primary else 'Secondary'})"


class AcademicYear(BaseModel):
    """
    Academic Year model for tenant-specific academic calendars.
    
    Note: This does NOT inherit from TenantAwareModel to avoid circular imports.
    The tenant field is defined explicitly here.
    """
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='academic_years',
        db_index=True,
        help_text="Tenant this academic year belongs to"
    )
    
    name = models.CharField(
        max_length=50,
        help_text="Academic year name (e.g., '2024-2025')"
    )
    
    start_date = models.DateField(
        help_text="Start date of the academic year"
    )
    
    end_date = models.DateField(
        help_text="End date of the academic year"
    )
    
    is_active = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this is the currently active academic year"
    )
    
    is_enrollment_open = models.BooleanField(
        default=False,
        help_text="Whether enrollment/admission is open for this year"
    )
    
    is_locked = models.BooleanField(
        default=False,
        help_text="Whether this academic year is locked (for past years)"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Additional description or notes"
    )
    
    class Meta:
        db_table = 'academic_years'
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'
        ordering = ['-start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='unique_academic_year_name_per_tenant'
            ),
            models.UniqueConstraint(
                fields=['tenant', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_academic_year_per_tenant'
            ),
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='end_date_after_start_date'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"
    
    def is_date_active(self):
        """Check if this academic year is currently active based on dates."""
        from datetime import date
        today = date.today()
        return self.start_date <= today <= self.end_date
    
    def get_duration_days(self):
        """Get the duration of the academic year in days."""
        return (self.end_date - self.start_date).days
    
    def get_progress_percentage(self):
        """Get the progress percentage of the academic year (0-100)."""
        from datetime import date
        today = date.today()
        
        if today < self.start_date:
            return 0.0
        elif today > self.end_date:
            return 100.0
        else:
            total_days = self.get_duration_days()
            elapsed_days = (today - self.start_date).days
            return round((elapsed_days / total_days) * 100, 2)
    
    def clean(self):
        """Validate academic year constraints."""
        from django.core.exceptions import ValidationError
        
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")
        
        # Check for overlapping academic years
        if self.tenant_id:
            overlapping = AcademicYear.objects.filter(
                tenant=self.tenant,
                is_deleted=False
            ).exclude(id=self.id).filter(
                models.Q(start_date__lte=self.end_date) &
                models.Q(end_date__gte=self.start_date)
            )
            
            if overlapping.exists():
                raise ValidationError(
                    "Academic year dates overlap with existing academic year"
                )


class AcademicTerm(BaseModel):
    """
    Academic Term/Semester model.
    Divides an academic year into terms (e.g., Term 1, Term 2, Semester 1).
    """
    
    TERM_TYPES = [
        ('TERM', 'Term'),
        ('SEMESTER', 'Semester'),
        ('QUARTER', 'Quarter'),
        ('TRIMESTER', 'Trimester'),
    ]
    
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='terms',
        help_text="Academic year this term belongs to"
    )
    
    name = models.CharField(
        max_length=50,
        help_text="Term name (e.g., 'Term 1', 'Semester 1', 'Q1')"
    )
    
    term_type = models.CharField(
        max_length=20,
        choices=TERM_TYPES,
        default='TERM',
        help_text="Type of term"
    )
    
    term_number = models.IntegerField(
        help_text="Sequential number (1, 2, 3, etc.)"
    )
    
    start_date = models.DateField(
        help_text="Start date of the term"
    )
    
    end_date = models.DateField(
        help_text="End date of the term"
    )
    
    is_active = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this is the currently active term"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Additional description or notes"
    )
    
    class Meta:
        db_table = 'academic_terms'
        verbose_name = 'Academic Term'
        verbose_name_plural = 'Academic Terms'
        ordering = ['academic_year', 'term_number']
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'term_number'],
                name='unique_term_number_per_year'
            ),
            models.UniqueConstraint(
                fields=['academic_year', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_term_per_year'
            ),
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='term_end_date_after_start_date'
            )
        ]
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"
    
    def is_date_active(self):
        """Check if this term is currently active based on dates."""
        from datetime import date
        today = date.today()
        return self.start_date <= today <= self.end_date
    
    def get_duration_days(self):
        """Get the duration of the term in days."""
        return (self.end_date - self.start_date).days
    
    def get_progress_percentage(self):
        """Get the progress percentage of the term (0-100)."""
        from datetime import date
        today = date.today()
        
        if today < self.start_date:
            return 0.0
        elif today > self.end_date:
            return 100.0
        else:
            total_days = self.get_duration_days()
            elapsed_days = (today - self.start_date).days
            return round((elapsed_days / total_days) * 100, 2)
    
    def clean(self):
        """Validate term constraints."""
        from django.core.exceptions import ValidationError
        
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")
        
        # Validate term dates are within academic year
        if self.academic_year_id:
            if self.start_date < self.academic_year.start_date:
                raise ValidationError(
                    "Term start date must be within the academic year"
                )
            
            if self.end_date > self.academic_year.end_date:
                raise ValidationError(
                    "Term end date must be within the academic year"
                )


# ============================================================================
# SCHOOL HIERARCHY MODELS
# ============================================================================

class Department(BaseModel):
    """
    Department/Wing model (e.g., "Primary", "High School", "Science Wing").
    Organizational structure for grouping grade levels.
    """
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='departments',
        help_text="Tenant this department belongs to"
    )
    
    name = models.CharField(
        max_length=100,
        help_text="Department name (e.g., 'Primary', 'High School')"
    )
    
    code = models.CharField(
        max_length=20,
        help_text="Short code (e.g., 'PRI', 'HS')"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Department description"
    )
    
    head_of_department = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments',
        help_text="Head of department (staff member)"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this department is active"
    )
    
    display_order = models.IntegerField(
        default=0,
        help_text="Display order (lower numbers first)"
    )
    
    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['display_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='unique_department_name_per_tenant'
            ),
            models.UniqueConstraint(
                fields=['tenant', 'code'],
                name='unique_department_code_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class GradeLevel(BaseModel):
    """
    Grade Level/Class model (e.g., "Class 1", "Grade 10", "Year 12").
    Represents a specific grade/class in the school.
    """
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='grade_levels',
        help_text="Tenant this grade level belongs to"
    )
    
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='grade_levels',
        null=True,
        blank=True,
        help_text="Department this grade belongs to"
    )
    
    name = models.CharField(
        max_length=50,
        help_text="Grade name (e.g., 'Class 1', 'Grade 10')"
    )
    
    short_name = models.CharField(
        max_length=20,
        help_text="Short name (e.g., '1', '10', 'KG')"
    )
    
    display_order = models.IntegerField(
        help_text="Display order (1, 2, 3... for Class 1, 2, 3...)"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Grade description"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this grade is active"
    )
    
    class Meta:
        db_table = 'grade_levels'
        verbose_name = 'Grade Level'
        verbose_name_plural = 'Grade Levels'
        ordering = ['display_order']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='unique_grade_name_per_tenant'
            ),
            models.UniqueConstraint(
                fields=['tenant', 'display_order'],
                name='unique_grade_order_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"
    
    def get_sections_count(self):
        """Get number of sections in this grade."""
        return self.sections.filter(is_active=True).count()
    
    def get_students_count(self):
        """Get total number of students in this grade (via active enrollments)."""
        from students.models import StudentEnrollment
        return StudentEnrollment.objects.filter(
            tenant=self.tenant,
            section__grade_level=self,
            status='ACTIVE',
            is_deleted=False
        ).count()


class Section(BaseModel):
    """
    Section model (e.g., "A", "B", "Red", "Blue").
    Represents a division within a grade level.
    """
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='sections',
        help_text="Tenant this section belongs to"
    )
    
    grade_level = models.ForeignKey(
        GradeLevel,
        on_delete=models.CASCADE,
        related_name='sections',
        help_text="Grade level this section belongs to"
    )
    
    name = models.CharField(
        max_length=50,
        help_text="Section name (e.g., 'A', 'Red', 'Alpha')"
    )
    
    capacity = models.IntegerField(
        default=40,
        help_text="Maximum number of students allowed"
    )
    
    class_teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='class_teacher_sections',
        help_text="Class teacher for this section"
    )
    
    room_number = models.CharField(
        max_length=50,
        blank=True,
        help_text="Classroom/room number"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this section is active"
    )
    
    display_order = models.IntegerField(
        default=0,
        help_text="Display order within grade"
    )
    
    class Meta:
        db_table = 'sections'
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'
        ordering = ['grade_level', 'display_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['grade_level', 'name'],
                name='unique_section_name_per_grade'
            )
        ]
    
    def __str__(self):
        return f"{self.grade_level.name} - {self.name}"
    
    def get_students_count(self):
        """Get number of students in this section (via active enrollments)."""
        from students.models import StudentEnrollment
        return StudentEnrollment.objects.filter(
            tenant=self.tenant,
            section=self,
            status='ACTIVE',
            is_deleted=False
        ).count()
    
    def get_available_capacity(self):
        """Get remaining capacity."""
        return self.capacity - self.get_students_count()
    
    def is_full(self):
        """Check if section is at capacity."""
        return self.get_students_count() >= self.capacity


class Subject(BaseModel):
    """
    Subject model (e.g., "Mathematics", "Physics", "English").
    Represents a subject taught in the school.
    """
    
    SUBJECT_TYPES = [
        ('THEORY', 'Theory'),
        ('PRACTICAL', 'Practical'),
        ('BOTH', 'Theory & Practical'),
    ]
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='subjects',
        help_text="Tenant this subject belongs to"
    )
    
    name = models.CharField(
        max_length=100,
        help_text="Subject name (e.g., 'Mathematics', 'Physics')"
    )
    
    code = models.CharField(
        max_length=20,
        help_text="Subject code (e.g., 'MATH', 'PHY')"
    )
    
    subject_type = models.CharField(
        max_length=20,
        choices=SUBJECT_TYPES,
        default='THEORY',
        help_text="Type of subject"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Subject description"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this subject is active"
    )
    
    display_order = models.IntegerField(
        default=0,
        help_text="Display order"
    )
    
    class Meta:
        db_table = 'subjects'
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        ordering = ['display_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='unique_subject_name_per_tenant'
            ),
            models.UniqueConstraint(
                fields=['tenant', 'code'],
                name='unique_subject_code_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class ClassSubject(BaseModel):
    """
    Class-Subject mapping model.
    Defines which subjects are taught in which grade levels.
    (e.g., "Class 1 studies Mathematics")
    """
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='class_subjects',
        help_text="Tenant this mapping belongs to"
    )
    
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='class_subjects',
        help_text="Academic year for this mapping"
    )
    
    grade_level = models.ForeignKey(
        GradeLevel,
        on_delete=models.CASCADE,
        related_name='class_subjects',
        help_text="Grade level"
    )
    
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='class_subjects',
        help_text="Subject"
    )
    
    is_mandatory = models.BooleanField(
        default=True,
        help_text="Whether this subject is mandatory for this grade"
    )
    
    is_elective = models.BooleanField(
        default=False,
        help_text="Whether this is an elective subject"
    )
    
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teaching_subjects',
        help_text="Primary teacher for this subject-grade combination"
    )
    
    weekly_periods = models.IntegerField(
        default=5,
        help_text="Number of periods per week"
    )
    
    total_marks = models.IntegerField(
        default=100,
        help_text="Total marks for this subject"
    )
    
    passing_marks = models.IntegerField(
        default=40,
        help_text="Minimum passing marks"
    )
    
    display_order = models.IntegerField(
        default=0,
        help_text="Display order in report cards"
    )
    
    class Meta:
        db_table = 'class_subjects'
        verbose_name = 'Class Subject'
        verbose_name_plural = 'Class Subjects'
        ordering = ['grade_level', 'display_order', 'subject']
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'grade_level', 'subject'],
                name='unique_subject_per_grade_per_year'
            )
        ]
    
    def __str__(self):
        return f"{self.grade_level.name} - {self.subject.name} ({self.academic_year.name})"


class Holiday(BaseModel):
    """
    Holiday model for academic calendar.
    Tracks holidays, breaks, and non-working days.
    """
    
    HOLIDAY_TYPES = [
        ('PUBLIC', 'Public Holiday'),
        ('SCHOOL', 'School Holiday'),
        ('VACATION', 'Vacation/Break'),
        ('EXAM', 'Exam Day'),
        ('EVENT', 'School Event'),
        ('OTHER', 'Other'),
    ]
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='holidays',
        help_text="Tenant this holiday belongs to"
    )
    
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='holidays',
        null=True,
        blank=True,
        help_text="Academic year (optional)"
    )
    
    name = models.CharField(
        max_length=200,
        help_text="Holiday name (e.g., 'Independence Day', 'Summer Break')"
    )
    
    holiday_type = models.CharField(
        max_length=20,
        choices=HOLIDAY_TYPES,
        default='PUBLIC',
        help_text="Type of holiday"
    )
    
    start_date = models.DateField(
        help_text="Start date of holiday"
    )
    
    end_date = models.DateField(
        help_text="End date of holiday (same as start_date for single day)"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Additional description or notes"
    )
    
    is_attendance_blocked = models.BooleanField(
        default=True,
        help_text="Whether attendance marking is blocked on this holiday"
    )
    
    applies_to_students = models.BooleanField(
        default=True,
        help_text="Whether this holiday applies to students"
    )
    
    applies_to_staff = models.BooleanField(
        default=True,
        help_text="Whether this holiday applies to staff"
    )
    
    color = models.CharField(
        max_length=7,
        default='#FF5722',
        help_text="Color for calendar display (hex code)"
    )
    
    class Meta:
        db_table = 'holidays'
        verbose_name = 'Holiday'
        verbose_name_plural = 'Holidays'
        ordering = ['start_date']
        indexes = [
            models.Index(fields=['tenant', 'start_date', 'end_date']),
            models.Index(fields=['academic_year']),
        ]
    
    def __str__(self):
        if self.start_date == self.end_date:
            return f"{self.name} ({self.start_date})"
        return f"{self.name} ({self.start_date} to {self.end_date})"
    
    def get_duration_days(self):
        """Get the duration of the holiday in days."""
        return (self.end_date - self.start_date).days + 1
    
    def is_active_on(self, date):
        """Check if holiday is active on a given date."""
        return self.start_date <= date <= self.end_date
    
    def clean(self):
        """Validate holiday constraints."""
        from django.core.exceptions import ValidationError
        
        if self.end_date < self.start_date:
            raise ValidationError("End date must be on or after start date")


class TenantSettings(BaseModel):
    """
    Tenant Settings model for storing all tenant-level configuration.
    
    Stores settings for:
    - Academic configuration
    - Fee settings
    - Attendance settings
    - Exam settings
    - Email/SMS configuration
    - Security settings
    """
    
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='settings',
        help_text="Tenant these settings belong to"
    )
    
    # Academic Settings
    academic_year_format = models.CharField(
        max_length=50,
        default='YYYY-YYYY',
        help_text="Format for academic year display (e.g., '2024-2025')"
    )
    
    term_system = models.CharField(
        max_length=20,
        choices=[
            ('TERM', 'Term System'),
            ('SEMESTER', 'Semester System'),
            ('QUARTER', 'Quarter System'),
            ('TRIMESTER', 'Trimester System'),
        ],
        default='TERM',
        help_text="Academic term system"
    )
    
    grading_system = models.CharField(
        max_length=20,
        choices=[
            ('PERCENTAGE', 'Percentage'),
            ('GPA', 'GPA (4.0 Scale)'),
            ('LETTER', 'Letter Grades'),
            ('CGPA', 'CGPA (10.0 Scale)'),
        ],
        default='PERCENTAGE',
        help_text="Grading system used"
    )
    
    # Fee Settings
    fee_currency = models.CharField(
        max_length=3,
        default='INR',
        help_text="Currency code (ISO 4217)"
    )
    
    fee_currency_symbol = models.CharField(
        max_length=5,
        default='₹',
        help_text="Currency symbol"
    )
    
    late_fee_enabled = models.BooleanField(
        default=True,
        help_text="Whether late fees are enabled"
    )
    
    late_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Late fee amount"
    )
    
    late_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Late fee as percentage of total"
    )
    
    grace_period_days = models.IntegerField(
        default=7,
        help_text="Grace period before late fee applies (days)"
    )
    
    # Attendance Settings
    attendance_marking_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Default time for marking attendance"
    )
    
    attendance_lock_days = models.IntegerField(
        default=7,
        help_text="Days after which attendance cannot be modified"
    )
    
    minimum_attendance_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=75.00,
        help_text="Minimum required attendance percentage"
    )
    
    late_arrival_threshold_minutes = models.IntegerField(
        default=15,
        help_text="Minutes after which arrival is considered late"
    )
    
    # Student Admission Settings
    auto_generate_admission_number = models.BooleanField(
        default=False,
        help_text="Whether to auto-generate admission numbers"
    )
    
    admission_number_format = models.CharField(
        max_length=100,
        default='ADM{YEAR}{SEQUENCE:04d}',
        help_text="Format for admission number (e.g., 'ADM{YEAR}{SEQUENCE:04d}' -> ADM20240001)"
    )
    
    admission_number_prefix = models.CharField(
        max_length=20,
        default='ADM',
        blank=True,
        help_text="Prefix for admission numbers"
    )
    
    admission_number_sequence = models.IntegerField(
        default=1,
        help_text="Current sequence number for admission numbers"
    )

    
    # Exam Settings
    result_publish_delay_days = models.IntegerField(
        default=7,
        help_text="Days to wait before publishing results"
    )
    
    allow_online_exams = models.BooleanField(
        default=True,
        help_text="Whether online exams are enabled"
    )
    
    exam_proctoring_enabled = models.BooleanField(
        default=False,
        help_text="Whether exam proctoring is enabled"
    )
    
    # Email Configuration
    email_enabled = models.BooleanField(
        default=True,
        help_text="Whether email notifications are enabled"
    )
    
    smtp_host = models.CharField(
        max_length=255,
        blank=True,
        help_text="SMTP server host"
    )
    
    smtp_port = models.IntegerField(
        default=587,
        help_text="SMTP server port"
    )
    
    smtp_username = models.CharField(
        max_length=255,
        blank=True,
        help_text="SMTP username"
    )
    
    smtp_password = models.CharField(
        max_length=255,
        blank=True,
        help_text="SMTP password (encrypted)"
    )
    
    smtp_use_tls = models.BooleanField(
        default=True,
        help_text="Use TLS for SMTP"
    )
    
    from_email = models.EmailField(
        blank=True,
        help_text="Default 'from' email address"
    )
    
    # SMS Configuration
    sms_enabled = models.BooleanField(
        default=False,
        help_text="Whether SMS notifications are enabled"
    )
    
    sms_provider = models.CharField(
        max_length=50,
        choices=[
            ('TWILIO', 'Twilio'),
            ('MSG91', 'MSG91'),
            ('AWS_SNS', 'AWS SNS'),
            ('CUSTOM', 'Custom'),
        ],
        default='TWILIO',
        help_text="SMS provider"
    )
    
    sms_api_key = models.CharField(
        max_length=255,
        blank=True,
        help_text="SMS API key (encrypted)"
    )
    
    sms_sender_id = models.CharField(
        max_length=20,
        blank=True,
        help_text="SMS sender ID"
    )
    
    # WhatsApp Configuration
    whatsapp_enabled = models.BooleanField(
        default=False,
        help_text="Whether WhatsApp notifications are enabled"
    )
    
    whatsapp_api_key = models.CharField(
        max_length=255,
        blank=True,
        help_text="WhatsApp Business API key"
    )
    
    # Security Settings
    password_min_length = models.IntegerField(
        default=8,
        help_text="Minimum password length"
    )
    
    password_require_uppercase = models.BooleanField(
        default=True,
        help_text="Require uppercase letters in password"
    )
    
    password_require_lowercase = models.BooleanField(
        default=True,
        help_text="Require lowercase letters in password"
    )
    
    password_require_numbers = models.BooleanField(
        default=True,
        help_text="Require numbers in password"
    )
    
    password_require_special = models.BooleanField(
        default=False,
        help_text="Require special characters in password"
    )
    
    session_timeout_minutes = models.IntegerField(
        default=60,
        help_text="Session timeout in minutes"
    )
    
    max_login_attempts = models.IntegerField(
        default=5,
        help_text="Maximum failed login attempts before lockout"
    )
    
    lockout_duration_minutes = models.IntegerField(
        default=30,
        help_text="Account lockout duration in minutes"
    )
    
    two_factor_auth_required = models.BooleanField(
        default=False,
        help_text="Whether 2FA is required for all users"
    )
    
    # Backup Settings
    auto_backup_enabled = models.BooleanField(
        default=True,
        help_text="Whether automatic backups are enabled"
    )
    
    backup_frequency_days = models.IntegerField(
        default=1,
        help_text="Backup frequency in days"
    )
    
    backup_retention_days = models.IntegerField(
        default=30,
        help_text="Backup retention period in days"
    )
    
    # Maintenance Mode
    maintenance_mode = models.BooleanField(
        default=False,
        help_text="Whether maintenance mode is active"
    )
    
    maintenance_message = models.TextField(
        blank=True,
        help_text="Message to display during maintenance"
    )
    
    # Additional Settings (JSON for flexibility)
    custom_settings = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional custom settings"
    )
    
    class Meta:
        db_table = 'tenant_settings'
        verbose_name = 'Tenant Settings'
        verbose_name_plural = 'Tenant Settings'
    
    def __str__(self):
        return f"Settings for {self.tenant.name}"
    
    def get_password_policy(self):
        """Get password policy as a dictionary."""
        return {
            'min_length': self.password_min_length,
            'require_uppercase': self.password_require_uppercase,
            'require_lowercase': self.password_require_lowercase,
            'require_numbers': self.password_require_numbers,
            'require_special': self.password_require_special,
        }
    
    def get_notification_config(self):
        """Get notification configuration."""
        return {
            'email': {
                'enabled': self.email_enabled,
                'from_email': self.from_email,
            },
            'sms': {
                'enabled': self.sms_enabled,
                'provider': self.sms_provider,
                'sender_id': self.sms_sender_id,
            },
            'whatsapp': {
                'enabled': self.whatsapp_enabled,
            },
        }

