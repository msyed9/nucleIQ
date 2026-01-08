"""
Fee Collection Serializers
"""

from rest_framework import serializers
from .models import (
    FeeCategory, FeeStructure, FeeAllocation, FeeInvoice,
    FeeInvoiceItem, FeeTransaction, FeeDefaulter, SiblingDiscount
)


class FeeCategorySerializer(serializers.ModelSerializer):
    """Serializer for Fee Categories."""
    
    class Meta:
        model = FeeCategory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for Fee Structures."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'tenant', 'academic_year', 'class_level', 'category',
            'category_name', 'amount', 'frequency', 'due_day',
            'is_mandatory', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeAllocationSerializer(serializers.ModelSerializer):
    """Serializer for Fee Allocations."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    category_name = serializers.CharField(source='fee_structure.category.name', read_only=True)
    structure_amount = serializers.DecimalField(
        source='fee_structure.amount',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    class_level_name = serializers.CharField(source='fee_structure.class_level', read_only=True)
    final_amount = serializers.DecimalField(
        source='get_final_amount',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = FeeAllocation
        fields = [
            'id', 'tenant', 'student', 'student_name', 'fee_structure',
            'category_name', 'structure_amount', 'class_level_name',
            'custom_amount', 'discount_amount',
            'discount_reason', 'is_scholarship', 'scholarship_percentage',
            'final_amount', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeInvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for Invoice Items."""
    
    class Meta:
        model = FeeInvoiceItem
        fields = ['id', 'fee_allocation', 'description', 'amount']
        read_only_fields = ['id']


class FeeInvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Fee Invoices."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    student_class = serializers.CharField(source='student.current_class', read_only=True)
    student_section = serializers.CharField(source='student.section', read_only=True)
    items = FeeInvoiceItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = FeeInvoice
        fields = [
            'id', 'tenant', 'student', 'student_name', 'student_admission_number',
            'student_class', 'student_section', 'invoice_number',
            'academic_year', 'invoice_date', 'due_date', 'total_amount',
            'paid_amount', 'balance_amount', 'status',
            'is_sibling_consolidated', 'parent_invoice', 'remarks',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'balance_amount', 'created_at', 'updated_at']


class FeeTransactionSerializer(serializers.ModelSerializer):
    """Serializer for Fee Transactions."""
    
    student_name = serializers.CharField(source='invoice.student.get_full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    collected_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FeeTransaction
        fields = [
            'id', 'tenant', 'invoice', 'invoice_number', 'student_name',
            'transaction_number', 'transaction_date', 'amount',
            'payment_mode', 'payment_reference', 'collected_by', 'collected_by_name',
            'remarks', 'receipt_number', 'receipt_pdf',
            'accounting_entry_created', 'created_at'
        ]
        read_only_fields = ['id', 'transaction_number', 'receipt_number', 'transaction_date', 'created_at']
    
    def get_collected_by_name(self, obj):
        if obj.collected_by:
            return obj.collected_by.get_full_name() if hasattr(obj.collected_by, 'get_full_name') else str(obj.collected_by)
        return None


class FeeDefaulterSerializer(serializers.ModelSerializer):
    """Serializer for Fee Defaulters."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_class = serializers.CharField(source='student.current_class', read_only=True)
    
    class Meta:
        model = FeeDefaulter
        fields = [
            'id', 'tenant', 'student', 'student_name', 'student_class',
            'total_due', 'overdue_days', 'access_stopped',
            'stop_access_date', 'last_reminder_sent', 'reminder_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SiblingDiscountSerializer(serializers.ModelSerializer):
    """Serializer for Sibling Discounts."""
    
    class Meta:
        model = SiblingDiscount
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
