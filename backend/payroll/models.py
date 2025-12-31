"""
Payroll Models - Salary Structure and Payroll Processing
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from decimal import Decimal
from core.models import TenantAwareModel


class SalaryComponent(TenantAwareModel):
    """
    Salary components (Base, HRA, Transport, Tax, etc.)
    """
    
    COMPONENT_TYPE_CHOICES = [
        ('EARNING', 'Earning'),
        ('DEDUCTION', 'Deduction'),
    ]
    
    CALCULATION_TYPE_CHOICES = [
        ('FIXED', 'Fixed Amount'),
        ('PERCENTAGE', 'Percentage of Base'),
    ]
    
    name = models.CharField(
        max_length=100,
        help_text=_('Component name (e.g., HRA, Transport)')
    )
    
    code = models.CharField(
        max_length=20,
        help_text=_('Short code (e.g., HRA, TA)')
    )
    
    component_type = models.CharField(
        max_length=10,
        choices=COMPONENT_TYPE_CHOICES,
        help_text=_('Earning or Deduction')
    )
    
    calculation_type = models.CharField(
        max_length=10,
        choices=CALCULATION_TYPE_CHOICES,
        help_text=_('How to calculate this component')
    )
    
    default_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text=_('Default value (amount or percentage)')
    )
    
    is_taxable = models.BooleanField(
        default=True,
        help_text=_('Whether this component is taxable')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this component is active')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Component description')
    )
    
    class Meta:
        db_table = 'salary_components'
        verbose_name = _('Salary Component')
        verbose_name_plural = _('Salary Components')
        ordering = ['component_type', 'name']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_component_type_display()})"


class SalaryStructure(TenantAwareModel):
    """
    Salary structure for staff members
    """
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        related_name='salary_structures',
        help_text=_('Staff member')
    )
    
    effective_from = models.DateField(
        help_text=_('Effective from date')
    )
    
    effective_to = models.DateField(
        null=True,
        blank=True,
        help_text=_('Effective to date (null if current)')
    )
    
    base_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Base salary amount')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this structure is active')
    )
    
    remarks = models.TextField(
        blank=True,
        help_text=_('Remarks or notes')
    )
    
    class Meta:
        db_table = 'salary_structures'
        verbose_name = _('Salary Structure')
        verbose_name_plural = _('Salary Structures')
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['tenant', 'staff', 'is_active']),
            models.Index(fields=['effective_from', 'effective_to']),
        ]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.base_salary} (from {self.effective_from})"
    
    def clean(self):
        """Validate salary structure."""
        super().clean()
        
        if self.effective_to and self.effective_from:
            if self.effective_to <= self.effective_from:
                raise ValidationError({
                    'effective_to': _('Effective to date must be after effective from date')
                })


class SalaryStructureComponent(TenantAwareModel):
    """
    Components in a salary structure
    """
    
    salary_structure = models.ForeignKey(
        SalaryStructure,
        on_delete=models.CASCADE,
        related_name='components',
        help_text=_('Salary structure')
    )
    
    component = models.ForeignKey(
        SalaryComponent,
        on_delete=models.CASCADE,
        related_name='structure_components',
        help_text=_('Salary component')
    )
    
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Component value (amount or percentage)')
    )
    
    class Meta:
        db_table = 'salary_structure_components'
        verbose_name = _('Salary Structure Component')
        verbose_name_plural = _('Salary Structure Components')
        constraints = [
            models.UniqueConstraint(
                fields=['salary_structure', 'component'],
                name='unique_structure_component'
            )
        ]
    
    def __str__(self):
        return f"{self.salary_structure.staff.get_full_name()} - {self.component.name}"


class PayrollCycle(TenantAwareModel):
    """
    Monthly payroll cycle
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('PAID', 'Paid'),
    ]
    
    month = models.IntegerField(
        help_text=_('Month (1-12)')
    )
    
    year = models.IntegerField(
        help_text=_('Year')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Payroll cycle status')
    )
    
    processed_on = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When payroll was processed')
    )
    
    processed_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_payrolls',
        help_text=_('Who processed the payroll')
    )
    
    total_gross = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text=_('Total gross salary')
    )
    
    total_deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text=_('Total deductions')
    )
    
    total_net = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text=_('Total net salary')
    )
    
    remarks = models.TextField(
        blank=True,
        help_text=_('Remarks or notes')
    )
    
    class Meta:
        db_table = 'payroll_cycles'
        verbose_name = _('Payroll Cycle')
        verbose_name_plural = _('Payroll Cycles')
        ordering = ['-year', '-month']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'month', 'year'],
                name='unique_payroll_cycle'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'year', 'month']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.get_month_name()} {self.year}"
    
    def get_month_name(self):
        """Get month name."""
        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        return months[self.month - 1] if 1 <= self.month <= 12 else 'Unknown'


class Payslip(TenantAwareModel):
    """
    Individual payslip for a staff member
    """
    
    payroll_cycle = models.ForeignKey(
        PayrollCycle,
        on_delete=models.CASCADE,
        related_name='payslips',
        help_text=_('Payroll cycle')
    )
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        related_name='payslips',
        help_text=_('Staff member')
    )
    
    salary_structure = models.ForeignKey(
        SalaryStructure,
        on_delete=models.SET_NULL,
        null=True,
        related_name='payslips',
        help_text=_('Salary structure used')
    )
    
    # Working days
    total_working_days = models.IntegerField(
        help_text=_('Total working days in month')
    )
    
    days_present = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        help_text=_('Days present')
    )
    
    days_absent = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0.0,
        help_text=_('Days absent (unpaid)')
    )
    
    paid_leaves = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0.0,
        help_text=_('Paid leave days')
    )
    
    # Salary components
    base_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Base salary')
    )
    
    gross_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Gross salary (before deductions)')
    )
    
    total_deductions = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text=_('Total deductions')
    )
    
    loss_of_pay = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text=_('Loss of pay for absences')
    )
    
    net_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Net salary (after deductions)')
    )
    
    # PDF
    payslip_pdf = models.FileField(
        upload_to='payslips/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Generated payslip PDF')
    )
    
    remarks = models.TextField(
        blank=True,
        help_text=_('Remarks or notes')
    )
    
    class Meta:
        db_table = 'payslips'
        verbose_name = _('Payslip')
        verbose_name_plural = _('Payslips')
        ordering = ['-payroll_cycle__year', '-payroll_cycle__month']
        constraints = [
            models.UniqueConstraint(
                fields=['payroll_cycle', 'staff'],
                name='unique_payslip'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'staff']),
            models.Index(fields=['payroll_cycle']),
        ]
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.payroll_cycle}"


class PayslipComponent(TenantAwareModel):
    """
    Individual components in a payslip
    """
    
    payslip = models.ForeignKey(
        Payslip,
        on_delete=models.CASCADE,
        related_name='components',
        help_text=_('Payslip')
    )
    
    component = models.ForeignKey(
        SalaryComponent,
        on_delete=models.CASCADE,
        related_name='payslip_components',
        help_text=_('Salary component')
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Component amount')
    )
    
    class Meta:
        db_table = 'payslip_components'
        verbose_name = _('Payslip Component')
        verbose_name_plural = _('Payslip Components')
    
    def __str__(self):
        return f"{self.payslip.staff.get_full_name()} - {self.component.name}"
