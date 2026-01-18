"""
Finance Signals - Auto-post Journal Entries
Automatically creates accounting entries for salary, vendor, and petty cash payments.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .models import SalaryPayment, VendorPayment, PettyCashRequest, LedgerAccount
from .services import AccountingService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=SalaryPayment)
def create_salary_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create a journal entry when a salary payment is marked as PAID.
    Only processes if journal_entry is not already linked.
    """
    # Skip if already has journal entry or status is not PAID
    if instance.journal_entry or instance.status != 'PAID':
        return
    
    # Skip if not a new record in PAID status
    if not created and instance.status != 'PAID':
        return
    
    tenant = instance.tenant
    
    # Check if required accounts exist
    expense_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='5010',
        account_type='EXPENSE',
        is_active=True
    ).first()
    
    cash_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='1010',
        account_type='ASSET',
        is_active=True
    ).first()
    
    if not expense_account or not cash_account:
        logger.warning(
            f"Cannot create journal entry for SalaryPayment {instance.id}: "
            f"Required accounts (5010 Salary Expense, 1010 Cash) not found"
        )
        return
    
    try:
        from users.models import User
        # Get a system user or the first admin for auto-posting
        user = User.objects.filter(tenant=tenant, is_superuser=True).first()
        
        if not user:
            user = User.objects.filter(tenant=tenant, is_staff=True).first()
        
        if not user:
            logger.warning(f"No admin user found for tenant {tenant.id} to post salary entry")
            return
        
        entry = AccountingService.create_salary_payment_entry(
            tenant=tenant,
            salary_payment=instance,
            user=user
        )
        
        logger.info(
            f"Created journal entry {entry.entry_number} for SalaryPayment "
            f"{instance.payment_number} - Amount: {instance.net_salary}"
        )
        
    except Exception as e:
        logger.error(
            f"Failed to create journal entry for SalaryPayment {instance.id}: {str(e)}"
        )


@receiver(post_save, sender=VendorPayment)
def create_vendor_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create a journal entry when a vendor payment is marked as PAID.
    """
    # Skip if already has journal entry
    if instance.journal_entry:
        return
    
    # Only process PAID status
    if instance.status != 'PAID':
        return
    
    tenant = instance.tenant
    
    # Check if required accounts exist
    expense_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='5030',
        account_type='EXPENSE',
        is_active=True
    ).first()
    
    cash_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='1010',
        account_type='ASSET',
        is_active=True
    ).first()
    
    if not expense_account or not cash_account:
        logger.warning(
            f"Cannot create journal entry for VendorPayment {instance.id}: "
            f"Required accounts not found"
        )
        return
    
    try:
        from users.models import User
        user = User.objects.filter(tenant=tenant, is_superuser=True).first()
        
        if not user:
            user = User.objects.filter(tenant=tenant, is_staff=True).first()
        
        if not user:
            return
        
        entry = AccountingService.create_vendor_payment_entry(
            tenant=tenant,
            vendor_payment=instance,
            user=user
        )
        
        logger.info(
            f"Created journal entry {entry.entry_number} for VendorPayment "
            f"{instance.payment_number} - Amount: {instance.amount}"
        )
        
    except Exception as e:
        logger.error(
            f"Failed to create journal entry for VendorPayment {instance.id}: {str(e)}"
        )


@receiver(post_save, sender=PettyCashRequest)
def create_petty_cash_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create a journal entry when a petty cash request is marked as PAID.
    """
    # Skip if already has journal entry
    if instance.journal_entry:
        return
    
    # Only process PAID status
    if instance.status != 'PAID':
        return
    
    tenant = instance.tenant
    
    # Check if required accounts exist
    expense_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='5020',
        account_type='EXPENSE',
        is_active=True
    ).first()
    
    cash_account = LedgerAccount.objects.filter(
        tenant=tenant,
        code='1010',
        account_type='ASSET',
        is_active=True
    ).first()
    
    if not expense_account or not cash_account:
        logger.warning(
            f"Cannot create journal entry for PettyCashRequest {instance.id}: "
            f"Required accounts not found"
        )
        return
    
    try:
        from users.models import User
        user = instance.approved_by or User.objects.filter(
            tenant=tenant, is_superuser=True
        ).first()
        
        if not user:
            return
        
        entry = AccountingService.create_petty_cash_entry(
            tenant=tenant,
            petty_cash_request=instance,
            user=user
        )
        
        logger.info(
            f"Created journal entry {entry.entry_number} for PettyCashRequest "
            f"{instance.request_number} - Amount: {instance.amount}"
        )
        
    except Exception as e:
        logger.error(
            f"Failed to create journal entry for PettyCashRequest {instance.id}: {str(e)}"
        )
