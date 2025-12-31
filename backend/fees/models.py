"""
Fee Collection System Models
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from core.models import BaseModel


class FeeCategory(BaseModel):
    """
    Fee categories like Tuition, Transport, Lab, etc.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_categories'
    )
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'fee_categories'
        verbose_name = 'Fee Category'
        verbose_name_plural = 'Fee Categories'
        unique_together = [['tenant', 'code']]
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class FeeStructure(BaseModel):
    """
    Fee structure per academic year, class, and category.
    Defines base amounts and frequency.
    """
    
    FREQUENCY_CHOICES = [
        ('ONE_TIME', 'One Time'),
        ('MONTHLY', 'Monthly'),
        ('TERM', 'Term'),
        ('QUARTERLY', 'Quarterly'),
        ('HALF_YEARLY', 'Half Yearly'),
        ('YEARLY', 'Yearly'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_structures'
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='fee_structures'
    )
    
    class_level = models.CharField(
        max_length=50,
        help_text="Class/Grade level (e.g., Grade 1, Grade 2)"
    )
    
    category = models.ForeignKey(
        FeeCategory,
        on_delete=models.CASCADE,
        related_name='structures'
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Base fee amount"
    )
    
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='MONTHLY'
    )
    
    due_day = models.IntegerField(
        default=5,
        help_text="Day of month when fee is due (for recurring fees)"
    )
    
    is_mandatory = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'fee_structures'
        verbose_name = 'Fee Structure'
        verbose_name_plural = 'Fee Structures'
        ordering = ['academic_year', 'class_level', 'category']
    
    def __str__(self):
        return f"{self.class_level} - {self.category} - {self.academic_year}"


class FeeAllocation(BaseModel):
    """
    Assign fee structure to individual students with override capability.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_allocations'
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fee_allocations'
    )
    
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    
    # Override capability
    custom_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Override amount (leave blank to use structure amount)"
    )
    
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Discount amount"
    )
    
    discount_reason = models.CharField(
        max_length=200,
        blank=True,
        help_text="e.g., Special Discount, Sibling Discount"
    )
    
    is_scholarship = models.BooleanField(
        default=False,
        help_text="Mark as scholarship for accounting"
    )
    
    scholarship_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Scholarship percentage"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'fee_allocations'
        verbose_name = 'Fee Allocation'
        verbose_name_plural = 'Fee Allocations'
        unique_together = [['student', 'fee_structure']]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.fee_structure.category}"
    
    def get_final_amount(self):
        """Calculate final amount after discounts."""
        base_amount = self.custom_amount or self.fee_structure.amount
        
        # Apply scholarship
        if self.is_scholarship and self.scholarship_percentage > 0:
            scholarship_discount = base_amount * (self.scholarship_percentage / 100)
            base_amount -= scholarship_discount
        
        # Apply additional discount
        final_amount = base_amount - self.discount_amount
        return max(final_amount, Decimal('0.00'))


class FeeInvoice(BaseModel):
    """
    Generated invoices for students (monthly/term basis).
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('OVERPAID', 'Overpaid'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_invoices'
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fee_invoices'
    )
    
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE
    )
    
    invoice_date = models.DateField()
    due_date = models.DateField()
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    is_sibling_consolidated = models.BooleanField(
        default=False,
        help_text="Part of sibling consolidated invoice"
    )
    
    parent_invoice = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sibling_invoices',
        help_text="Parent invoice for sibling consolidation"
    )
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'fee_invoices'
        verbose_name = 'Fee Invoice'
        verbose_name_plural = 'Fee Invoices'
        ordering = ['-invoice_date']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.student.get_full_name()}"
    
    def update_status(self):
        """Auto-update status based on paid amount."""
        if self.paid_amount == 0:
            self.status = 'PENDING'
        elif self.paid_amount < self.total_amount:
            self.status = 'PARTIAL'
        elif self.paid_amount == self.total_amount:
            self.status = 'PAID'
        elif self.paid_amount > self.total_amount:
            self.status = 'OVERPAID'
        
        self.balance_amount = self.total_amount - self.paid_amount
        self.save()


class FeeInvoiceItem(BaseModel):
    """
    Line items in an invoice.
    """
    
    invoice = models.ForeignKey(
        FeeInvoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    
    fee_allocation = models.ForeignKey(
        FeeAllocation,
        on_delete=models.CASCADE
    )
    
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'fee_invoice_items'
        verbose_name = 'Invoice Item'
    
    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.description}"


class FeeTransaction(BaseModel):
    """
    Payment records for fee invoices.
    """
    
    PAYMENT_MODE_CHOICES = [
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('NET_BANKING', 'Net Banking'),
        ('WALLET', 'Wallet'),
        ('OTHER', 'Other'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_transactions'
    )
    
    invoice = models.ForeignKey(
        FeeInvoice,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    transaction_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True
    )
    
    transaction_date = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODE_CHOICES
    )
    
    payment_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Cheque number, Transaction ID, etc."
    )
    
    collected_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    remarks = models.TextField(blank=True)
    
    # Receipt
    receipt_number = models.CharField(max_length=50, blank=True)
    receipt_pdf = models.FileField(
        upload_to='fees/receipts/',
        null=True,
        blank=True
    )
    
    # Accounting integration
    accounting_entry_created = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'fee_transactions'
        verbose_name = 'Fee Transaction'
        verbose_name_plural = 'Fee Transactions'
        ordering = ['-transaction_date']
    
    def __str__(self):
        return f"{self.transaction_number} - ₹{self.amount}"


class FeeDefaulter(BaseModel):
    """
    Track fee defaulters and access restrictions.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_defaulters'
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fee_defaulter_records'
    )
    
    total_due = models.DecimalField(max_digits=10, decimal_places=2)
    overdue_days = models.IntegerField(default=0)
    
    access_stopped = models.BooleanField(
        default=False,
        help_text="Stop student access to system"
    )
    
    stop_access_date = models.DateField(null=True, blank=True)
    
    last_reminder_sent = models.DateTimeField(null=True, blank=True)
    reminder_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'fee_defaulters'
        verbose_name = 'Fee Defaulter'
        verbose_name_plural = 'Fee Defaulters'
        unique_together = [['tenant', 'student']]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - ₹{self.total_due}"


class SiblingDiscount(BaseModel):
    """
    Sibling discount configuration.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='sibling_discounts'
    )
    
    sibling_count = models.IntegerField(
        help_text="Number of siblings (2, 3, 4+)"
    )
    
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Discount percentage for this sibling count"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'sibling_discounts'
        verbose_name = 'Sibling Discount'
        verbose_name_plural = 'Sibling Discounts'
        unique_together = [['tenant', 'sibling_count']]
    
    def __str__(self):
        return f"{self.sibling_count} siblings - {self.discount_percentage}%"
