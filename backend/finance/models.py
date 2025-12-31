"""
School Accounting & Double Entry Models
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from core.models import BaseModel


class LedgerAccount(BaseModel):
    """
    Chart of Accounts - Double Entry Accounting.
    """
    
    ACCOUNT_TYPE_CHOICES = [
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='ledger_accounts'
    )
    
    code = models.CharField(
        max_length=20,
        help_text="Account code (e.g., 1000, 2000)"
    )
    
    name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'ledger_accounts'
        verbose_name = 'Ledger Account'
        verbose_name_plural = 'Ledger Accounts'
        unique_together = [['tenant', 'code']]
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def get_balance(self):
        """Calculate current balance for this account."""
        from django.db.models import Sum
        
        debits = JournalEntryLine.objects.filter(
            account=self,
            entry__is_posted=True
        ).aggregate(Sum('debit_amount'))['debit_amount__sum'] or Decimal('0.00')
        
        credits = JournalEntryLine.objects.filter(
            account=self,
            entry__is_posted=True
        ).aggregate(Sum('credit_amount'))['credit_amount__sum'] or Decimal('0.00')
        
        # For Assets and Expenses: Debit increases, Credit decreases
        # For Liabilities, Equity, Income: Credit increases, Debit decreases
        if self.account_type in ['ASSET', 'EXPENSE']:
            return debits - credits
        else:
            return credits - debits


class JournalEntry(BaseModel):
    """
    Journal Entry - Header for double-entry transactions.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('POSTED', 'Posted'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='journal_entries'
    )
    
    entry_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True
    )
    
    entry_date = models.DateField()
    description = models.TextField()
    
    reference_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g., FeePayment, SalaryPayment, PettyCash"
    )
    
    reference_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of related transaction"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    
    is_posted = models.BooleanField(default=False)
    posted_at = models.DateTimeField(null=True, blank=True)
    posted_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posted_entries'
    )
    
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_entries'
    )
    
    class Meta:
        db_table = 'journal_entries'
        verbose_name = 'Journal Entry'
        verbose_name_plural = 'Journal Entries'
        ordering = ['-entry_date', '-entry_number']
    
    def __str__(self):
        return f"{self.entry_number} - {self.entry_date}"
    
    def clean(self):
        """Validate that debits equal credits."""
        if self.pk:
            total_debit = self.lines.aggregate(
                models.Sum('debit_amount')
            )['debit_amount__sum'] or Decimal('0.00')
            
            total_credit = self.lines.aggregate(
                models.Sum('credit_amount')
            )['credit_amount__sum'] or Decimal('0.00')
            
            if total_debit != total_credit:
                raise ValidationError(
                    f"Debits ({total_debit}) must equal Credits ({total_credit})"
                )
    
    def post(self, user):
        """Post the journal entry."""
        from django.utils import timezone
        
        self.clean()  # Validate debits = credits
        self.is_posted = True
        self.status = 'POSTED'
        self.posted_at = timezone.now()
        self.posted_by = user
        self.save()


class JournalEntryLine(BaseModel):
    """
    Journal Entry Lines - Individual debit/credit entries.
    """
    
    entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    
    account = models.ForeignKey(
        LedgerAccount,
        on_delete=models.PROTECT,
        related_name='entry_lines'
    )
    
    description = models.CharField(max_length=200)
    
    debit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    credit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    class Meta:
        db_table = 'journal_entry_lines'
        verbose_name = 'Journal Entry Line'
    
    def __str__(self):
        return f"{self.entry.entry_number} - {self.account.name}"
    
    def clean(self):
        """Validate that either debit or credit is set, not both."""
        if self.debit_amount > 0 and self.credit_amount > 0:
            raise ValidationError("Cannot have both debit and credit amounts")
        if self.debit_amount == 0 and self.credit_amount == 0:
            raise ValidationError("Must have either debit or credit amount")


class PettyCashRequest(BaseModel):
    """
    Petty cash requests for small daily expenses.
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PAID', 'Paid'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='petty_cash_requests'
    )
    
    request_number = models.CharField(max_length=50, unique=True)
    request_date = models.DateField()
    
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='petty_cash_requests'
    )
    
    category = models.CharField(
        max_length=100,
        help_text="e.g., Tea, Stationery, Cleaning"
    )
    
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
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
        related_name='approved_petty_cash'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Link to journal entry when paid
    journal_entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    receipt_image = models.ImageField(
        upload_to='finance/petty_cash/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'petty_cash_requests'
        verbose_name = 'Petty Cash Request'
        verbose_name_plural = 'Petty Cash Requests'
        ordering = ['-request_date']
    
    def __str__(self):
        return f"{self.request_number} - {self.category} - ₹{self.amount}"


class VendorPayment(BaseModel):
    """
    Payments to vendors (Books, Uniforms, etc.).
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='vendor_payments'
    )
    
    payment_number = models.CharField(max_length=50, unique=True)
    payment_date = models.DateField()
    
    vendor_name = models.CharField(max_length=200)
    vendor_type = models.CharField(
        max_length=50,
        help_text="e.g., Books, Uniforms, Stationery"
    )
    
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    payment_mode = models.CharField(
        max_length=20,
        choices=[
            ('CASH', 'Cash'),
            ('CHEQUE', 'Cheque'),
            ('BANK_TRANSFER', 'Bank Transfer'),
            ('UPI', 'UPI'),
        ]
    )
    
    payment_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Cheque number, Transaction ID, etc."
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    # Link to journal entry
    journal_entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    invoice_document = models.FileField(
        upload_to='finance/vendor_invoices/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'vendor_payments'
        verbose_name = 'Vendor Payment'
        verbose_name_plural = 'Vendor Payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.payment_number} - {self.vendor_name} - ₹{self.amount}"


class SalaryPayment(BaseModel):
    """
    Staff salary payments - integrated with HR module.
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='salary_payments'
    )
    
    payment_number = models.CharField(max_length=50, unique=True)
    payment_date = models.DateField()
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.CASCADE,
        related_name='salary_payments'
    )
    
    month = models.DateField(help_text="Salary month (first day of month)")
    
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    # Link to journal entry
    journal_entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'salary_payments'
        verbose_name = 'Salary Payment'
        verbose_name_plural = 'Salary Payments'
        unique_together = [['staff', 'month']]
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.month.strftime('%B %Y')} - ₹{self.net_salary}"
