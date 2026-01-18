"""
Fee Transaction Signals - Auto-post Journal Entries
Automatically creates accounting entries when fee payments are processed.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .models import FeeTransaction
from finance.services import AccountingService
from finance.models import LedgerAccount

logger = logging.getLogger(__name__)


@receiver(post_save, sender=FeeTransaction)
def create_fee_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create a journal entry when a fee transaction is saved.
    Only processes if:
    1. Transaction is new (created=True) OR
    2. Transaction exists but hasn't had accounting entry created yet
    """
    # Avoid recursion by checking if entry already created
    if instance.accounting_entry_created:
        return
    
    # Only process if there's a valid amount
    if not instance.amount or instance.amount <= 0:
        return
    
    # Get the tenant from the transaction
    tenant = instance.tenant
    
    # Check if required accounts exist
    cash_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='1010',
        account_type='ASSET',
        is_active=True
    ).first()
    
    income_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='4010',
        account_type='INCOME',
        is_active=True
    ).first()
    
    if not cash_account or not income_account:
        logger.warning(
            f"Cannot create journal entry for FeeTransaction {instance.id}: "
            f"Required accounts (1010 Cash, 4010 Fee Income) not found for tenant {tenant.id}"
        )
        return
    
    try:
        # Get the user who collected the fee
        user = instance.collected_by
        
        if not user:
            logger.warning(
                f"Cannot create journal entry for FeeTransaction {instance.id}: "
                f"No collected_by user specified"
            )
            return
        
        # Create the journal entry
        entry = AccountingService.create_fee_payment_entry(
            tenant=tenant,
            fee_transaction=instance,
            user=user
        )
        
        # Mark transaction as having accounting entry
        # Use update to avoid triggering signal again
        FeeTransaction.objects.filter(pk=instance.pk).update(
            accounting_entry_created=True
        )
        
        logger.info(
            f"Created journal entry {entry.entry_number} for FeeTransaction "
            f"{instance.transaction_number} - Amount: {instance.amount}"
        )
        
    except Exception as e:
        logger.error(
            f"Failed to create journal entry for FeeTransaction {instance.id}: {str(e)}"
        )


def setup_default_accounts(tenant, user=None):
    """
    Create default chart of accounts for a tenant if they don't exist.
    Called during tenant setup or can be called manually.
    """
    default_accounts = [
        # Assets
        {'code': '1000', 'name': 'Assets', 'account_type': 'ASSET', 'parent': None},
        {'code': '1010', 'name': 'Cash', 'account_type': 'ASSET', 'parent': '1000'},
        {'code': '1020', 'name': 'Bank Account', 'account_type': 'ASSET', 'parent': '1000'},
        {'code': '1030', 'name': 'Accounts Receivable', 'account_type': 'ASSET', 'parent': '1000'},
        
        # Liabilities
        {'code': '2000', 'name': 'Liabilities', 'account_type': 'LIABILITY', 'parent': None},
        {'code': '2010', 'name': 'Accounts Payable', 'account_type': 'LIABILITY', 'parent': '2000'},
        {'code': '2020', 'name': 'Advance Fees Received', 'account_type': 'LIABILITY', 'parent': '2000'},
        
        # Equity
        {'code': '3000', 'name': 'Equity', 'account_type': 'EQUITY', 'parent': None},
        {'code': '3010', 'name': 'Retained Earnings', 'account_type': 'EQUITY', 'parent': '3000'},
        
        # Income
        {'code': '4000', 'name': 'Income', 'account_type': 'INCOME', 'parent': None},
        {'code': '4010', 'name': 'Fee Income - Tuition', 'account_type': 'INCOME', 'parent': '4000'},
        {'code': '4020', 'name': 'Fee Income - Transport', 'account_type': 'INCOME', 'parent': '4000'},
        {'code': '4030', 'name': 'Fee Income - Library', 'account_type': 'INCOME', 'parent': '4000'},
        {'code': '4040', 'name': 'Fee Income - Lab', 'account_type': 'INCOME', 'parent': '4000'},
        {'code': '4050', 'name': 'Fee Income - Sports', 'account_type': 'INCOME', 'parent': '4000'},
        {'code': '4060', 'name': 'Fee Income - Other', 'account_type': 'INCOME', 'parent': '4000'},
        
        # Expenses
        {'code': '5000', 'name': 'Expenses', 'account_type': 'EXPENSE', 'parent': None},
        {'code': '5010', 'name': 'Salary Expense', 'account_type': 'EXPENSE', 'parent': '5000'},
        {'code': '5020', 'name': 'Petty Cash Expense', 'account_type': 'EXPENSE', 'parent': '5000'},
        {'code': '5030', 'name': 'Vendor Payments', 'account_type': 'EXPENSE', 'parent': '5000'},
        {'code': '5040', 'name': 'Utilities', 'account_type': 'EXPENSE', 'parent': '5000'},
        {'code': '5050', 'name': 'Maintenance', 'account_type': 'EXPENSE', 'parent': '5000'},
        {'code': '5060', 'name': 'Office Supplies', 'account_type': 'EXPENSE', 'parent': '5000'},
    ]
    
    created_accounts = []
    parent_map = {}
    
    for account_data in default_accounts:
        parent = None
        if account_data['parent']:
            parent = parent_map.get(account_data['parent'])
        
        account, created = LedgerAccount.objects.get_or_create(
            tenant=tenant,
            code=account_data['code'],
            defaults={
                'name': account_data['name'],
                'account_type': account_data['account_type'],
                'parent': parent,
                'is_active': True
            }
        )
        
        parent_map[account_data['code']] = account
        
        if created:
            created_accounts.append(account)
            logger.info(f"Created account: {account.code} - {account.name}")
    
    return created_accounts
