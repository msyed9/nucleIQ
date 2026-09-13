"""
Student Complaints / Issues / Queries models.

A Complaint is a student-linked entry (complaint, issue, or query) that any
authenticated user in the tenant can raise. Visibility is enforced at the
view/permission layer (see permissions.py), not on the model.

Follows the project conventions:
- UUID pk, soft-delete and timestamps come from `core.models.BaseModel`.
- An explicit `tenant` FK (denormalized from the student, like StudentRemark)
  rather than TenantAwareModel, so the row is always tenant-scoped even when
  created outside a request/thread-local context.
- Authorship is tracked with an explicit `created_by` FK (BaseModel has no
  created_by), mirroring `helpdesk.HelpdeskTicket.raised_by`.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel


class Complaint(BaseModel):
    """A complaint, issue, or query logged against a student."""

    TYPE_CHOICES = [
        ('COMPLAINT', 'Complaint'),
        ('ISSUE', 'Issue'),
        ('QUERY', 'Query'),
    ]

    CATEGORY_CHOICES = [
        ('ACADEMIC', 'Academic'),
        ('BEHAVIOUR', 'Behaviour'),
        ('ATTENDANCE', 'Attendance'),
        ('TRANSPORT', 'Transport'),
        ('FEES', 'Fees'),
        ('HEALTH', 'Health'),
        ('DISCIPLINE', 'Discipline'),
        ('FACILITIES', 'Facilities'),
        ('OTHER', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    # Denormalized tenant FK for tenant scoping and RLS. Auto-filled from the
    # student in save() when not set explicitly.
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='complaints',
        help_text=_('Tenant (denormalized from student)'),
    )

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='complaints',
        help_text=_('Student this entry is about (required)'),
    )

    # Optional teacher the entry concerns. Targets Staff to match
    # helpdesk.HelpdeskTicket.assigned_to and timetable.TimetableSlot.teacher.
    teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints_tagged',
        help_text=_('Optional teacher this entry relates to'),
    )

    # Who raised the entry. Always set from request.user in the view.
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='complaints_created',
        help_text=_('User who raised this entry'),
    )

    # Whom it is assigned to for handling (a principal, supervisor, teacher, ...).
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints_assigned',
        help_text=_('User responsible for resolving this entry'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()

    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='COMPLAINT',
        db_index=True,
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        blank=True,
        db_index=True,
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='OPEN',
        db_index=True,
    )

    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:
        db_table = 'complaints'
        verbose_name = _('Complaint')
        verbose_name_plural = _('Complaints')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'created_at'], name='cmplnt_tenant_status_idx'),
            models.Index(fields=['tenant', 'student'], name='cmplnt_tenant_student_idx'),
            models.Index(fields=['tenant', 'assigned_to'], name='cmplnt_tenant_asgn_idx'),
        ]

    def __str__(self):
        return f'[{self.get_type_display()}] {self.title}'

    def save(self, *args, **kwargs):
        # Denormalize tenant from the student when not explicitly provided,
        # mirroring students.StudentRemark.
        if not self.tenant_id and self.student_id:
            self.tenant_id = self.student.tenant_id
        super().save(*args, **kwargs)
