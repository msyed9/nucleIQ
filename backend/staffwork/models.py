"""
Staff Work models: Lesson Plans, Admin Task templates/instances, Daily Status
Updates with per-student teacher remarks, and Reports.

Conventions (matching the rest of nucleIQ, e.g. the complaints/students apps):
- UUID pk, soft-delete and timestamps come from core.models.BaseModel.
- An explicit `tenant` FK (denormalized for tenant scoping / RLS) rather than
  TenantAwareModel, so rows are always tenant-scoped even when created outside a
  request/thread-local context (Celery task, management command).
- Authorship is an explicit FK (BaseModel has no created_by), pointing at
  users.User so RBAC ownership checks compare against request.user.id directly.
"""

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel


# Roles that can submit a daily status update. Kept as a small fixed set of
# functional buckets (distinct from the tenant-defined users.Role slugs) so the
# UI can branch on "teacher vs. non-teacher" cheaply.
STAFF_ROLE_CHOICES = [
    ('TEACHER', 'Teacher'),
    ('ADMIN', 'Admin'),
    ('FINANCE', 'Finance'),
    ('HR', 'HR'),
    ('FRONT_OFFICE', 'Front Office'),
    ('OTHER', 'Other'),
]


# ---------------------------------------------------------------------------
# Lesson Plans
# ---------------------------------------------------------------------------
class LessonPlan(BaseModel):
    """A teacher's plan for a lesson on a given date."""

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='lesson_plans'
    )
    # Author. A teacher is a User (RBAC ownership compares to request.user.id).
    teacher = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='lesson_plans',
        help_text=_('Teacher who owns this lesson plan'),
    )
    section = models.ForeignKey(
        'tenants.Section', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='lesson_plans',
        help_text=_('Class/section this plan targets'),
    )
    subject = models.ForeignKey(
        'tenants.Subject', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='lesson_plans',
    )
    date = models.DateField(db_index=True)

    topic = models.CharField(max_length=255)
    objectives = models.TextField(blank=True)
    activities = models.TextField(blank=True)
    resources = models.TextField(blank=True)
    homework = models.TextField(blank=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True
    )
    # Users the plan has been explicitly shared with (beyond the RBAC defaults).
    shared_with = models.ManyToManyField(
        'users.User', related_name='shared_lesson_plans', blank=True
    )

    class Meta:
        db_table = 'staffwork_lesson_plans'
        verbose_name = _('Lesson Plan')
        verbose_name_plural = _('Lesson Plans')
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'teacher', 'date'], name='swk_lp_teacher_date_idx'),
            models.Index(fields=['tenant', 'section', 'date'], name='swk_lp_section_date_idx'),
        ]

    def __str__(self):
        return f'{self.topic} ({self.date})'


class LessonPlanAttachment(BaseModel):
    """A file attached to a lesson plan (supports multiple per plan)."""

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='lesson_plan_attachments'
    )
    lesson_plan = models.ForeignKey(
        LessonPlan, on_delete=models.CASCADE, related_name='attachments'
    )
    file = models.FileField(upload_to='staffwork/lesson_plans/%Y/%m/')
    caption = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='uploaded_lesson_plan_attachments'
    )

    class Meta:
        db_table = 'staffwork_lesson_plan_attachments'
        ordering = ['-created_at']

    def __str__(self):
        return self.caption or f'Attachment {self.id}'


