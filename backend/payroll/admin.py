"""
Payroll Admin Configuration
"""

from django.contrib import admin
from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    PayrollCycle, Payslip, PayslipComponent
)


@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'component_type', 'calculation_type', 'default_value', 'is_taxable', 'is_active']
    list_filter = ['component_type', 'calculation_type', 'is_taxable', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering = ['component_type', 'name']


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ['staff', 'base_salary', 'effective_from', 'effective_to', 'is_active']
    list_filter = ['is_active', 'effective_from']
    search_fields = ['staff__first_name', 'staff__last_name']
    raw_id_fields = ['staff']
    ordering = ['-effective_from']


@admin.register(SalaryStructureComponent)
class SalaryStructureComponentAdmin(admin.ModelAdmin):
    list_display = ['salary_structure', 'component', 'value']
    list_filter = ['component__component_type']
    raw_id_fields = ['salary_structure', 'component']


@admin.register(PayrollCycle)
class PayrollCycleAdmin(admin.ModelAdmin):
    list_display = ['get_month_name', 'year', 'status', 'total_gross', 'total_net', 'processed_on']
    list_filter = ['status', 'year', 'month']
    search_fields = ['remarks']
    readonly_fields = ['processed_on', 'total_gross', 'total_deductions', 'total_net']
    ordering = ['-year', '-month']
    
    def get_month_name(self, obj):
        return obj.get_month_name()
    get_month_name.short_description = 'Month'


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ['staff', 'payroll_cycle', 'base_salary', 'gross_salary', 'loss_of_pay', 'net_salary']
    list_filter = ['payroll_cycle__year', 'payroll_cycle__month']
    search_fields = ['staff__first_name', 'staff__last_name']
    raw_id_fields = ['staff', 'payroll_cycle', 'salary_structure']
    readonly_fields = ['total_working_days', 'days_present', 'days_absent', 'paid_leaves']
    ordering = ['-payroll_cycle__year', '-payroll_cycle__month']


@admin.register(PayslipComponent)
class PayslipComponentAdmin(admin.ModelAdmin):
    list_display = ['payslip', 'component', 'amount']
    list_filter = ['component__component_type']
    raw_id_fields = ['payslip', 'component']
