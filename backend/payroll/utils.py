"""
Payroll Utilities - Salary Calculator
"""

from decimal import Decimal
from datetime import datetime, timedelta
from django.db.models import Sum, Q
from .models import (
    SalaryStructure, SalaryComponent, PayrollCycle,
    Payslip, PayslipComponent
)


class SalaryCalculator:
    """
    Calculate salary with automatic loss of pay from attendance.
    """
    
    @staticmethod
    def calculate_working_days(year, month):
        """
        Calculate total working days in a month (excluding Sundays).
        """
        from calendar import monthrange
        
        total_days = monthrange(year, month)[1]
        working_days = 0
        
        for day in range(1, total_days + 1):
            date = datetime(year, month, day)
            # Exclude Sundays (weekday 6)
            if date.weekday() != 6:
                working_days += 1
        
        return working_days
    
    @staticmethod
    def get_attendance_data(staff, year, month):
        """
        Get attendance data for a staff member for a given month.
        Returns: (days_present, days_absent, paid_leaves)
        """
        from attendance.models import Attendance
        from hr.models import LeaveApplication
        from calendar import monthrange
        
        total_days = monthrange(year, month)[1]
        start_date = datetime(year, month, 1).date()
        end_date = datetime(year, month, total_days).date()
        
        # Get attendance records
        attendance_records = Attendance.objects.filter(
            staff=staff,
            date__gte=start_date,
            date__lte=end_date,
            is_deleted=False
        )
        
        # Count present days
        present_count = attendance_records.filter(
            Q(status='PRESENT') | Q(status='HALF_DAY')
        ).count()
        
        # Count half days as 0.5
        half_days = attendance_records.filter(status='HALF_DAY').count()
        days_present = Decimal(str(present_count - (half_days * 0.5)))
        
        # Get approved paid leaves
        paid_leaves = LeaveApplication.objects.filter(
            staff=staff,
            status='APPROVED',
            leave_type__is_paid=True,
            start_date__lte=end_date,
            end_date__gte=start_date,
            is_deleted=False
        )
        
        paid_leave_days = Decimal('0.0')
        for leave in paid_leaves:
            # Calculate overlapping days
            leave_start = max(leave.start_date, start_date)
            leave_end = min(leave.end_date, end_date)
            days = (leave_end - leave_start).days + 1
            paid_leave_days += Decimal(str(days))
        
        # Calculate working days
        working_days = SalaryCalculator.calculate_working_days(year, month)
        
        # Days absent = working days - (present + paid leaves)
        days_absent = Decimal(str(working_days)) - days_present - paid_leave_days
        if days_absent < 0:
            days_absent = Decimal('0.0')
        
        return days_present, days_absent, paid_leave_days
    
    @staticmethod
    def calculate_component_amount(base_salary, component, component_value):
        """
        Calculate component amount based on calculation type.
        """
        if component.calculation_type == 'FIXED':
            return Decimal(str(component_value))
        elif component.calculation_type == 'PERCENTAGE':
            return (Decimal(str(base_salary)) * Decimal(str(component_value))) / Decimal('100')
        return Decimal('0.00')
    
    @staticmethod
    def calculate_loss_of_pay(base_salary, working_days, days_absent):
        """
        Calculate loss of pay for absent days.
        """
        if days_absent <= 0:
            return Decimal('0.00')
        
        per_day_salary = Decimal(str(base_salary)) / Decimal(str(working_days))
        return per_day_salary * Decimal(str(days_absent))
    
    @staticmethod
    def generate_payslip(staff, payroll_cycle):
        """
        Generate payslip for a staff member for a payroll cycle.
        """
        # Get active salary structure
        try:
            salary_structure = SalaryStructure.objects.get(
                staff=staff,
                is_active=True,
                effective_from__lte=datetime(payroll_cycle.year, payroll_cycle.month, 1).date(),
                is_deleted=False
            )
        except SalaryStructure.DoesNotExist:
            raise ValueError(f"No active salary structure found for {staff.get_full_name()}")
        
        # Calculate working days
        working_days = SalaryCalculator.calculate_working_days(
            payroll_cycle.year,
            payroll_cycle.month
        )
        
        # Get attendance data
        days_present, days_absent, paid_leaves = SalaryCalculator.get_attendance_data(
            staff,
            payroll_cycle.year,
            payroll_cycle.month
        )
        
        # Calculate base salary
        base_salary = salary_structure.base_salary
        
        # Calculate loss of pay
        loss_of_pay = SalaryCalculator.calculate_loss_of_pay(
            base_salary,
            working_days,
            days_absent
        )
        
        # Calculate earnings
        total_earnings = base_salary
        earning_components = []
        
        for struct_component in salary_structure.components.filter(
            component__component_type='EARNING',
            component__is_active=True
        ):
            amount = SalaryCalculator.calculate_component_amount(
                base_salary,
                struct_component.component,
                struct_component.value
            )
            total_earnings += amount
            earning_components.append({
                'component': struct_component.component,
                'amount': amount
            })
        
        # Calculate gross salary
        gross_salary = total_earnings - loss_of_pay
        
        # Calculate deductions
        total_deductions = Decimal('0.00')
        deduction_components = []
        
        for struct_component in salary_structure.components.filter(
            component__component_type='DEDUCTION',
            component__is_active=True
        ):
            amount = SalaryCalculator.calculate_component_amount(
                base_salary,
                struct_component.component,
                struct_component.value
            )
            total_deductions += amount
            deduction_components.append({
                'component': struct_component.component,
                'amount': amount
            })
        
        # Calculate net salary
        net_salary = gross_salary - total_deductions
        
        # Create or update payslip
        payslip, created = Payslip.objects.update_or_create(
            tenant=staff.tenant,
            payroll_cycle=payroll_cycle,
            staff=staff,
            defaults={
                'salary_structure': salary_structure,
                'total_working_days': working_days,
                'days_present': days_present,
                'days_absent': days_absent,
                'paid_leaves': paid_leaves,
                'base_salary': base_salary,
                'gross_salary': gross_salary,
                'total_deductions': total_deductions,
                'loss_of_pay': loss_of_pay,
                'net_salary': net_salary
            }
        )
        
        # Delete existing components
        payslip.components.all().delete()
        
        # Create earning components
        for earning in earning_components:
            PayslipComponent.objects.create(
                tenant=staff.tenant,
                payslip=payslip,
                component=earning['component'],
                amount=earning['amount']
            )
        
        # Create deduction components
        for deduction in deduction_components:
            PayslipComponent.objects.create(
                tenant=staff.tenant,
                payslip=payslip,
                component=deduction['component'],
                amount=deduction['amount']
            )
        
        return payslip
    
    @staticmethod
    def process_payroll_cycle(payroll_cycle, staff_list=None):
        """
        Process payroll for all staff or specific staff list.
        """
        from staff.models import Staff
        
        if staff_list is None:
            # Get all active staff
            staff_list = Staff.objects.filter(
                tenant=payroll_cycle.tenant,
                is_active=True,
                is_deleted=False
            )
        
        payslips = []
        total_gross = Decimal('0.00')
        total_deductions = Decimal('0.00')
        total_net = Decimal('0.00')
        
        for staff in staff_list:
            try:
                payslip = SalaryCalculator.generate_payslip(staff, payroll_cycle)
                payslips.append(payslip)
                total_gross += payslip.gross_salary
                total_deductions += payslip.total_deductions
                total_net += payslip.net_salary
            except ValueError as e:
                # Skip staff without salary structure
                print(f"Skipping {staff.get_full_name()}: {str(e)}")
                continue
        
        # Update payroll cycle totals
        payroll_cycle.total_gross = total_gross
        payroll_cycle.total_deductions = total_deductions
        payroll_cycle.total_net = total_net
        payroll_cycle.status = 'COMPLETED'
        payroll_cycle.processed_on = datetime.now()
        payroll_cycle.save()
        
        return payslips


class PayslipPDFGenerator:
    """
    Generate PDF payslips.
    """
    
    @staticmethod
    def generate_pdf(payslip):
        """
        Generate PDF for a payslip.
        Note: This is a placeholder. Implement actual PDF generation using ReportLab or WeasyPrint.
        """
        # TODO: Implement PDF generation
        # For now, return None
        return None
