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
    Generate PDF payslips using ReportLab.
    """
    
    @staticmethod
    def generate_pdf(payslip):
        """
        Generate PDF for a payslip.
        Returns: BytesIO buffer containing the PDF
        """
        from io import BytesIO
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
        from datetime import datetime
        
        # Create buffer
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Container for PDF elements
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        normal_style = styles['Normal']
        
        # Header - School/Tenant Name
        tenant_name = getattr(payslip.tenant, 'name', 'School Management System')
        elements.append(Paragraph(tenant_name, title_style))
        elements.append(Paragraph('PAYSLIP', heading_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Payslip Period
        month_name = payslip.payroll_cycle.get_month_name()
        year = payslip.payroll_cycle.year
        period_text = f"<b>Period:</b> {month_name} {year}"
        elements.append(Paragraph(period_text, normal_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Employee Information Table
        elements.append(Paragraph('Employee Information', heading_style))
        
        staff = payslip.staff
        emp_data = [
            ['Employee Name:', staff.get_full_name() or 'N/A'],
            ['Employee ID:', str(staff.employee_id) if hasattr(staff, 'employee_id') else 'N/A'],
            ['Designation:', getattr(staff, 'designation', 'N/A')],
            ['Department:', getattr(staff.department, 'name', 'N/A') if hasattr(staff, 'department') else 'N/A'],
        ]
        
        emp_table = Table(emp_data, colWidths=[2*inch, 4*inch])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(emp_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Attendance Summary
        elements.append(Paragraph('Attendance Summary', heading_style))
        
        att_data = [
            ['Total Working Days', 'Days Present', 'Paid Leaves', 'Days Absent'],
            [
                str(payslip.total_working_days),
                str(float(payslip.days_present)),
                str(float(payslip.paid_leaves)),
                str(float(payslip.days_absent))
            ]
        ]
        
        att_table = Table(att_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        att_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(att_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Salary Breakdown
        elements.append(Paragraph('Salary Breakdown', heading_style))
        
        # Prepare earnings data
        earnings_data = [['Earnings', 'Amount (₹)']]
        earnings_data.append(['Base Salary', f"{float(payslip.base_salary):,.2f}"])
        
        # Add earning components
        earning_components = payslip.components.filter(component__component_type='EARNING')
        for comp in earning_components:
            earnings_data.append([comp.component.name, f"{float(comp.amount):,.2f}"])
        
        # Calculate total earnings before LOP
        total_earnings = float(payslip.gross_salary) + float(payslip.loss_of_pay)
        earnings_data.append(['Gross Salary', f"{total_earnings:,.2f}"])
        
        # Prepare deductions data
        deductions_data = [['Deductions', 'Amount (₹)']]
        
        # Add loss of pay if applicable
        if float(payslip.loss_of_pay) > 0:
            deductions_data.append(['Loss of Pay', f"{float(payslip.loss_of_pay):,.2f}"])
        
        # Add deduction components
        deduction_components = payslip.components.filter(component__component_type='DEDUCTION')
        for comp in deduction_components:
            deductions_data.append([comp.component.name, f"{float(comp.amount):,.2f}"])
        
        # Total deductions
        total_deductions = float(payslip.total_deductions) + float(payslip.loss_of_pay)
        deductions_data.append(['Total Deductions', f"{total_deductions:,.2f}"])
        
        # Create side-by-side tables
        earnings_table = Table(earnings_data, colWidths=[2*inch, 1.5*inch])
        earnings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d1fae5')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        deductions_table = Table(deductions_data, colWidths=[2*inch, 1.5*inch])
        deductions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fee2e2')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        # Combine tables side by side
        combined_table = Table([[earnings_table, deductions_table]], colWidths=[3.5*inch, 3.5*inch])
        combined_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(combined_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Net Salary (Prominent Display)
        net_salary_data = [
            ['NET SALARY (Take Home)', f"₹ {float(payslip.net_salary):,.2f}"]
        ]
        
        net_table = Table(net_salary_data, colWidths=[4*inch, 3*inch])
        net_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#1e40af')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(net_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        
        generated_time = datetime.now().strftime('%d %B %Y, %I:%M %p')
        footer_text = f"Generated on: {generated_time}<br/>This is a computer-generated document and does not require a signature."
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF data
        buffer.seek(0)
        return buffer
