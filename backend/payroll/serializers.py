"""
Payroll Serializers
"""

from rest_framework import serializers
from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    PayrollCycle, Payslip, PayslipComponent
)


class SalaryComponentSerializer(serializers.ModelSerializer):
    """Serializer for SalaryComponent."""
    
    class Meta:
        model = SalaryComponent
        fields = [
            'id', 'name', 'code', 'component_type', 'calculation_type',
            'default_value', 'is_taxable', 'is_active', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    """Serializer for SalaryStructureComponent."""
    
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    
    class Meta:
        model = SalaryStructureComponent
        fields = ['id', 'component', 'component_name', 'component_type', 'value']


class SalaryStructureSerializer(serializers.ModelSerializer):
    """Serializer for SalaryStructure."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    components = SalaryStructureComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = SalaryStructure
        fields = [
            'id', 'staff', 'staff_name', 'effective_from', 'effective_to',
            'base_salary', 'is_active', 'remarks', 'components',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PayrollCycleSerializer(serializers.ModelSerializer):
    """Serializer for PayrollCycle."""
    
    month_name = serializers.CharField(source='get_month_name', read_only=True)
    processed_by_name = serializers.SerializerMethodField()
    payslip_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PayrollCycle
        fields = [
            'id', 'month', 'month_name', 'year', 'status', 'processed_on',
            'processed_by', 'processed_by_name', 'total_gross',
            'total_deductions', 'total_net', 'remarks', 'payslip_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'processed_on', 'total_gross', 'total_deductions', 'total_net', 'created_at', 'updated_at']
    
    def get_processed_by_name(self, obj):
        return obj.processed_by.get_full_name() if obj.processed_by else None
    
    def get_payslip_count(self, obj):
        return obj.payslips.filter(is_deleted=False).count()


class PayslipComponentSerializer(serializers.ModelSerializer):
    """Serializer for PayslipComponent."""
    
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    
    class Meta:
        model = PayslipComponent
        fields = ['id', 'component', 'component_name', 'component_type', 'amount']


class PayslipSerializer(serializers.ModelSerializer):
    """Serializer for Payslip."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    cycle_month = serializers.CharField(source='payroll_cycle.get_month_name', read_only=True)
    cycle_year = serializers.IntegerField(source='payroll_cycle.year', read_only=True)
    components = PayslipComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Payslip
        fields = [
            'id', 'payroll_cycle', 'cycle_month', 'cycle_year',
            'staff', 'staff_name', 'salary_structure',
            'total_working_days', 'days_present', 'days_absent', 'paid_leaves',
            'base_salary', 'gross_salary', 'total_deductions',
            'loss_of_pay', 'net_salary', 'payslip_pdf', 'remarks',
            'components', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProcessPayrollSerializer(serializers.Serializer):
    """Serializer for processing payroll."""
    
    staff_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text='Optional list of staff IDs to process. If empty, processes all active staff.'
    )
