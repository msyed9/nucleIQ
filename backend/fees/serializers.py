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
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for Fee Structures."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'tenant', 'academic_year', 'class_level', 'category',
            'category_name', 'amount', 'annual_amount', 'frequency', 'due_day',
            'number_of_terms', 'term_months', 'installment_amounts',
            'is_mandatory', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
    
    def validate_term_months(self, value):
        """Validate term_months field to ensure valid month numbers."""
        if not value:
            return value
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("term_months must be a dictionary")
        
        all_months = []
        for term_key, months in value.items():
            if not term_key.startswith('term_'):
                raise serializers.ValidationError(f"Invalid term key: {term_key}. Keys must be in format 'term_1', 'term_2', etc.")
            
            if not isinstance(months, list):
                raise serializers.ValidationError(f"Months for {term_key} must be a list")
            
            for month in months:
                if not isinstance(month, int) or month < 1 or month > 12:
                    raise serializers.ValidationError(f"Invalid month {month} in {term_key}. Months must be integers from 1 to 12")
                
                if month in all_months:
                    raise serializers.ValidationError(f"Month {month} is assigned to multiple terms. Each month can only be assigned to one term.")
                all_months.append(month)
        
        return value
    
    def validate(self, data):
        """Cross-field validation for term configuration."""
        frequency = data.get('frequency', self.instance.frequency if self.instance else 'MONTHLY')
        number_of_terms = data.get('number_of_terms', self.instance.number_of_terms if self.instance else 1)
        term_months = data.get('term_months', self.instance.term_months if self.instance else {})
        
        # For term-based frequencies, validate term configuration
        if frequency in ['QUARTERLY', 'HALF_YEARLY', 'TERM']:
            if number_of_terms < 1 or number_of_terms > 12:
                raise serializers.ValidationError({
                    'number_of_terms': 'Number of terms must be between 1 and 12'
                })
            
            # Validate that all terms have at least one month configured
            if term_months:
                for i in range(1, number_of_terms + 1):
                    term_key = f'term_{i}'
                    if term_key not in term_months or not term_months[term_key]:
                        raise serializers.ValidationError({
                            'term_months': f'Term {i} must have at least one month configured'
                        })
        
        return data


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
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']


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
    student_class = serializers.SerializerMethodField()
    student_section = serializers.SerializerMethodField()
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
        read_only_fields = ['id', 'tenant', 'invoice_number', 'balance_amount', 'created_at', 'updated_at']
    
    def get_student_class(self, obj):
        """Get student class name with fallback logic."""
        try:
            # Try current_class relationship first (if it's a ForeignKey to Grade)
            if hasattr(obj.student, 'current_class') and obj.student.current_class:
                if hasattr(obj.student.current_class, 'name'):
                    return obj.student.current_class.name
                return str(obj.student.current_class)
            # Fallback to class_level field (if it's a CharField)
            if hasattr(obj.student, 'class_level') and obj.student.class_level:
                return obj.student.class_level
            return None
        except Exception:
            return None
    
    def get_student_section(self, obj):
        """Get student section name with fallback logic."""
        try:
            # Try current_section relationship first (if it's a ForeignKey to Section)
            if hasattr(obj.student, 'current_section') and obj.student.current_section:
                if hasattr(obj.student.current_section, 'name'):
                    return obj.student.current_section.name
                return str(obj.student.current_section)
            # Fallback to section field (if it's a CharField)
            if hasattr(obj.student, 'section') and obj.student.section:
                return obj.student.section
            return None
        except Exception:
            return None


class FeeTransactionSerializer(serializers.ModelSerializer):
    """Serializer for Fee Transactions."""
    
    student_name = serializers.CharField(source='invoice.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='invoice.student.admission_number', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    collected_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FeeTransaction
        fields = [
            'id', 'tenant', 'invoice', 'invoice_number', 'student_name',
            'student_admission_number', 'transaction_number', 'transaction_date', 'amount',
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
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']


class SiblingDiscountSerializer(serializers.ModelSerializer):
    """Serializer for Sibling Discounts."""
    
    class Meta:
        model = SiblingDiscount
        fields = '__all__'
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
