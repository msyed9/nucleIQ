"""
Django Admin for Fee Collection
"""

from django.contrib import admin
from .models import (
    FeeCategory, FeeStructure, FeeAllocation, FeeInvoice,
    FeeInvoiceItem, FeeTransaction, FeeDefaulter, SiblingDiscount
)


@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    """Admin interface for Fee Categories."""
    
    list_display = ['name', 'code', 'tenant', 'is_active']
    list_filter = ['is_active', 'tenant']
    search_fields = ['name', 'code']


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    """Admin interface for Fee Structures."""
    
    list_display = ['category', 'class_level', 'academic_year', 'amount', 'frequency', 'is_active']
    list_filter = ['academic_year', 'frequency', 'is_active', 'category']
    search_fields = ['class_level']


@admin.register(FeeAllocation)
class FeeAllocationAdmin(admin.ModelAdmin):
    """Admin interface for Fee Allocations."""
    
    list_display = ['student', 'fee_structure', 'get_final_amount', 'is_scholarship', 'is_active']
    list_filter = ['is_scholarship', 'is_active']
    search_fields = ['student__first_name', 'student__last_name']
    
    def get_final_amount(self, obj):
        return f"₹{obj.get_final_amount()}"
    get_final_amount.short_description = 'Final Amount'


@admin.register(FeeInvoice)
class FeeInvoiceAdmin(admin.ModelAdmin):
    """Admin interface for Fee Invoices."""
    
    list_display = ['invoice_number', 'student', 'invoice_date', 'total_amount', 'paid_amount', 'status']
    list_filter = ['status', 'invoice_date', 'is_sibling_consolidated']
    search_fields = ['invoice_number', 'student__first_name', 'student__last_name']
    date_hierarchy = 'invoice_date'


@admin.register(FeeInvoiceItem)
class FeeInvoiceItemAdmin(admin.ModelAdmin):
    """Admin interface for Invoice Items."""
    
    list_display = ['invoice', 'description', 'amount']
    search_fields = ['invoice__invoice_number', 'description']


@admin.register(FeeTransaction)
class FeeTransactionAdmin(admin.ModelAdmin):
    """Admin interface for Fee Transactions."""
    
    list_display = ['transaction_number', 'invoice', 'amount', 'payment_mode', 'transaction_date']
    list_filter = ['payment_mode', 'transaction_date']
    search_fields = ['transaction_number', 'invoice__invoice_number']
    date_hierarchy = 'transaction_date'


@admin.register(FeeDefaulter)
class FeeDefaulterAdmin(admin.ModelAdmin):
    """Admin interface for Fee Defaulters."""
    
    list_display = ['student', 'total_due', 'overdue_days', 'access_stopped', 'reminder_count']
    list_filter = ['access_stopped']
    search_fields = ['student__first_name', 'student__last_name']


@admin.register(SiblingDiscount)
class SiblingDiscountAdmin(admin.ModelAdmin):
    """Admin interface for Sibling Discounts."""
    
    list_display = ['sibling_count', 'discount_percentage', 'tenant', 'is_active']
    list_filter = ['is_active', 'tenant']
