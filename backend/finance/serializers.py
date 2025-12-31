"""
Finance Serializers
"""

from rest_framework import serializers
from .models import (
    LedgerAccount, JournalEntry, JournalEntryLine,
    PettyCashRequest, VendorPayment, SalaryPayment
)


class LedgerAccountSerializer(serializers.ModelSerializer):
    """Serializer for Ledger Accounts."""
    
    balance = serializers.DecimalField(
        source='get_balance',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = LedgerAccount
        fields = [
            'id', 'tenant', 'code', 'name', 'account_type', 'parent',
            'description', 'is_active', 'balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JournalEntryLineSerializer(serializers.ModelSerializer):
    """Serializer for Journal Entry Lines."""
    
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = JournalEntryLine
        fields = [
            'id', 'account', 'account_name', 'description',
            'debit_amount', 'credit_amount'
        ]
        read_only_fields = ['id']


class JournalEntrySerializer(serializers.ModelSerializer):
    """Serializer for Journal Entries."""
    
    lines = JournalEntryLineSerializer(many=True, read_only=True)
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'tenant', 'entry_number', 'entry_date', 'description',
            'reference_type', 'reference_id', 'status', 'is_posted',
            'posted_at', 'posted_by', 'created_by', 'lines',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'entry_number', 'is_posted', 'posted_at', 'posted_by', 'created_at', 'updated_at']


class PettyCashRequestSerializer(serializers.ModelSerializer):
    """Serializer for Petty Cash Requests."""
    
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = PettyCashRequest
        fields = [
            'id', 'tenant', 'request_number', 'request_date', 'requested_by',
            'requested_by_name', 'category', 'description', 'amount', 'status',
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            'journal_entry', 'receipt_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'request_number', 'approved_at', 'created_at', 'updated_at']


class VendorPaymentSerializer(serializers.ModelSerializer):
    """Serializer for Vendor Payments."""
    
    class Meta:
        model = VendorPayment
        fields = [
            'id', 'tenant', 'payment_number', 'payment_date', 'vendor_name',
            'vendor_type', 'description', 'amount', 'payment_mode',
            'payment_reference', 'status', 'journal_entry', 'invoice_document',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']


class SalaryPaymentSerializer(serializers.ModelSerializer):
    """Serializer for Salary Payments."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = SalaryPayment
        fields = [
            'id', 'tenant', 'payment_number', 'payment_date', 'staff',
            'staff_name', 'month', 'basic_salary', 'allowances', 'deductions',
            'net_salary', 'status', 'journal_entry', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']
