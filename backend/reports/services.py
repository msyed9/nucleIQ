"""
Report Generation Services
Handles PDF/Excel generation and data processing
"""

import io
import os
import json
import hashlib
from datetime import datetime
from decimal import Decimal
from django.apps import apps
from django.db.models import Count, Sum, Avg, Max, Min, Q
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.core.cache import cache
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

    def estimate_count(self, filters=None, date_range=None):
        """Estimate row count without materializing full data."""
        model = apps.get_model(self.template.data_source)
        queryset = model.objects.all()

        if hasattr(model, 'tenant'):
            queryset = queryset.filter(tenant=self.template.tenant)

        if self.template.filters:
            queryset = queryset.filter(**self.template.filters)

        if filters:
            queryset = queryset.filter(**filters)

        if date_range:
            if 'start' in date_range and 'end' in date_range:
                date_field = date_range.get('field', 'created_at')
                queryset = queryset.filter(
                    **{f'{date_field}__gte': date_range['start']}
                ).filter(
                    **{f'{date_field}__lte': date_range['end']}
                )

        return queryset.count()
    
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

    CACHE_TIMEOUT = 300  # 5 minutes

    def __init__(self, tenant, user=None):
        self.tenant = tenant
        self.user = user

    def get_student_performance_analytics(
        self,
        academic_year=None,
        start_date=None,
        end_date=None,
        filters=None,
        segment_by=None,
    ):
        """Get student performance analytics"""
        from exams.models import ExamResult

        filters = filters or {}
        cache_key = self._get_cache_key(
            'student_performance',
            {
                'academic_year': academic_year,
                'start_date': str(start_date) if start_date else None,
                'end_date': str(end_date) if end_date else None,
                'filters': filters,
                'segment_by': segment_by,
                'user_id': self.user.id if self.user else None,
            }
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        student_ids = self._get_filtered_student_ids(filters)

        results = ExamResult.objects.filter(
            enrollment__student__tenant=self.tenant
        )

        if student_ids is not None:
            results = results.filter(enrollment__student_id__in=student_ids)

        if academic_year:
            results = results.filter(exam__academic_year=academic_year)

        if start_date:
            results = results.filter(exam__exam_date__gte=start_date)
        if end_date:
            results = results.filter(exam__exam_date__lte=end_date)

        analytics = {
            'total_exams': results.values('exam').distinct().count(),
            'average_score': results.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0,
            'pass_rate': self._calculate_pass_rate(results),
            'top_performers': self._get_top_performers(results),
            'subject_wise_performance': self._get_subject_performance(results)
        }

        if segment_by:
            analytics['segments'] = self._get_segmented_performance(results, segment_by)

        cache.set(cache_key, analytics, self.CACHE_TIMEOUT)
        return analytics

    def get_attendance_trends(self, days=30, start_date=None, end_date=None, filters=None):
        """Get attendance trends"""
        from attendance.models import AttendanceRecord
        from django.utils.timezone import now, timedelta

        filters = filters or {}
        start_date, end_date = self._resolve_date_range(days, start_date, end_date)

        cache_key = self._get_cache_key(
            'attendance_trends',
            {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'filters': filters,
                'user_id': self.user.id if self.user else None,
            }
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        student_ids = self._get_filtered_student_ids(filters)

        attendance = AttendanceRecord.objects.filter(
            tenant=self.tenant,
            record_type='STUDENT',
            date__gte=start_date,
            date__lte=end_date
        )

        if student_ids is not None:
            attendance = attendance.filter(student_id__in=student_ids)

        trends = attendance.annotate(
            day=TruncDay('date')
        ).values('day').annotate(
            present_count=Count('id', filter=Q(status__in=['PRESENT', 'LATE', 'HALF_DAY'])),
            absent_count=Count('id', filter=Q(status='ABSENT')),
            total=Count('id')
        ).order_by('day')

        results = [
            {
                'date': item['day'].date().isoformat() if item['day'] else None,
                'present_count': item['present_count'],
                'absent_count': item['absent_count'],
                'total': item['total']
            }
            for item in trends
        ]

        cache.set(cache_key, results, self.CACHE_TIMEOUT)
        return results

    def get_fee_collection_trends(self, months=12, start_date=None, end_date=None, filters=None):
        """Get fee collection trends"""
        from fees.models import FeeTransaction
        from django.utils.timezone import now
        from dateutil.relativedelta import relativedelta

        filters = filters or {}
        if start_date or end_date:
            start_date = start_date or (now().date() - relativedelta(months=months))
            end_date = end_date or now().date()
        else:
            start_date = now().date() - relativedelta(months=months)
            end_date = now().date()

        cache_key = self._get_cache_key(
            'fee_trends',
            {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'filters': filters,
                'user_id': self.user.id if self.user else None,
            }
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        student_ids = self._get_filtered_student_ids(filters)

        payments = FeeTransaction.objects.filter(
            tenant=self.tenant,
            transaction_date__date__gte=start_date,
            transaction_date__date__lte=end_date
        )

        if student_ids is not None:
            payments = payments.filter(invoice__student_id__in=student_ids)

        trends = payments.annotate(
            month=TruncMonth('transaction_date')
        ).values('month').annotate(
            total_collected=Sum('amount'),
            payment_count=Count('id')
        ).order_by('month')

        results = [
            {
                'month': item['month'].month if item['month'] else None,
                'year': item['month'].year if item['month'] else None,
                'total_collected': float(item['total_collected'] or 0),
                'payment_count': item['payment_count']
            }
            for item in trends
        ]

        cache.set(cache_key, results, self.CACHE_TIMEOUT)
        return results

    def get_fee_ageing_buckets(self, as_of_date=None, filters=None):
        """Get fee ageing buckets."""
        from fees.models import FeeInvoice
        from django.utils.timezone import now

        filters = filters or {}
        as_of_date = as_of_date or now().date()

        cache_key = self._get_cache_key(
            'fee_ageing',
            {
                'as_of_date': str(as_of_date),
                'filters': filters,
                'user_id': self.user.id if self.user else None,
            }
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        student_ids = self._get_filtered_student_ids(filters)

        invoices = FeeInvoice.objects.filter(
            tenant=self.tenant,
            balance_amount__gt=0,
        )

        if student_ids is not None:
            invoices = invoices.filter(student_id__in=student_ids)

        buckets = {
            'current': {'label': 'Current', 'min_days': 0, 'max_days': 0, 'total': 0, 'count': 0},
            '1_30': {'label': '1-30 Days', 'min_days': 1, 'max_days': 30, 'total': 0, 'count': 0},
            '31_60': {'label': '31-60 Days', 'min_days': 31, 'max_days': 60, 'total': 0, 'count': 0},
            '61_90': {'label': '61-90 Days', 'min_days': 61, 'max_days': 90, 'total': 0, 'count': 0},
            '90_plus': {'label': '90+ Days', 'min_days': 91, 'max_days': 9999, 'total': 0, 'count': 0},
        }

        for invoice in invoices:
            days_overdue = (as_of_date - invoice.due_date).days
            if days_overdue <= 0:
                bucket = buckets['current']
            elif 1 <= days_overdue <= 30:
                bucket = buckets['1_30']
            elif 31 <= days_overdue <= 60:
                bucket = buckets['31_60']
            elif 61 <= days_overdue <= 90:
                bucket = buckets['61_90']
            else:
                bucket = buckets['90_plus']

            bucket['total'] += float(invoice.balance_amount)
            bucket['count'] += 1

        results = list(buckets.values())
        cache.set(cache_key, results, self.CACHE_TIMEOUT)
        return results

    def get_class_section_drilldown(self, start_date=None, end_date=None, filters=None):
        """Get class/section drilldown analytics."""
        from tenants.models import Section
        from attendance.models import AttendanceRecord
        from exams.models import ExamResult
        from fees.models import FeeInvoice
        from tenants.models import AcademicYear

        filters = filters or {}
        start_date, end_date = self._resolve_date_range(30, start_date, end_date)

        cache_key = self._get_cache_key(
            'class_section_drilldown',
            {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'filters': filters,
                'user_id': self.user.id if self.user else None,
            }
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        section_ids = self._get_allowed_section_ids(filters)
        sections = Section.objects.filter(tenant=self.tenant, is_active=True)
        if section_ids is not None:
            sections = sections.filter(id__in=section_ids)

        results = []
        current_year = AcademicYear.objects.filter(tenant=self.tenant, is_active=True).first()

        for section in sections:
            enrollment_qs = section.enrollments.filter(status='ACTIVE')
            if current_year:
                enrollment_qs = enrollment_qs.filter(academic_year=current_year)
            student_ids = list(enrollment_qs.values_list('student_id', flat=True))

            if not student_ids:
                results.append({
                    'section_id': str(section.id),
                    'section_name': str(section),
                    'grade_name': str(section.grade_level) if section.grade_level else 'N/A',
                    'attendance_rate': 0,
                    'average_score': 0,
                    'fee_collection_rate': 0,
                })
                continue

            attendance_qs = AttendanceRecord.objects.filter(
                tenant=self.tenant,
                record_type='STUDENT',
                student_id__in=student_ids,
                date__gte=start_date,
                date__lte=end_date
            )
            total_att = attendance_qs.count()
            present = attendance_qs.filter(status__in=['PRESENT', 'LATE', 'HALF_DAY']).count()
            attendance_rate = round(present / total_att * 100, 1) if total_att > 0 else 0

            exam_results = ExamResult.objects.filter(
                enrollment__student_id__in=student_ids,
                exam__exam_date__gte=start_date,
                exam__exam_date__lte=end_date
            )
            if current_year:
                exam_results = exam_results.filter(exam__academic_year=current_year)
            average_score = exam_results.aggregate(avg=Avg('marks_obtained'))['avg'] or 0

            invoices = FeeInvoice.objects.filter(
                tenant=self.tenant,
                student_id__in=student_ids
            )
            total_due = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
            total_paid = invoices.aggregate(total=Sum('paid_amount'))['total'] or 0
            fee_collection_rate = round(float(total_paid / total_due * 100), 1) if total_due > 0 else 0

            results.append({
                'section_id': str(section.id),
                'section_name': str(section),
                'grade_name': str(section.grade_level) if section.grade_level else 'N/A',
                'attendance_rate': attendance_rate,
                'average_score': round(float(average_score), 2) if average_score else 0,
                'fee_collection_rate': fee_collection_rate,
            })

        cache.set(cache_key, results, self.CACHE_TIMEOUT)
        return results

    def get_attendance_anomalies(self, start_date=None, end_date=None, threshold=80, filters=None):
        """Detect attendance anomalies by section."""
        from tenants.models import Section
        from attendance.models import AttendanceRecord

        filters = filters or {}
        start_date, end_date = self._resolve_date_range(14, start_date, end_date)

        cache_key = self._get_cache_key(
            'attendance_anomalies',
            {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'threshold': threshold,
                'filters': filters,
                'user_id': self.user.id if self.user else None,
            }
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        section_ids = self._get_allowed_section_ids(filters)
        sections = Section.objects.filter(tenant=self.tenant, is_active=True)
        if section_ids is not None:
            sections = sections.filter(id__in=section_ids)

        anomalies = []
        for section in sections:
            student_ids = list(
                section.enrollments.filter(status='ACTIVE').values_list('student_id', flat=True)
            )
            if not student_ids:
                continue

            attendance_qs = AttendanceRecord.objects.filter(
                tenant=self.tenant,
                record_type='STUDENT',
                student_id__in=student_ids,
                date__gte=start_date,
                date__lte=end_date
            )
            total_att = attendance_qs.count()
            present = attendance_qs.filter(status__in=['PRESENT', 'LATE', 'HALF_DAY']).count()
            attendance_rate = round(present / total_att * 100, 1) if total_att > 0 else 0

            if attendance_rate < float(threshold):
                anomalies.append({
                    'section_id': str(section.id),
                    'section_name': str(section),
                    'grade_name': str(section.grade_level) if section.grade_level else 'N/A',
                    'attendance_rate': attendance_rate,
                    'threshold': float(threshold),
                })

        cache.set(cache_key, anomalies, self.CACHE_TIMEOUT)
        return anomalies
    
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

    def _get_cache_key(self, prefix, params):
        payload = json.dumps(params, sort_keys=True, default=str).encode('utf-8')
        digest = hashlib.md5(payload).hexdigest()
        return f"reports_analytics:{self.tenant.id}:{prefix}:{digest}"

    def _resolve_date_range(self, days, start_date, end_date):
        from django.utils.timezone import now, timedelta

        if isinstance(start_date, str):
            start_date = parse_date(start_date)
        if isinstance(end_date, str):
            end_date = parse_date(end_date)

        if start_date and end_date:
            return start_date, end_date

        today = now().date()
        start_date = start_date or (today - timedelta(days=days))
        end_date = end_date or today
        return start_date, end_date

    def _get_filtered_student_ids(self, filters):
        from students.models import StudentEnrollment
        from tenants.models import AcademicYear

        filters = filters or {}
        qs = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            status='ACTIVE'
        )

        current_year = AcademicYear.objects.filter(
            tenant=self.tenant,
            is_active=True
        ).first()

        academic_year = filters.get('academic_year') or current_year
        if academic_year:
            qs = qs.filter(academic_year=academic_year)

        if filters.get('section_id'):
            qs = qs.filter(section_id=filters['section_id'])
        if filters.get('grade_id'):
            qs = qs.filter(section__grade_level_id=filters['grade_id'])
        if filters.get('class_name'):
            qs = qs.filter(section__grade_level__name=filters['class_name'])
        if filters.get('gender'):
            qs = qs.filter(student__gender=filters['gender'])
        if filters.get('religion'):
            qs = qs.filter(student__religion=filters['religion'])
        if filters.get('caste'):
            qs = qs.filter(student__caste=filters['caste'])

        allowed_sections = self._get_allowed_section_ids(filters)
        if allowed_sections is not None:
            qs = qs.filter(section_id__in=allowed_sections)

        return list(qs.values_list('student_id', flat=True).distinct())

    def _get_allowed_section_ids(self, filters):
        if not self.user:
            return None

        if getattr(self.user, 'is_platform_admin', False) or getattr(self.user, 'is_superuser', False):
            return None

        role_codes = set(self.user.roles.filter(is_active=True).values_list('code', flat=True))
        if 'teacher' not in role_codes:
            return None

        if filters.get('section_id'):
            return [filters['section_id']]

        try:
            from staff.models import Staff
            from timetable.models import SubjectAssignment

            staff = Staff.objects.filter(user=self.user, tenant=self.tenant).first()
            if not staff:
                return []

            return list(
                SubjectAssignment.objects.filter(
                    teacher=staff,
                    is_active=True
                ).values_list('section_id', flat=True).distinct()
            )
        except Exception:
            return []

    def _get_segmented_performance(self, results, segment_by):
        if segment_by == 'gender':
            return list(
                results.values('enrollment__student__gender').annotate(
                    avg_marks=Avg('marks_obtained'),
                    count=Count('id')
                )
            )

        if segment_by == 'section':
            return list(
                results.values('enrollment__section__name').annotate(
                    avg_marks=Avg('marks_obtained'),
                    count=Count('id')
                )
            )

        if segment_by == 'grade':
            return list(
                results.values('enrollment__section__grade_level__name').annotate(
                    avg_marks=Avg('marks_obtained'),
                    count=Count('id')
                )
            )

        return []
