"""
HR Models - Leave Management System
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from decimal import Decimal
from core.models import TenantAwareModel


class LeaveType(TenantAwareModel):
    """
    Types of leave (Sick, Casual, Earned, etc.)
    """
    
    name = models.CharField(
        max_length=100,
        help_text=_('Leave type name (e.g., Sick Leave)')
    )
    
    code = models.CharField(
        max_length=20,
        help_text=_('Short code (e.g., SL, CL, EL)')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Leave type description')
    )
    
    default_quota = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0.0,
        help_text=_('Default annual quota (days)')
    )
    
    is_paid = models.BooleanField(
        default=True,
        help_text=_('Whether this leave type is paid')
    )
    
    requires_approval = models.BooleanField(
        default=True,
        help_text=_('Whether this leave requires approval')
    )
    
    max_consecutive_days = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('Maximum consecutive days allowed')
    )
    
    carry_forward = models.BooleanField(
        default=False,
        help_text=_('Can unused leave be carried forward')
    )
    
    max_carry_forward = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text=_('Maximum days that can be carried forward')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this leave type is active')
    )
    
    class Meta:
        db_table = 'leave_types'
        verbose_name = _('Leave Type')
        verbose_name_plural = _('Leave Types')
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class LeaveBalance(TenantAwareModel):
    """
    Track leave balance for each staff member
    """
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        related_name='leave_balances',
        help_text=_('Staff member')
    )
    
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name='balances',
        help_text=_('Leave type')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='leave_balances',
        help_text=_('Academic year')
    )
    
    total_quota = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        help_text=_('Total leave quota for the year')
    )
    
    used = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0.0,
        help_text=_('Leave days used')
    )
    
    pending = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0.0,
        help_text=_('Leave days pending approval')
    )
    
    carried_forward = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0.0,
        help_text=_('Leave days carried forward from previous year')
    )
    
    class Meta:
        db_table = 'leave_balances'
        verbose_name = _('Leave Balance')
        verbose_name_plural = _('Leave Balances')
        constraints = [
            models.UniqueConstraint(
                fields=['staff', 'leave_type', 'academic_year'],
                name='unique_leave_balance'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'staff', 'academic_year']),
        ]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.leave_type.name} ({self.academic_year})"
    
    @property
    def available(self):
        """Calculate available leave days."""
        return self.total_quota - self.used - self.pending
    
    def can_apply(self, days):
        """Check if staff can apply for given number of days."""
        return self.available >= Decimal(str(days))


class LeaveApplication(TenantAwareModel):
    """
    Leave application with approval workflow
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        related_name='hr_leave_applications',
        help_text=_('Staff member applying for leave')
    )
    
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name='applications',
        help_text=_('Type of leave')
    )
    
    start_date = models.DateField(
        help_text=_('Leave start date')
    )
    
    end_date = models.DateField(
        help_text=_('Leave end date')
    )
    
    total_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        help_text=_('Total leave days')
    )
    
    reason = models.TextField(
        help_text=_('Reason for leave')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Application status')
    )
    
    applied_on = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the leave was applied')
    )
    
    approved_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leaves',
        help_text=_('Who approved/rejected the leave')
    )
    
    approved_on = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the leave was approved/rejected')
    )
    
    approval_remarks = models.TextField(
        blank=True,
        help_text=_('Remarks from approver')
    )
    
    attachment = models.FileField(
        upload_to='leave_applications/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Supporting document (e.g., medical certificate)')
    )
    
    class Meta:
        db_table = 'leave_applications'
        verbose_name = _('Leave Application')
        verbose_name_plural = _('Leave Applications')
        ordering = ['-applied_on']
        indexes = [
            models.Index(fields=['tenant', 'staff', 'status']),
            models.Index(fields=['status', 'applied_on']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.leave_type.name} ({self.start_date} to {self.end_date})"
    
    def clean(self):
        """Validate leave application."""
        super().clean()
        
        if self.end_date and self.start_date:
            if self.end_date < self.start_date:
                raise ValidationError({
                    'end_date': _('End date must be after start date')
                })
            
            # Calculate total days
            delta = self.end_date - self.start_date
            self.total_days = Decimal(str(delta.days + 1))
            
            # Check max consecutive days
            if self.leave_type.max_consecutive_days:
                if self.total_days > self.leave_type.max_consecutive_days:
                    raise ValidationError({
                        'end_date': _(
                            f'Cannot apply for more than {self.leave_type.max_consecutive_days} '
                            f'consecutive days for {self.leave_type.name}'
                        )
                    })
    
    def submit(self):
        """Submit leave application for approval."""
        if self.status == 'DRAFT':
            self.status = 'PENDING'
            self.applied_on = timezone.now()
            
            # Update leave balance
            try:
                balance = LeaveBalance.objects.get(
                    tenant=self.tenant,
                    staff=self.staff,
                    leave_type=self.leave_type,
                    academic_year__is_active=True
                )
                balance.pending += self.total_days
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass
            
            self.save()
    
    def approve(self, approved_by, remarks=''):
        """Approve leave application."""
        if self.status == 'PENDING':
            self.status = 'APPROVED'
            self.approved_by = approved_by
            self.approved_on = timezone.now()
            self.approval_remarks = remarks
            
            # Update leave balance
            try:
                balance = LeaveBalance.objects.get(
                    tenant=self.tenant,
                    staff=self.staff,
                    leave_type=self.leave_type,
                    academic_year__is_active=True
                )
                balance.pending -= self.total_days
                balance.used += self.total_days
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass
            
            self.save()
    
    def reject(self, rejected_by, remarks=''):
        """Reject leave application."""
        if self.status == 'PENDING':
            self.status = 'REJECTED'
            self.approved_by = rejected_by
            self.approved_on = timezone.now()
            self.approval_remarks = remarks
            
            # Update leave balance
            try:
                balance = LeaveBalance.objects.get(
                    tenant=self.tenant,
                    staff=self.staff,
                    leave_type=self.leave_type,
                    academic_year__is_active=True
                )
                balance.pending -= self.total_days
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass
            
            self.save()
    
    def cancel(self):
        """Cancel leave application."""
        if self.status in ['PENDING', 'APPROVED']:
            old_status = self.status
            self.status = 'CANCELLED'
            
            # Update leave balance
            try:
                balance = LeaveBalance.objects.get(
                    tenant=self.tenant,
                    staff=self.staff,
                    leave_type=self.leave_type,
                    academic_year__is_active=True
                )
                
                if old_status == 'PENDING':
                    balance.pending -= self.total_days
                elif old_status == 'APPROVED':
                    balance.used -= self.total_days
                
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass
            
            self.save()