# ---------------------------------------------------------------------------
# Admin task templates + generated instances
# ---------------------------------------------------------------------------
class AdminTaskTemplate(BaseModel):
    """Definition of a recurring task that is generated for matching users."""

    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    ]

    DAY_OF_WEEK_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'),
        (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='admin_task_templates'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Which role the task is generated for. FK to the tenant's Role; generation
    # targets every active user holding that role.
    role_scope = models.ForeignKey(
        'users.Role', on_delete=models.CASCADE, related_name='admin_task_templates',
        help_text=_('Role whose members receive this task'),
    )

    frequency = models.CharField(
        max_length=10, choices=FREQUENCY_CHOICES, default='DAILY', db_index=True
    )
    # For WEEKLY templates: which weekday it is due on (0=Mon).
    day_of_week = models.IntegerField(
        choices=DAY_OF_WEEK_CHOICES, null=True, blank=True
    )
    due_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = 'staffwork_admin_task_templates'
        verbose_name = _('Admin Task Template')
        verbose_name_plural = _('Admin Task Templates')
        ordering = ['title']
        indexes = [
            models.Index(fields=['tenant', 'is_active', 'frequency'], name='swk_tmpl_active_freq_idx'),
        ]

    def __str__(self):
        return f'{self.title} [{self.frequency}]'


class AdminTaskInstance(BaseModel):
    """A concrete occurrence of a template (or an ad-hoc task) for one user/day."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('SKIPPED', 'Skipped'),
        ('OVERDUE', 'Overdue'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='admin_task_instances'
    )
    template = models.ForeignKey(
        AdminTaskTemplate, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='instances',
        help_text=_('Source template (null for ad-hoc tasks)'),
    )
    assigned_to = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='admin_task_instances'
    )
    date = models.DateField(db_index=True, help_text=_('Day the task is due'))

    # Snapshot of the title/description so ad-hoc tasks and deleted templates
    # still render meaningfully.
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_time = models.TimeField(null=True, blank=True)

    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default='PENDING', db_index=True
    )
    update_notes = models.TextField(blank=True, help_text=_('What the assignee did'))
    attachment = models.FileField(
        upload_to='staffwork/admin_tasks/%Y/%m/', null=True, blank=True
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'staffwork_admin_task_instances'
        verbose_name = _('Admin Task Instance')
        verbose_name_plural = _('Admin Task Instances')
        ordering = ['-date', 'due_time']
        constraints = [
            models.UniqueConstraint(
                fields=['template', 'assigned_to', 'date'],
                name='uniq_admin_task_per_user_day',
            ),
        ]
        indexes = [
            models.Index(fields=['tenant', 'assigned_to', 'date'], name='swk_ati_user_date_idx'),
            models.Index(fields=['tenant', 'date', 'status'], name='swk_ati_date_status_idx'),
        ]

    def __str__(self):
        return f'{self.title} -> {self.assigned_to_id} ({self.date})'

    def mark_completed(self, notes='', attachment=None):
        self.status = 'COMPLETED'
        self.completed_at = timezone.now()
        if notes:
            self.update_notes = notes
        if attachment is not None:
            self.attachment = attachment
        self.save(update_fields=['status', 'completed_at', 'update_notes', 'attachment', 'updated_at'])


# ---------------------------------------------------------------------------
# Daily status updates (+ per-student teacher remarks)
# ---------------------------------------------------------------------------
class DailyStatusUpdate(BaseModel):
    """A daily status update submitted by a teacher or admin-staff user."""

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('REVIEWED', 'Reviewed'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='daily_status_updates'
    )
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='daily_status_updates'
    )
    role = models.CharField(max_length=20, choices=STAFF_ROLE_CHOICES, db_index=True)
    date = models.DateField(default=timezone.localdate, db_index=True)

    summary = models.TextField(help_text=_('Free-text overview of the day'))
    details = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to='staffwork/daily_updates/%Y/%m/', null=True, blank=True
    )
    related_class = models.ForeignKey(
        'tenants.Section', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='daily_status_updates',
    )

    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default='DRAFT', db_index=True
    )
    reviewed_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_daily_updates',
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'staffwork_daily_status_updates'
        verbose_name = _('Daily Status Update')
        verbose_name_plural = _('Daily Status Updates')
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'date', 'role'], name='swk_dsu_date_role_idx'),
            models.Index(fields=['tenant', 'user', 'date'], name='swk_dsu_user_date_idx'),
            models.Index(fields=['tenant', 'status'], name='swk_dsu_status_idx'),
        ]

    def __str__(self):
        return f'{self.role} update by {self.user_id} on {self.date}'


class StudentDailyRemark(BaseModel):
    """Per-student flags/notes captured inside a teacher's daily update."""

    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='student_daily_remarks'
    )
    daily_update = models.ForeignKey(
        DailyStatusUpdate, on_delete=models.CASCADE, related_name='student_remarks'
    )
    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='daily_remarks'
    )

    did_not_do_homework = models.BooleanField(default=False)
    did_not_complete_classwork = models.BooleanField(default=False)
    was_disruptive = models.BooleanField(default=False)
    was_absent = models.BooleanField(default=False)
    participated_well = models.BooleanField(default=False)

    remark = models.TextField(blank=True)
    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, blank=True,
        help_text=_('Optional severity for negative flags'),
    )

    class Meta:
        db_table = 'staffwork_student_daily_remarks'
        verbose_name = _('Student Daily Remark')
        verbose_name_plural = _('Student Daily Remarks')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['daily_update', 'student'],
                name='uniq_remark_per_update_student',
            ),
        ]
        indexes = [
            models.Index(fields=['tenant', 'student'], name='swk_sdr_student_idx'),
        ]

    def __str__(self):
        return f'Remark for student {self.student_id}'

    @property
    def has_negative_flag(self):
        return any([
            self.did_not_do_homework,
            self.did_not_complete_classwork,
            self.was_disruptive,
        ])


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
class Report(BaseModel):
    """A shareable report file generated by a staff user."""

    tenant = models.ForeignKey(
        'tenants.Tenant', on_delete=models.CASCADE, related_name='staff_reports'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='staffwork/reports/%Y/%m/')
    generated_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, related_name='generated_reports'
    )
    shared_with = models.ManyToManyField(
        'users.User', related_name='shared_reports', blank=True
    )

    class Meta:
        db_table = 'staffwork_reports'
        verbose_name = _('Report')
        verbose_name_plural = _('Reports')
        ordering = ['-created_at']

    def __str__(self):
        return self.title
