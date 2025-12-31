"""
Accounting Services
"""

from decimal import Decimal
from datetime import date
from django.utils import timezone
from .models import (
    LedgerAccount, JournalEntry, JournalEntryLine,
    PettyCashRequest, VendorPayment, SalaryPayment
)


class AccountingService:
    """Service for accounting operations."""
    
    @staticmethod
    def generate_entry_number(tenant):
        """Generate unique journal entry number."""
        from django.db.models import Max
        
        today = date.today()
        prefix = f"JE{today.year}{today.month:02d}"
        
        last_entry = JournalEntry.objects.filter(
            tenant=tenant,
            entry_number__startswith=prefix
        ).aggregate(Max('entry_number'))
        
        if last_entry['entry_number__max']:
            last_number = int(last_entry['entry_number__max'][-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        return f"{prefix}{new_number:04d}"
    
    @staticmethod
    def create_fee_payment_entry(tenant, fee_transaction, user):
        """
        Create journal entry for fee payment.
        Dr. Cash/Bank
        Cr. Fee Income
        """
        # Get accounts
        cash_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='1010',
            account_type='ASSET'
        ).first()
        
        income_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='4010',
            account_type='INCOME'
        ).first()
        
        if not cash_account or not income_account:
            raise ValueError("Required accounts not found. Please create Cash (1010) and Fee Income (4010) accounts.")
        
        # Create entry
        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_number=AccountingService.generate_entry_number(tenant),
            entry_date=fee_transaction.transaction_date.date(),
            description=f"Fee payment - {fee_transaction.invoice.student.get_full_name()}",
            reference_type='FeePayment',
            reference_id=fee_transaction.id,
            created_by=user
        )
        
        # Debit cash
        JournalEntryLine.objects.create(
            entry=entry,
            account=cash_account,
            description="Fee received",
            debit_amount=fee_transaction.amount,
            credit_amount=0
        )
        
        # Credit income
        JournalEntryLine.objects.create(
            entry=entry,
            account=income_account,
            description="Fee income",
            debit_amount=0,
            credit_amount=fee_transaction.amount
        )
        
        # Post entry
        entry.post(user)
        
        return entry
    
    @staticmethod
    def create_salary_payment_entry(tenant, salary_payment, user):
        """
        Create journal entry for salary payment.
        Dr. Salary Expense
        Cr. Cash/Bank
        """
        expense_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='5010',
            account_type='EXPENSE'
        ).first()
        
        cash_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='1010',
            account_type='ASSET'
        ).first()
        
        if not expense_account or not cash_account:
            raise ValueError("Required accounts not found. Please create Salary Expense (5010) and Cash (1010) accounts.")
        
        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_number=AccountingService.generate_entry_number(tenant),
            entry_date=salary_payment.payment_date,
            description=f"Salary payment - {salary_payment.staff.get_full_name()}",
            reference_type='SalaryPayment',
            reference_id=salary_payment.id,
            created_by=user
        )
        
        # Debit expense
        JournalEntryLine.objects.create(
            entry=entry,
            account=expense_account,
            description="Salary expense",
            debit_amount=salary_payment.net_salary,
            credit_amount=0
        )
        
        # Credit cash
        JournalEntryLine.objects.create(
            entry=entry,
            account=cash_account,
            description="Salary paid",
            debit_amount=0,
            credit_amount=salary_payment.net_salary
        )
        
        entry.post(user)
        salary_payment.journal_entry = entry
        salary_payment.status = 'PAID'
        salary_payment.save()
        
        return entry
    
    @staticmethod
    def create_petty_cash_entry(tenant, petty_cash_request, user):
        """
        Create journal entry for petty cash payment.
        Dr. Petty Cash Expense
        Cr. Cash
        """
        expense_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='5020',
            account_type='EXPENSE'
        ).first()
        
        cash_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='1010',
            account_type='ASSET'
        ).first()
        
        if not expense_account or not cash_account:
            raise ValueError("Required accounts not found. Please create Petty Cash Expense (5020) and Cash (1010) accounts.")
        
        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_number=AccountingService.generate_entry_number(tenant),
            entry_date=petty_cash_request.request_date,
            description=f"Petty cash - {petty_cash_request.category}: {petty_cash_request.description}",
            reference_type='PettyCash',
            reference_id=petty_cash_request.id,
            created_by=user
        )
        
        # Debit expense
        JournalEntryLine.objects.create(
            entry=entry,
            account=expense_account,
            description=petty_cash_request.category,
            debit_amount=petty_cash_request.amount,
            credit_amount=0
        )
        
        # Credit cash
        JournalEntryLine.objects.create(
            entry=entry,
            account=cash_account,
            description="Petty cash paid",
            debit_amount=0,
            credit_amount=petty_cash_request.amount
        )
        
        entry.post(user)
        petty_cash_request.journal_entry = entry
        petty_cash_request.status = 'PAID'
        petty_cash_request.save()
        
        return entry
    
    @staticmethod
    def create_vendor_payment_entry(tenant, vendor_payment, user):
        """
        Create journal entry for vendor payment.
        Dr. Vendor Expense
        Cr. Cash/Bank
        """
        expense_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='5030',
            account_type='EXPENSE'
        ).first()
        
        cash_account = LedgerAccount.objects.filter(
            tenant=tenant,
            code='1010',
            account_type='ASSET'
        ).first()
        
        if not expense_account or not cash_account:
            raise ValueError("Required accounts not found. Please create Vendor Expense (5030) and Cash (1010) accounts.")
        
        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_number=AccountingService.generate_entry_number(tenant),
            entry_date=vendor_payment.payment_date,
            description=f"Vendor payment - {vendor_payment.vendor_name}: {vendor_payment.description}",
            reference_type='VendorPayment',
            reference_id=vendor_payment.id,
            created_by=user
        )
        
        # Debit expense
        JournalEntryLine.objects.create(
            entry=entry,
            account=expense_account,
            description=f"{vendor_payment.vendor_type} - {vendor_payment.vendor_name}",
            debit_amount=vendor_payment.amount,
            credit_amount=0
        )
        
        # Credit cash
        JournalEntryLine.objects.create(
            entry=entry,
            account=cash_account,
            description="Vendor payment",
            debit_amount=0,
            credit_amount=vendor_payment.amount
        )
        
        entry.post(user)
        vendor_payment.journal_entry = entry
        vendor_payment.status = 'PAID'
        vendor_payment.save()
        
        return entry
