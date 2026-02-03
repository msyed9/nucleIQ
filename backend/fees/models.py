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
    
    # Term-based collection configuration
    number_of_terms = models.IntegerField(
        default=1,
        help_text="Number of terms/installments for collection (1-12)"
    )
    
    # JSON field to store term month configuration
    # Example: {"term_1": [4], "term_2": [7], "term_3": [10]} for quarterly
    # Example: {"term_1": [4, 5, 6], "term_2": [10, 11, 12]} for half-yearly
    term_months = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuration for when each term fee should be collected (month numbers 1-12)"
    )
    
    # Annual fee amount - total fee for the year
    annual_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total annual fee amount (sum of all installments)"
    )
    
    # JSON field to store custom installment amounts
    # Example: {"installment_1": "15000.00", "installment_2": "15000.00", ...}
    installment_amounts = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom amounts for each installment (allows unequal distribution)"
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
        # Ensure we operate with Decimals to avoid float/Decimal issues
        try:
            base_amount = Decimal(str(self.custom_amount)) if self.custom_amount is not None else Decimal(str(self.fee_structure.amount))
        except Exception:
            base_amount = Decimal('0.00')

        # Apply scholarship
        try:
            scholarship_pct = Decimal(str(self.scholarship_percentage or 0))
        except Exception:
            scholarship_pct = Decimal('0')

        if self.is_scholarship and scholarship_pct > 0:
            scholarship_discount = (base_amount * scholarship_pct) / Decimal('100')
            base_amount -= scholarship_discount

        # Apply additional discount
        try:
            discount_amt = Decimal(str(self.discount_amount or 0))
        except Exception:
            discount_amt = Decimal('0')

        final_amount = base_amount - discount_amt
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
    
    # Track payment status per line item
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount paid for this specific fee item"
    )
    
    balance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Remaining balance for this fee item"
    )
    
    class Meta:
        db_table = 'fee_invoice_items'
        verbose_name = 'Invoice Item'
    
    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.description}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate balance
        if self.balance_amount is None:
            self.balance_amount = self.amount - self.paid_amount
        super().save(*args, **kwargs)
    
    def update_payment(self, payment_amount):
        """Update paid amount and recalculate balance."""
        self.paid_amount += payment_amount
        self.balance_amount = self.amount - self.paid_amount
        self.save()


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
        related_name='transactions',
        null=True,
        blank=True,
        help_text="Null for advance payments"
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

    def save(self, *args, **kwargs):
        # Ensure amount is stored as Decimal to avoid mixed-type arithmetic errors
        try:
            self.amount = Decimal(str(self.amount)) if self.amount is not None else Decimal('0.00')
        except Exception:
            self.amount = Decimal('0.00')
        super().save(*args, **kwargs)


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
    
    name = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Name for this discount tier (e.g., '2 Siblings Discount')"
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
        return self.name or f"{self.sibling_count} siblings - {self.discount_percentage}%"


class FeeTransactionItem(BaseModel):
    """
    Tracks how a payment is allocated across different fee categories/invoice items.
    Enables category-wise payment tracking and manual allocation by cashier.
    """
    
    transaction = models.ForeignKey(
        FeeTransaction,
        on_delete=models.CASCADE,
        related_name='items'
    )
    
    invoice_item = models.ForeignKey(
        FeeInvoiceItem,
        on_delete=models.CASCADE,
        related_name='transaction_items'
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount allocated to this fee category in this transaction"
    )
    
    # For advance payments
    is_advance = models.BooleanField(
        default=False,
        help_text="Whether this is an advance payment"
    )
    
    remarks = models.CharField(max_length=200, blank=True)
    
    class Meta:
        db_table = 'fee_transaction_items'
        verbose_name = 'Fee Transaction Item'
        verbose_name_plural = 'Fee Transaction Items'
    
    def __str__(self):
        category = self.invoice_item.fee_allocation.fee_structure.category.name
        return f"{self.transaction.transaction_number} - {category}: ₹{self.amount}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the invoice item's paid amount
        if not self.is_advance:
            self.invoice_item.update_payment(self.amount)


