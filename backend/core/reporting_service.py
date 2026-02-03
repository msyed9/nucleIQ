"""
Advanced Reporting Service
Comprehensive reporting for all modules with multiple formats and scheduling
"""

import logging
import json
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Any
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncMonth, TruncWeek, TruncDate
from django.utils import timezone

logger = logging.getLogger(__name__)


class AdvancedReportingService:
    """
    Comprehensive reporting service supporting multiple modules and formats.
    """
    
    REPORT_TYPES = {
        'ATTENDANCE': {
            'name': 'Attendance Reports',
            'subtypes': ['DAILY', 'MONTHLY', 'YEARLY', 'CLASS_WISE', 'STUDENT_WISE']
        },
        'FEES': {
            'name': 'Fee Collection Reports',
            'subtypes': ['COLLECTION', 'PENDING', 'DEFAULTERS', 'CATEGORY_WISE', 'CLASS_WISE', 'STUDENT_LEDGER']
        },
        'ACADEMICS': {
            'name': 'Academic Reports',
            'subtypes': ['RESULT_ANALYSIS', 'PERFORMANCE_TREND', 'SUBJECT_WISE', 'GRADE_DISTRIBUTION']
        },
        'STAFF': {
            'name': 'Staff Reports',
            'subtypes': ['ATTENDANCE', 'SALARY', 'LEAVE_SUMMARY', 'DEPARTMENT_WISE']
        },
        'STUDENTS': {
            'name': 'Student Reports',
            'subtypes': ['ENROLLMENT', 'DEMOGRAPHICS', 'CLASS_STRENGTH', 'ADMISSION_TREND']
        },
        'FINANCE': {
            'name': 'Financial Reports',
            'subtypes': ['INCOME_EXPENSE', 'CASH_FLOW', 'BUDGET_VS_ACTUAL', 'PROFIT_LOSS']
        },
        'TRANSPORT': {
            'name': 'Transport Reports',
            'subtypes': ['ROUTE_WISE', 'BUS_UTILIZATION', 'DRIVER_PERFORMANCE']
        },
        'CUSTOM': {
            'name': 'Custom Reports',
            'subtypes': ['QUERY_BUILDER']
        }
    }
    
    def __init__(self, tenant):
        self.tenant = tenant
    
    # ========================
    # Fee Reports
    # ========================
    
    def generate_fee_collection_report(
        self,
        start_date: date,
        end_date: date,
        group_by: str = 'date',
        filters: Dict = None
    ) -> Dict:
        """Generate fee collection summary report."""
        from fees.models import FeeTransaction, FeeInvoice
        
        transactions = FeeTransaction.objects.filter(
            tenant=self.tenant,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date
        )
        
        # Apply filters
        if filters:
            if filters.get('class_name'):
                transactions = transactions.filter(
                    invoice__student__enrollments__section__grade_level__name__icontains=filters['class_name']
                )
            if filters.get('payment_mode'):
                transactions = transactions.filter(payment_mode=filters['payment_mode'])
        
        # Group by period
        if group_by == 'date':
            grouped = transactions.annotate(
                period=TruncDate('transaction_date')
            ).values('period').annotate(
                total_amount=Sum('amount'),
                transaction_count=Count('id')
            ).order_by('period')
        elif group_by == 'week':
            grouped = transactions.annotate(
                period=TruncWeek('transaction_date')
            ).values('period').annotate(
                total_amount=Sum('amount'),
                transaction_count=Count('id')
            ).order_by('period')
        elif group_by == 'month':
            grouped = transactions.annotate(
                period=TruncMonth('transaction_date')
            ).values('period').annotate(
                total_amount=Sum('amount'),
                transaction_count=Count('id')
            ).order_by('period')
        else:
            grouped = transactions.aggregate(
                total_amount=Sum('amount'),
                transaction_count=Count('id')
            )
        
        # Payment mode breakdown
        mode_breakdown = transactions.values('payment_mode').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Summary
        totals = transactions.aggregate(
            total_collected=Sum('amount'),
            total_transactions=Count('id')
        )
        
        return {
            'report_type': 'FEE_COLLECTION',
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'data': list(grouped) if isinstance(grouped, type(transactions)) else [grouped],
            'payment_mode_breakdown': list(mode_breakdown),
            'summary': {
                'total_collected': float(totals['total_collected'] or 0),
                'total_transactions': totals['total_transactions'] or 0,
                'average_transaction': float((totals['total_collected'] or 0) / max(totals['total_transactions'] or 1, 1))
            }
        }
    
    def generate_fee_pending_report(
        self,
        as_of_date: date = None,
        filters: Dict = None
    ) -> Dict:
        """Generate pending fees report."""
        from fees.models import FeeInvoice
        from students.models import Student
        
        as_of_date = as_of_date or date.today()
        
        # Get pending invoices
        invoices = FeeInvoice.objects.filter(
            tenant=self.tenant,
            status__in=['PENDING', 'PARTIAL'],
            due_date__lte=as_of_date
        ).select_related('student')
        
        # Apply filters
        if filters:
            if filters.get('class_name'):
                invoices = invoices.filter(
                    student__enrollments__section__grade_level__name__icontains=filters['class_name']
                )
            if filters.get('days_overdue'):
                days = int(filters['days_overdue'])
                cutoff = as_of_date - timedelta(days=days)
                invoices = invoices.filter(due_date__lte=cutoff)
        
        # Group by class
        class_wise = []
        student_data = []
        
        for invoice in invoices.prefetch_related('student__enrollments__section__grade_level'):
            student = invoice.student
            enrollment = student.get_current_enrollment() if hasattr(student, 'get_current_enrollment') else None
            class_name = enrollment.section.grade_level.name if enrollment and enrollment.section else 'Unknown'
            
            student_data.append({
                'student_id': str(student.id),
                'student_name': student.get_full_name(),
                'admission_number': student.admission_number,
                'class_name': class_name,
                'invoice_number': invoice.invoice_number,
                'total_amount': float(invoice.total_amount),
                'paid_amount': float(invoice.paid_amount),
                'balance_amount': float(invoice.balance_amount),
                'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
                'days_overdue': (as_of_date - invoice.due_date).days if invoice.due_date else 0
            })
        
        # Aggregate by class
        class_aggregates = {}
        for item in student_data:
            cn = item['class_name']
            if cn not in class_aggregates:
                class_aggregates[cn] = {'class_name': cn, 'total_pending': 0, 'student_count': 0}
            class_aggregates[cn]['total_pending'] += item['balance_amount']
            class_aggregates[cn]['student_count'] += 1
        
        # Summary
        total_pending = sum(item['balance_amount'] for item in student_data)
        
        return {
            'report_type': 'FEE_PENDING',
            'as_of_date': as_of_date.isoformat(),
            'class_wise': list(class_aggregates.values()),
            'student_wise': student_data,
            'summary': {
                'total_pending': total_pending,
                'total_students': len(student_data),
                'total_invoices': len(student_data)
            }
        }
    
    # ========================
    # Attendance Reports
    # ========================
    
    def generate_attendance_report(
        self,
        report_subtype: str,
        start_date: date,
        end_date: date,
        filters: Dict = None
    ) -> Dict:
        """Generate attendance report based on subtype."""
        from attendance.models import Attendance
        
        base_query = Attendance.objects.filter(
            tenant=self.tenant,
            date__gte=start_date,
            date__lte=end_date
        )
        
        if report_subtype == 'DAILY':
            return self._attendance_daily_report(base_query, start_date, end_date, filters)
        elif report_subtype == 'MONTHLY':
            return self._attendance_monthly_report(base_query, start_date, end_date, filters)
        elif report_subtype == 'CLASS_WISE':
            return self._attendance_class_wise_report(base_query, start_date, end_date, filters)
        elif report_subtype == 'STUDENT_WISE':
            return self._attendance_student_wise_report(base_query, start_date, end_date, filters)
        else:
            return {'error': f'Unknown report subtype: {report_subtype}'}
    
    def _attendance_daily_report(self, base_query, start_date, end_date, filters):
        """Daily attendance summary."""
        daily_data = base_query.annotate(
            attendance_date=TruncDate('date')
        ).values('attendance_date').annotate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            late=Count('id', filter=Q(status='LATE')),
            total=Count('id')
        ).order_by('attendance_date')
        
        data = []
        for item in daily_data:
            total = item['total'] or 1
            data.append({
                'date': item['attendance_date'].isoformat() if item['attendance_date'] else None,
                'present': item['present'],
                'absent': item['absent'],
                'late': item['late'],
                'total': item['total'],
                'attendance_percentage': round((item['present'] + item['late']) / total * 100, 2)
            })
        
        return {
            'report_type': 'ATTENDANCE_DAILY',
            'date_range': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'data': data
        }
    
    def _attendance_monthly_report(self, base_query, start_date, end_date, filters):
        """Monthly attendance summary."""
        monthly_data = base_query.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            late=Count('id', filter=Q(status='LATE')),
            total=Count('id')
        ).order_by('month')
        
        data = []
        for item in monthly_data:
            total = item['total'] or 1
            data.append({
                'month': item['month'].strftime('%Y-%m') if item['month'] else None,
                'present': item['present'],
                'absent': item['absent'],
                'late': item['late'],
                'total': item['total'],
                'attendance_percentage': round((item['present'] + item['late']) / total * 100, 2)
            })
        
        return {
            'report_type': 'ATTENDANCE_MONTHLY',
            'date_range': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'data': data
        }
    
    def _attendance_class_wise_report(self, base_query, start_date, end_date, filters):
        """Class-wise attendance summary."""
        from academics.models import Section
        
        class_data = base_query.values(
            class_name=F('student__enrollments__section__grade_level__name'),
            section_name=F('student__enrollments__section__name')
        ).annotate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            late=Count('id', filter=Q(status='LATE')),
            total=Count('id')
        ).order_by('class_name', 'section_name')
        
        data = []
        for item in class_data:
            total = item['total'] or 1
            data.append({
                'class_name': item['class_name'],
                'section_name': item['section_name'],
                'present': item['present'],
                'absent': item['absent'],
                'late': item['late'],
                'total': item['total'],
                'attendance_percentage': round((item['present'] + item['late']) / total * 100, 2)
            })
        
        return {
            'report_type': 'ATTENDANCE_CLASS_WISE',
            'date_range': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'data': data
        }
    
    def _attendance_student_wise_report(self, base_query, start_date, end_date, filters):
        """Student-wise attendance summary."""
        student_data = base_query.values(
            student_id=F('student__id'),
            student_name=F('student__first_name'),
            admission_number=F('student__admission_number')
        ).annotate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            late=Count('id', filter=Q(status='LATE')),
            total=Count('id')
        ).order_by('student_name')
        
        data = []
        for item in student_data:
            total = item['total'] or 1
            data.append({
                'student_id': str(item['student_id']),
                'student_name': item['student_name'],
                'admission_number': item['admission_number'],
                'present': item['present'],
                'absent': item['absent'],
                'late': item['late'],
                'total': item['total'],
                'attendance_percentage': round((item['present'] + item['late']) / total * 100, 2)
            })
        
        return {
            'report_type': 'ATTENDANCE_STUDENT_WISE',
            'date_range': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'data': data
        }
    
    # ========================
    # Academic Reports
    # ========================
    
    def generate_academic_report(
        self,
        report_subtype: str,
        academic_year_id: str = None,
        filters: Dict = None
    ) -> Dict:
        """Generate academic performance reports."""
        from academics.models import ExamResult, Exam
        
        if report_subtype == 'RESULT_ANALYSIS':
            return self._result_analysis_report(academic_year_id, filters)
        elif report_subtype == 'GRADE_DISTRIBUTION':
            return self._grade_distribution_report(academic_year_id, filters)
        elif report_subtype == 'SUBJECT_WISE':
            return self._subject_wise_report(academic_year_id, filters)
        else:
            return {'error': f'Unknown report subtype: {report_subtype}'}
    
    def _result_analysis_report(self, academic_year_id, filters):
        """Exam result analysis."""
        from academics.models import ExamResult
        
        results = ExamResult.objects.filter(tenant=self.tenant)
        
        if academic_year_id:
            results = results.filter(exam__academic_year_id=academic_year_id)
        
        # Aggregate by exam
        exam_data = results.values(
            exam_name=F('exam__name'),
            exam_type=F('exam__exam_type')
        ).annotate(
            avg_score=Avg('marks_obtained'),
            max_score=Avg('max_marks'),
            total_students=Count('student', distinct=True),
            pass_count=Count('id', filter=Q(marks_obtained__gte=F('max_marks') * 0.33))
        ).order_by('exam_name')
        
        data = []
        for item in exam_data:
            data.append({
                'exam_name': item['exam_name'],
                'exam_type': item['exam_type'],
                'average_score': round(float(item['avg_score'] or 0), 2),
                'max_score': float(item['max_score'] or 0),
                'total_students': item['total_students'],
                'pass_count': item['pass_count'],
                'pass_percentage': round(item['pass_count'] / max(item['total_students'], 1) * 100, 2)
            })
        
        return {
            'report_type': 'RESULT_ANALYSIS',
            'data': data
        }
    
    def _grade_distribution_report(self, academic_year_id, filters):
        """Grade distribution analysis."""
        from academics.models import ExamResult
        
        results = ExamResult.objects.filter(tenant=self.tenant)
        
        if academic_year_id:
            results = results.filter(exam__academic_year_id=academic_year_id)
        
        # Calculate grades based on percentage
        total = results.count()
        
        grade_ranges = [
            ('A+', 90, 100),
            ('A', 80, 89),
            ('B+', 70, 79),
            ('B', 60, 69),
            ('C+', 50, 59),
            ('C', 40, 49),
            ('D', 33, 39),
            ('F', 0, 32)
        ]
        
        grade_data = []
        for grade, min_pct, max_pct in grade_ranges:
            count = results.filter(
                percentage__gte=min_pct,
                percentage__lte=max_pct
            ).count() if hasattr(results.model, 'percentage') else 0
            
            grade_data.append({
                'grade': grade,
                'min_percentage': min_pct,
                'max_percentage': max_pct,
                'count': count,
                'percentage': round(count / max(total, 1) * 100, 2)
            })
        
        return {
            'report_type': 'GRADE_DISTRIBUTION',
            'data': grade_data,
            'total_students': total
        }
    
    def _subject_wise_report(self, academic_year_id, filters):
        """Subject-wise performance analysis."""
        from academics.models import ExamResult
        
        results = ExamResult.objects.filter(tenant=self.tenant)
        
        if academic_year_id:
            results = results.filter(exam__academic_year_id=academic_year_id)
        
        # Aggregate by subject
        subject_data = results.values(
            subject_name=F('subject__name')
        ).annotate(
            avg_marks=Avg('marks_obtained'),
            max_marks=Avg('max_marks'),
            total_students=Count('student', distinct=True),
            avg_percentage=Avg(F('marks_obtained') * 100.0 / F('max_marks'))
        ).order_by('-avg_percentage')
        
        data = []
        for item in subject_data:
            data.append({
                'subject': item['subject_name'],
                'average_marks': round(float(item['avg_marks'] or 0), 2),
                'max_marks': float(item['max_marks'] or 0),
                'total_students': item['total_students'],
                'average_percentage': round(float(item['avg_percentage'] or 0), 2)
            })
        
        return {
            'report_type': 'SUBJECT_WISE',
            'data': data
        }
    
    # ========================
    # Student Reports
    # ========================
    
    def generate_student_report(
        self,
        report_subtype: str,
        filters: Dict = None
    ) -> Dict:
        """Generate student-related reports."""
        from students.models import Student, Enrollment
        
        if report_subtype == 'ENROLLMENT':
            return self._enrollment_report(filters)
        elif report_subtype == 'DEMOGRAPHICS':
            return self._demographics_report(filters)
        elif report_subtype == 'CLASS_STRENGTH':
            return self._class_strength_report(filters)
        elif report_subtype == 'ADMISSION_TREND':
            return self._admission_trend_report(filters)
        else:
            return {'error': f'Unknown report subtype: {report_subtype}'}
    
    def _enrollment_report(self, filters):
        """Current enrollment status."""
        from students.models import Enrollment
        
        enrollments = Enrollment.objects.filter(
            tenant=self.tenant,
            status='ACTIVE'
        ).select_related('section__grade_level')
        
        class_data = enrollments.values(
            class_name=F('section__grade_level__name'),
            section_name=F('section__name')
        ).annotate(
            total=Count('id'),
            boys=Count('id', filter=Q(student__gender='MALE')),
            girls=Count('id', filter=Q(student__gender='FEMALE'))
        ).order_by('class_name', 'section_name')
        
        return {
            'report_type': 'ENROLLMENT',
            'data': list(class_data),
            'summary': {
                'total_strength': sum(item['total'] for item in class_data),
                'total_boys': sum(item['boys'] for item in class_data),
                'total_girls': sum(item['girls'] for item in class_data)
            }
        }
    
    def _demographics_report(self, filters):
        """Student demographics breakdown."""
        from students.models import Student
        
        students = Student.objects.filter(tenant=self.tenant, is_active=True)
        
        # Gender distribution
        gender_dist = students.values('gender').annotate(count=Count('id'))
        
        # Religion distribution
        religion_dist = students.values('religion').annotate(count=Count('id'))
        
        # Category distribution
        category_dist = students.values('category').annotate(count=Count('id'))
        
        return {
            'report_type': 'DEMOGRAPHICS',
            'gender_distribution': list(gender_dist),
            'religion_distribution': list(religion_dist),
            'category_distribution': list(category_dist),
            'total_students': students.count()
        }
    
    def _class_strength_report(self, filters):
        """Class strength with capacity utilization."""
        from students.models import Enrollment
        from academics.models import Section
        
        sections = Section.objects.filter(
            grade_level__tenant=self.tenant,
            is_active=True
        ).select_related('grade_level')
        
        data = []
        for section in sections:
            current_strength = Enrollment.objects.filter(
                section=section,
                status='ACTIVE'
            ).count()
            
            capacity = section.capacity or 40
            
            data.append({
                'class_name': section.grade_level.name,
                'section_name': section.name,
                'current_strength': current_strength,
                'capacity': capacity,
                'vacancies': capacity - current_strength,
                'utilization_percentage': round(current_strength / capacity * 100, 2)
            })
        
        return {
            'report_type': 'CLASS_STRENGTH',
            'data': data
        }
    
    def _admission_trend_report(self, filters):
        """Admission trend analysis."""
        from students.models import Student
        
        # Get admissions grouped by month
        trend_data = Student.objects.filter(
            tenant=self.tenant
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            admissions=Count('id')
        ).order_by('month')
        
        return {
            'report_type': 'ADMISSION_TREND',
            'data': list(trend_data)
        }
    
    # ========================
    # Export Functions
    # ========================
    
    def export_to_excel(self, report_data: Dict, filename: str = None) -> bytes:
        """Export report data to Excel format."""
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
        from io import BytesIO
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = report_data.get('report_type', 'Report')
        
        # Header styling
        header_font = Font(bold=True, color='FFFFFF')
        header_fill = PatternFill(start_color='4F46E5', end_color='4F46E5', fill_type='solid')
        
        # Get data
        data = report_data.get('data', [])
        if not data:
            data = [report_data]
        
        # Write headers
        if data and isinstance(data[0], dict):
            headers = list(data[0].keys())
            for col, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col, value=header.replace('_', ' ').title())
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal='center')
            
            # Write data rows
            for row_idx, row_data in enumerate(data, 2):
                for col_idx, header in enumerate(headers, 1):
                    value = row_data.get(header, '')
                    if isinstance(value, (datetime, date)):
                        value = value.isoformat()
                    ws.cell(row=row_idx, column=col_idx, value=value)
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            ws.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        # Save to bytes
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output.getvalue()
    
    def export_to_pdf(self, report_data: Dict, filename: str = None) -> bytes:
        """Export report data to PDF format."""
        # This would use a PDF library like reportlab or weasyprint
        # For now, return a placeholder
        logger.info("PDF export called - would generate PDF here")
        return b''
    
    def export_to_csv(self, report_data: Dict) -> str:
        """Export report data to CSV format."""
        import csv
        from io import StringIO
        
        data = report_data.get('data', [])
        if not data:
            return ''
        
        output = StringIO()
        
        if isinstance(data[0], dict):
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        
        return output.getvalue()
