

class BankAccount(BaseModel):
    """
    Bank Account for reconciliation.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='bank_accounts'
    )
    
    account_name = models.CharField(max_length=200)
    bank_name = models.CharField(max_length=200)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=20, blank=True)
    branch = models.CharField(max_length=200, blank=True)
    
    # Link to ledger account
    ledger_account = models.ForeignKey(
        LedgerAccount,
        on_delete=models.PROTECT,
        related_name='bank_accounts'
    )
    
    opening_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'bank_accounts'
        verbose_name = 'Bank Account'
        verbose_name_plural = 'Bank Accounts'
        ordering = ['account_name']
    
    def __str__(self):
        return f"{self.account_name} - {self.bank_name}"


class BankReconciliation(BaseModel):
    """
    Bank Reconciliation Statement.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('RECONCILED', 'Reconciled'),
        ('APPROVED', 'Approved'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='bank_reconciliations'
    )
    
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name='reconciliations'
    )
    
    reconciliation_date = models.DateField()
    statement_date = models.DateField()
    
    # Balances
    book_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Balance as per books"
    )
    
    bank_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Balance as per bank statement"
    )
    
    # Adjustments
    deposits_in_transit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    outstanding_checks = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    bank_charges = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    interest_earned = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    other_adjustments = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    reconciled_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    
    notes = models.TextField(blank=True)
    
    reconciled_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reconciled_statements'
    )
    
    class Meta:
        db_table = 'bank_reconciliations'
        verbose_name = 'Bank Reconciliation'
        verbose_name_plural = 'Bank Reconciliations'
        ordering = ['-reconciliation_date']
    
    def __str__(self):
        return f"{self.bank_account.account_name} - {self.reconciliation_date}"


class Budget(BaseModel):
    """
    Annual Budget.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    
    name = models.CharField(max_length=200)
    fiscal_year = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    
    total_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    
    notes = models.TextField(blank=True)
    
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_budgets'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'budgets'
        verbose_name = 'Budget'
        verbose_name_plural = 'Budgets'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - {self.fiscal_year}"


class BudgetLine(BaseModel):
    """
    Budget line items for specific accounts.
    """
    
    budget = models.ForeignKey(
        Budget,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    
    account = models.ForeignKey(
        LedgerAccount,
        on_delete=models.PROTECT,
        related_name='budget_lines'
    )
    
    budgeted_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    
    actual_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    variance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'budget_lines'
        verbose_name = 'Budget Line'
        verbose_name_plural = 'Budget Lines'
        unique_together = [['budget', 'account']]
    
    def __str__(self):
        return f"{self.budget.name} - {self.account.name}"
    
    def save(self, *args, **kwargs):
        # Calculate variance
        self.variance = self.budgeted_amount - self.actual_amount
        super().save(*args, **kwargs)