class FeeAdvancePayment(BaseModel):
    """
    Track advance payments for specific fee categories.
    These are payments made before the invoice is generated.
    """
    
    ADVANCE_STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('PARTIALLY_USED', 'Partially Used'),
        ('FULLY_USED', 'Fully Used'),
        ('REFUNDED', 'Refunded'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_advance_payments'
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fee_advance_payments'
    )
    
    fee_category = models.ForeignKey(
        FeeCategory,
        on_delete=models.CASCADE,
        related_name='advance_payments',
        help_text="Fee category for which advance is paid"
    )
    
    transaction = models.ForeignKey(
        FeeTransaction,
        on_delete=models.CASCADE,
        related_name='advance_payments',
        null=True,
        blank=True,
        help_text="Original transaction that created this advance"
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Original advance amount"
    )
    
    used_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount already applied to invoices"
    )
    
    balance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Remaining advance balance"
    )
    
    advance_for_months = models.IntegerField(
        default=1,
        help_text="Number of months this advance covers"
    )
    
    status = models.CharField(
        max_length=20,
        choices=ADVANCE_STATUS_CHOICES,
        default='AVAILABLE'
    )
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'fee_advance_payments'
        verbose_name = 'Fee Advance Payment'
        verbose_name_plural = 'Fee Advance Payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.fee_category.name}: ₹{self.balance_amount}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate balance
        self.balance_amount = self.amount - self.used_amount
        
        # Update status
        if self.used_amount == 0:
            self.status = 'AVAILABLE'
        elif self.used_amount < self.amount:
            self.status = 'PARTIALLY_USED'
        else:
            self.status = 'FULLY_USED'
        
        super().save(*args, **kwargs)
    
    def apply_to_invoice(self, invoice_item, amount_to_apply):
        """Apply advance payment to an invoice item."""
        if amount_to_apply > self.balance_amount:
            amount_to_apply = self.balance_amount
        
        self.used_amount += amount_to_apply
        self.save()
        
        # Update invoice item
        invoice_item.update_payment(amount_to_apply)
        
        return amount_to_apply


class FeeRefund(BaseModel):
    """
    Track refunds for specific fee categories.
    Supports partial refunds and tracks approval workflow.
    """
    
    REFUND_STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('PROCESSED', 'Processed'),
        ('REJECTED', 'Rejected'),
    ]
    
    REFUND_MODE_CHOICES = [
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('ADJUSTMENT', 'Adjusted to Future Fees'),
        ('OTHER', 'Other'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='fee_refunds'
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fee_refunds'
    )
    
    # Link to original transaction or invoice item
    original_transaction = models.ForeignKey(
        FeeTransaction,
        on_delete=models.CASCADE,
        related_name='refunds',
        null=True,
        blank=True,
        help_text="Original transaction being refunded"
    )
    
    invoice_item = models.ForeignKey(
        FeeInvoiceItem,
        on_delete=models.CASCADE,
        related_name='refunds',
        null=True,
        blank=True,
        help_text="Specific fee item being refunded"
    )
    
    fee_category = models.ForeignKey(
        FeeCategory,
        on_delete=models.CASCADE,
        related_name='refunds',
        help_text="Fee category being refunded"
    )
    
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    
    reason = models.TextField(
        help_text="Reason for refund"
    )
    
    status = models.CharField(
        max_length=20,
        choices=REFUND_STATUS_CHOICES,
        default='PENDING'
    )
    
    refund_mode = models.CharField(
        max_length=20,
        choices=REFUND_MODE_CHOICES,
        blank=True
    )
    
    refund_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Cheque number, Bank reference, etc."
    )
    
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='fee_refund_requests'
    )
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fee_refund_approvals'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'fee_refunds'
        verbose_name = 'Fee Refund'
        verbose_name_plural = 'Fee Refunds'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund: {self.student.get_full_name()} - {self.fee_category.name}: ₹{self.refund_amount}"
    
    def approve(self, user):
        """Approve the refund request."""
        from django.utils import timezone
        self.status = 'APPROVED'
        self.approved_by = user
        self.approved_at = timezone.now()
        self.save()
    
    def process(self, refund_mode, reference=''):
        """Process the approved refund."""
        from django.utils import timezone
        if self.status != 'APPROVED':
            raise ValidationError("Only approved refunds can be processed")
        
        self.status = 'PROCESSED'
        self.refund_mode = refund_mode
        self.refund_reference = reference
        self.processed_at = timezone.now()
        self.save()
        
        # Update invoice item if linked
        if self.invoice_item:
            self.invoice_item.paid_amount -= self.refund_amount
            self.invoice_item.balance_amount = self.invoice_item.amount - self.invoice_item.paid_amount
            self.invoice_item.save()
