"""
Report Generation Services
Handles PDF/Excel generation and data processing
"""

import io
import os
from datetime import datetime
from decimal import Decimal
from django.apps import apps
from django.db.models import Count, Sum, Avg, Max, Min, Q
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfgen import canvas
import xlsxwriter
import csv as csv_module


class ReportGenerationService:
    """Service for generating reports in various formats"""
    
    def __init__(self, template):
        self.template = template
        self.data = []
        self.queryset = None
    
    def fetch_data(self, filters=None, date_range=None):
        """
        Fetch data based on template configuration
        """
        # Get the model
        model = apps.get_model(self.template.data_source)
        
        # Start with base queryset
        self.queryset = model.objects.all()
        
        # Apply tenant filter if tenant-aware
        if hasattr(model, 'tenant'):
            self.queryset = self.queryset.filter(tenant=self.template.tenant)
        
        # Apply filters from template
        if self.template.filters:
            self.queryset = self.queryset.filter(**self.template.filters)
        
        # Apply custom filters
        if filters:
            self.queryset = self.queryset.filter(**filters)
        
        # Apply date range
        if date_range:
            if 'start' in date_range and 'end' in date_range:
                date_field = date_range.get('field', 'created_at')
                self.queryset = self.queryset.filter(
                    **{f'{date_field}__gte': date_range['start']}
                ).filter(
                    **{f'{date_field}__lte': date_range['end']}
                )
        
        # Apply grouping
        if self.template.grouping:
            self.queryset = self.queryset.values(*self.template.grouping)
        
        # Apply aggregations
        if self.template.aggregations:
            agg_dict = {}
            for agg_name, agg_config in self.template.aggregations.items():
                func_name = agg_config.get('function')  # e.g., 'Sum', 'Avg'
                field = agg_config.get('field')
                
                if func_name == 'Count':
                    agg_dict[agg_name] = Count(field)
                elif func_name == 'Sum':
                    agg_dict[agg_name] = Sum(field)
                elif func_name == 'Avg':
                    agg_dict[agg_name] = Avg(field)
                elif func_name == 'Max':
                    agg_dict[agg_name] = Max(field)
                elif func_name == 'Min':
                    agg_dict[agg_name] = Min(field)
            
            self.queryset = self.queryset.annotate(**agg_dict)
        
        # Apply sorting
        if self.template.sorting:
            self.queryset = self.queryset.order_by(*self.template.sorting)
        
        # Convert to list of dicts
        if self.template.fields:
            self.queryset = self.queryset.values(*self.template.fields)
        
        self.data = list(self.queryset)
        return self.data
    
    def generate_pdf(self, output_path=None):
        """Generate PDF report"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Container for flowables
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph(f"<b>{self.template.name}</b>", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Description
        if self.template.description:
            desc = Paragraph(self.template.description, styles['Normal'])
            elements.append(desc)
            elements.append(Spacer(1, 12))
        
        # Date generated
        date_text = f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        elements.append(Paragraph(date_text, styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Data table
        if self.data:
            # Headers
            headers = list(self.data[0].keys())
            table_data = [headers]
            
            # Rows
            for row in self.data:
                table_data.append([str(row.get(h, '')) for h in headers])
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(table)
        
        # Build PDF
        doc.build(elements)
        
        buffer.seek(0)
        return buffer
    
    def generate_excel(self, output_path=None):
        """Generate Excel report"""
        buffer = io.BytesIO()
        workbook = xlsxwriter.Workbook(buffer, {'in_memory': True})
        worksheet = workbook.add_worksheet(self.template.name[:31])  # Sheet name max 31 chars
        
        # Formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        cell_format = workbook.add_format({'border': 1})
        
        # Write metadata
        worksheet.write(0, 0, 'Report:', header_format)
        worksheet.write(0, 1, self.template.name)
        worksheet.write(1, 0, 'Generated:', header_format)
        worksheet.write(1, 1, timezone.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        # Write data
        if self.data:
            row_offset = 4
            headers = list(self.data[0].keys())
            
            # Headers
            for col, header in enumerate(headers):
                worksheet.write(row_offset, col, header, header_format)
            
            # Data rows
            for row_idx, row_data in enumerate(self.data, start=row_offset + 1):
                for col_idx, header in enumerate(headers):
                    value = row_data.get(header, '')
                    worksheet.write(row_idx, col_idx, value, cell_format)
            
            # Auto-fit columns
            for col_idx in range(len(headers)):
                worksheet.set_column(col_idx, col_idx, 15)
        
        workbook.close()
        buffer.seek(0)
        return buffer
    
    def generate_csv(self):
        """Generate CSV report"""
        buffer = io.StringIO()
        
        if self.data:
            headers = list(self.data[0].keys())
            writer = csv_module.DictWriter(buffer, fieldnames=headers)
            writer.writeheader()
            writer.writerows(self.data)
        
        buffer.seek(0)
        return io.BytesIO(buffer.getvalue().encode('utf-8'))


class AnalyticsDataService:
    """Service for fetching analytics data"""
    
    def __init__(self, tenant):
        self.tenant = tenant
    
    def get_student_performance_analytics(self, academic_year=None):
        """Get student performance analytics"""
        from exams.models import ExamResult
        from academics.models import StudentEnrollment
        
        results = ExamResult.objects.filter(
            enrollment__student__tenant=self.tenant
        )
        
        if academic_year:
            results = results.filter(exam__academic_year=academic_year)
        
        analytics = {
            'total_exams': results.values('exam').distinct().count(),
            'average_score': results.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0,
            'pass_rate': self._calculate_pass_rate(results),
            'top_performers': self._get_top_performers(results),
            'subject_wise_performance': self._get_subject_performance(results)
        }
        
        return analytics
    
    def get_attendance_trends(self, days=30):
        """Get attendance trends"""
        from attendance.models import StudentAttendance
        from django.utils.timezone import now, timedelta
        
        start_date = now().date() - timedelta(days=days)
        
        attendance = StudentAttendance.objects.filter(
            student__tenant=self.tenant,
            date__gte=start_date
        )
        
        trends = attendance.values('date').annotate(
            present_count=Count('id', filter=Q(status='PRESENT')),
            absent_count=Count('id', filter=Q(status='ABSENT')),
            total=Count('id')
        ).order_by('date')
        
        return list(trends)
    
    def get_fee_collection_trends(self, months=12):
        """Get fee collection trends"""
        from fees.models import FeePayment
        from django.utils.timezone import now
        from dateutil.relativedelta import relativedelta
        
        start_date = now().date() - relativedelta(months=months)
        
        payments = FeePayment.objects.filter(
            tenant=self.tenant,
            payment_date__gte=start_date
        )
        
        trends = payments.extra(
            select={'month': 'EXTRACT(month FROM payment_date)', 'year': 'EXTRACT(year FROM payment_date)'}
        ).values('month', 'year').annotate(
            total_collected=Sum('amount_paid'),
            payment_count=Count('id')
        ).order_by('year', 'month')
        
        return list(trends)
    
    def _calculate_pass_rate(self, results):
        """Calculate pass percentage"""
        total = results.count()
        if total == 0:
            return 0
        
        passed = results.filter(marks_obtained__gte=40).count()  # Assuming 40% is pass
        return round((passed / total) * 100, 2)
    
    def _get_top_performers(self, results, limit=10):
        """Get top performing students"""
        top = results.values(
            'enrollment__student__id',
            'enrollment__student__first_name',
            'enrollment__student__last_name'
        ).annotate(
            avg_marks=Avg('marks_obtained')
        ).order_by('-avg_marks')[:limit]
        
        return list(top)
    
    def _get_subject_performance(self, results):
        """Get subject-wise performance"""
        performance = results.values(
            'exam__subject__name'
        ).annotate(
            avg_marks=Avg('marks_obtained'),
            total_students=Count('enrollment__student', distinct=True)
        ).order_by('-avg_marks')
        
        return list(performance)
