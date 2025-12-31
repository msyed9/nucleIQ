"""
Django Admin for Finance
"""

from django.contrib import admin
from .models import (
    LedgerAccount, JournalEntry, JournalEntryLine,
    PettyCashRequest, VendorPayment, SalaryPayment
)


class JournalEntryLineInline(admin.TabularInline):
    model = JournalEntryLine
    extra = 2


@admin.register(LedgerAccount)
class LedgerAccountAdmin(admin.ModelAdmin):
    """Admin interface for Ledger Accounts."""
    
    list_display = ['code', 'name', 'account_type', 'parent', 'is_active']
    list_filter = ['account_type', 'is_active']
    search_fields = ['code', 'name']
    ordering = ['code']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    """Admin interface for Journal Entries."""
    
    list_display = ['entry_number', 'entry_date', 'description', 'status', 'is_posted']
    list_filter = ['status', 'is_posted', 'entry_date']
    search_fields = ['entry_number', 'description']
    date_hierarchy = 'entry_date'
    inlines = [JournalEntryLineInline]
    readonly_fields = ['posted_at', 'posted_by']


@admin.register(PettyCashRequest)
class PettyCashRequestAdmin(admin.ModelAdmin):
    """Admin interface for Petty Cash Requests."""
    
    list_display = ['request_number', 'request_date', 'category', 'amount', 'status', 'requested_by']
    list_filter = ['status', 'category', 'request_date']
    search_fields = ['request_number', 'description']
    date_hierarchy = 'request_date'
    readonly_fields = ['approved_at']


@admin.register(VendorPayment)
class VendorPaymentAdmin(admin.ModelAdmin):
    """Admin interface for Vendor Payments."""
    
    list_display = ['payment_number', 'payment_date', 'vendor_name', 'vendor_type', 'amount', 'status']
    list_filter = ['status', 'vendor_type', 'payment_mode', 'payment_date']
    search_fields = ['payment_number', 'vendor_name', 'description']
    date_hierarchy = 'payment_date'


@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    """Admin interface for Salary Payments."""
    
    list_display = ['payment_number', 'payment_date', 'staff', 'month', 'net_salary', 'status']
    list_filter = ['status', 'payment_date']
    search_fields = ['payment_number', 'staff__first_name', 'staff__last_name']
    date_hierarchy = 'payment_date'
