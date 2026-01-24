"""
Analytics Service for Dashboard
Provides tenant-level insights and metrics with Redis caching
"""

from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Service for generating dashboard analytics.
    Uses Redis caching for performance.
    """
    
    CACHE_TIMEOUT = 300  # 5 minutes
    
    def __init__(self, tenant):
        self.tenant = tenant
    
    def get_overview_stats(self):
        """
        Get high-level overview statistics.
        Cached for performance.
        
        Returns:
            dict: Overview statistics
        """
        cache_key = f"dashboard_stats_{self.tenant.id}"
        stats = cache.get(cache_key)

        if stats is None:
            try:
                from .services import WidgetDataService
                from tenants.models import Section
                from students.models import StudentEnrollment
                from exams.models import ExamSchedule

                widget_service = WidgetDataService(self.tenant)
                overview = widget_service._get_overview_stats({})

                today = timezone.now().date()
                next_week = today + timedelta(days=7)
                thirty_days_ago = today - timedelta(days=30)

                stats = {
                    'total_students': overview.get('total_students', 0),
                    'total_staff': overview.get('total_staff', 0),
                    'active_classes': Section.objects.filter(tenant=self.tenant, is_active=True).count(),
                    'pending_fees': overview.get('pending_fees', 0),
                    'today_attendance_rate': overview.get('attendance_rate', 0),
                    'upcoming_exams': ExamSchedule.objects.filter(
                        tenant=self.tenant,
                        exam_date__gte=today,
                        exam_date__lte=next_week
                    ).count(),
                    'recent_admissions': StudentEnrollment.objects.filter(
                        tenant=self.tenant,
                        enrollment_date__gte=thirty_days_ago,
                        status='ACTIVE'
                    ).count(),
                    'storage_used_gb': 0.0,
                }
            except Exception as e:
                logger.exception("Failed to compute overview stats: %s", e)
                stats = {
                    'total_students': 0,
                    'total_staff': 0,
                    'active_classes': 0,
                    'pending_fees': 0,
                    'today_attendance_rate': 0.0,
                    'upcoming_exams': 0,
                    'recent_admissions': 0,
                    'storage_used_gb': 0.0,
                }

            cache.set(cache_key, stats, self.CACHE_TIMEOUT)

        return stats
    
    def get_academic_heatmap(self):
        """
        Generate academic performance heatmap.
        Shows class-subject performance matrix.
        
        Returns:
            {
                'classes': ['Class 1A', 'Class 1B', ...],
                'subjects': ['Math', 'Science', ...],
                'data': [[85, 78, 92], ...],  # Scores matrix
                'alerts': [
                    {
                        'class': 'Class 5B',
                        'subject': 'Math',
                        'score': 62,
                        'change': -10,
                        'message': 'Class 5B Math scores dropped by 10%'
                    }
                ]
            }
        """
        cache_key = f"academic_heatmap_{self.tenant.id}"
        heatmap = cache.get(cache_key)
        
        if heatmap is None:
            try:
                from attendance.models import AttendanceRecord
                from students.models import StudentEnrollment
                from tenants.models import Section

                today = timezone.now().date()
                start_date = today - timedelta(days=30)
                current_year = self._get_current_academic_year()

                heatmap_data = []
                sections = Section.objects.filter(
                    tenant=self.tenant,
                    is_active=True
                ).select_related('grade_level')

                for section in sections:
                    enrollment_qs = StudentEnrollment.objects.filter(
                        tenant=self.tenant,
                        section=section,
                        status='ACTIVE'
                    )
                    if current_year:
                        enrollment_qs = enrollment_qs.filter(academic_year=current_year)

                    student_ids = list(enrollment_qs.values_list('student_id', flat=True))

                    section_data = {
                        'section': str(section),
                        'class': str(section.grade_level) if section.grade_level else 'N/A',
                        'data': []
                    }

                    for i in range(31):
                        date = start_date + timedelta(days=i)
                        attendance = AttendanceRecord.objects.filter(
                            tenant=self.tenant,
                            student_id__in=student_ids,
                            record_type='STUDENT',
                            date=date
                        )
                        total = attendance.count()
                        present = attendance.filter(status__in=['PRESENT', 'LATE', 'HALF_DAY']).count()

                        rate = round(present / total * 100, 1) if total > 0 else None
                        section_data['data'].append({
                            'date': date.isoformat(),
                            'rate': rate
                        })

                    heatmap_data.append(section_data)

                heatmap = {
                    'data': heatmap_data
                }
            except Exception as e:
                logger.exception("Failed to compute attendance heatmap: %s", e)
                heatmap = {'data': []}

            cache.set(cache_key, heatmap, self.CACHE_TIMEOUT)
        
        return heatmap
    
    def get_financial_health(self):
        """
        Get financial health metrics.
        
        Returns:
            {
                'cash_flow': {
                    'collections': Decimal,
                    'expenses': Decimal,
                    'net': Decimal
                },
                'ageing_report': {
                    'current': Decimal,
                    '30_60_days': Decimal,
                    '60_90_days': Decimal,
                    'over_90_days': Decimal
                },
                'collection_rate': float,
                'monthly_trend': [...]
            }
        """
        cache_key = f"financial_health_{self.tenant.id}"
        health = cache.get(cache_key)
        
        if health is None:
            from fees.models import FeeInvoice, FeeTransaction
            from finance.models import JournalEntryLine

            today = timezone.now().date()
            this_month_start = today.replace(day=1)

            collections = FeeTransaction.objects.filter(
                tenant=self.tenant,
                transaction_date__date__gte=this_month_start
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

            expenses = JournalEntryLine.objects.filter(
                entry__tenant=self.tenant,
                entry__is_posted=True,
                account__account_type='EXPENSE',
                entry__entry_date__gte=this_month_start
            ).aggregate(total=Sum('debit_amount'))['total'] or Decimal('0')

            total_due = FeeInvoice.objects.filter(
                tenant=self.tenant
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

            total_paid = FeeInvoice.objects.filter(
                tenant=self.tenant
            ).aggregate(total=Sum('paid_amount'))['total'] or Decimal('0')

            collection_rate = float(total_paid / total_due * 100) if total_due > 0 else 0.0

            pending_total = FeeInvoice.objects.filter(
                tenant=self.tenant,
                balance_amount__gt=0
            ).aggregate(total=Sum('balance_amount'))['total'] or Decimal('0')

            health = {
                'cash_flow': {
                    'collections': float(collections),
                    'expenses': float(expenses),
                    'net': float(collections - expenses),
                },
                'ageing_report': {
                    'current': float(pending_total),
                    '30_60_days': float(self._get_outstanding_fees(30, 60)),
                    '60_90_days': float(self._get_outstanding_fees(60, 90)),
                    'over_90_days': float(self._get_outstanding_fees(90, 999)),
                },
                'collection_rate': collection_rate,
                'monthly_trend': self._get_monthly_collection_trend(),
            }

            cache.set(cache_key, health, self.CACHE_TIMEOUT)
        
        return health
    
    def get_staff_efficiency(self):
        """
        Get staff efficiency metrics.
        Correlates attendance with syllabus completion.
        
        Returns:
            [
                {
                    'teacher_id': str,
                    'teacher_name': str,
                    'attendance_rate': float,
                    'syllabus_completion': float,
                    'student_satisfaction': float
                }
            ]
        """
        cache_key = f"staff_efficiency_{self.tenant.id}"
        efficiency = cache.get(cache_key)
        
        if efficiency is None:
            # This would query actual staff and performance data
            # Placeholder with realistic structure
            efficiency = [
                {
                    'teacher_id': '1',
                    'teacher_name': 'John Doe',
                    'subject': 'Mathematics',
                    'attendance_rate': 95.5,
                    'syllabus_completion': 87.3,
                    'student_satisfaction': 4.5,
                },
                {
                    'teacher_id': '2',
                    'teacher_name': 'Jane Smith',
                    'subject': 'Science',
                    'attendance_rate': 88.2,
                    'syllabus_completion': 92.1,
                    'student_satisfaction': 4.7,
                },
                {
                    'teacher_id': '3',
                    'teacher_name': 'Mike Johnson',
                    'subject': 'English',
                    'attendance_rate': 92.0,
                    'syllabus_completion': 85.5,
                    'student_satisfaction': 4.3,
                },
            ]
            cache.set(cache_key, efficiency, self.CACHE_TIMEOUT)
        
        return efficiency
    
    def get_attendance_trends(self):
        """
        Get attendance trends over time.
        
        Returns:
            {
                'daily': [...],
                'weekly': [...],
                'by_class': [...]
            }
        """
        return {
            'daily': self._get_daily_attendance_trend(),
            'weekly': self._get_weekly_attendance_trend(),
            'by_class': self._get_attendance_by_class(),
        }
    
    def invalidate_cache(self):
        """Invalidate all cached analytics for this tenant."""
        cache_keys = [
            f"dashboard_stats_{self.tenant.id}",
            f"academic_heatmap_{self.tenant.id}",
            f"financial_health_{self.tenant.id}",
            f"staff_efficiency_{self.tenant.id}",
        ]
        cache.delete_many(cache_keys)
    
    # Private helper methods
    
    def _get_total_students(self):
        """Get total active students."""
        # from students.models import Student
        # return Student.objects.filter(tenant=self.tenant, is_active=True).count()
        return 0  # Placeholder
    
    def _get_total_staff(self):
        """Get total active staff."""
        # from staff.models import Staff
        # return Staff.objects.filter(tenant=self.tenant, is_active=True).count()
        return 0  # Placeholder
    
    def _get_active_classes(self):
        """Get total active classes."""
        # from academics.models import Class
        # return Class.objects.filter(tenant=self.tenant, is_active=True).count()
        return 0  # Placeholder
    
    def _get_pending_fees(self):
        """Get total pending fees amount."""
        # from fees.models import FeePayment
        # return FeePayment.objects.filter(
        #     tenant=self.tenant,
        #     status='pending'
        # ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return Decimal('0')  # Placeholder
    
    def _get_today_attendance_rate(self):
        """Get today's attendance rate percentage."""
        # today = timezone.now().date()
        # from attendance.models import Attendance
        # total = Attendance.objects.filter(tenant=self.tenant, date=today).count()
        # present = Attendance.objects.filter(
        #     tenant=self.tenant, date=today, status='present'
        # ).count()
        # return (present / total * 100) if total > 0 else 0
        return 0.0  # Placeholder
    
    def _get_upcoming_exams(self):
        """Get count of upcoming exams in next 7 days."""
        # next_week = timezone.now() + timedelta(days=7)
        # from exams.models import Exam
        # return Exam.objects.filter(
        #     tenant=self.tenant,
        #     date__lte=next_week,
        #     date__gte=timezone.now()
        # ).count()
        return 0  # Placeholder
    
    def _get_recent_admissions(self):
        """Get count of admissions in last 30 days."""
        # thirty_days_ago = timezone.now() - timedelta(days=30)
        # from students.models import Student
        # return Student.objects.filter(
        #     tenant=self.tenant,
        #     admission_date__gte=thirty_days_ago
        # ).count()
        return 0  # Placeholder
    
    def _get_storage_used(self):
        """Get storage used in GB."""
        # This would calculate actual storage usage
        return 0.0  # Placeholder
    
    def _get_collections(self, start_date):
        """Get total collections since start_date."""
        from fees.models import FeeTransaction

        return FeeTransaction.objects.filter(
            tenant=self.tenant,
            transaction_date__gte=start_date
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    def _get_expenses(self, start_date):
        """Get total expenses since start_date."""
        return Decimal('0')
    
    def _get_outstanding_fees(self, min_days, max_days):
        """Get outstanding fees for specific age range."""
        from fees.models import FeeInvoice

        today = timezone.now().date()
        qs = FeeInvoice.objects.filter(
            tenant=self.tenant,
            balance_amount__gt=0
        )

        if min_days == 0 and max_days == 0:
            qs = qs.filter(due_date__gte=today)
        else:
            start_date = today - timedelta(days=max_days)
            end_date = today - timedelta(days=min_days)
            qs = qs.filter(due_date__gte=start_date, due_date__lt=end_date)

        return qs.aggregate(total=Sum('balance_amount'))['total'] or Decimal('0')
    
    def _get_collection_rate(self):
        """Calculate collection rate percentage."""
        from fees.models import FeeInvoice

        total_due = FeeInvoice.objects.filter(
            tenant=self.tenant
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        total_paid = FeeInvoice.objects.filter(
            tenant=self.tenant
        ).aggregate(total=Sum('paid_amount'))['total'] or Decimal('0')

        return float(total_paid / total_due * 100) if total_due > 0 else 0.0
    
    def _get_monthly_collection_trend(self):
        """Get monthly collection trend for last 6 months."""
        from fees.models import FeeTransaction

        today = timezone.now().date().replace(day=1)
        start_month = today - timedelta(days=30 * 5)

        transactions = FeeTransaction.objects.filter(
            tenant=self.tenant,
            transaction_date__date__gte=start_month
        ).annotate(
            month=TruncMonth('transaction_date')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')

        return [
            {
                'month': item['month'].strftime('%Y-%m'),
                'amount': float(item['total'] or 0)
            }
            for item in transactions
        ]
    
    def _get_daily_attendance_trend(self):
        """Get daily attendance trend for last 30 days."""
        from attendance.models import AttendanceRecord

        today = timezone.now().date()
        start_date = today - timedelta(days=29)

        trend = []
        for i in range(30):
            date = start_date + timedelta(days=i)
            qs = AttendanceRecord.objects.filter(
                tenant=self.tenant,
                record_type='STUDENT',
                date=date
            )
            total = qs.count()
            present = qs.filter(status__in=['PRESENT', 'LATE', 'HALF_DAY']).count()
            rate = round(present / total * 100, 1) if total > 0 else 0

            trend.append({
                'date': date.isoformat(),
                'rate': rate,
                'present': present,
                'total': total
            })

        return trend
    
    def _get_weekly_attendance_trend(self):
        """Get weekly attendance trend for last 12 weeks."""
        from attendance.models import AttendanceRecord

        today = timezone.now().date()
        start_week = today - timedelta(weeks=11)
        trend = []

        for i in range(12):
            week_start = start_week + timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)

            qs = AttendanceRecord.objects.filter(
                tenant=self.tenant,
                record_type='STUDENT',
                date__gte=week_start,
                date__lte=week_end
            )
            total = qs.count()
            present = qs.filter(status__in=['PRESENT', 'LATE', 'HALF_DAY']).count()
            rate = round(present / total * 100, 1) if total > 0 else 0

            trend.append({
                'week_start': week_start.isoformat(),
                'week_end': week_end.isoformat(),
                'rate': rate,
                'present': present,
                'total': total
            })

        return trend
    
    def _get_attendance_by_class(self):
        """Get attendance rates by class."""
        from attendance.models import AttendanceRecord
        from students.models import StudentEnrollment
        from tenants.models import Section

        today = timezone.now().date()
        start_date = today - timedelta(days=30)
        current_year = self._get_current_academic_year()

        results = []
        sections = Section.objects.filter(
            tenant=self.tenant,
            is_active=True
        ).select_related('grade_level')

        for section in sections:
            enrollment_qs = StudentEnrollment.objects.filter(
                tenant=self.tenant,
                section=section,
                status='ACTIVE'
            )
            if current_year:
                enrollment_qs = enrollment_qs.filter(academic_year=current_year)

            student_ids = list(enrollment_qs.values_list('student_id', flat=True))
            if not student_ids:
                results.append({
                    'section': str(section),
                    'class': str(section.grade_level) if section.grade_level else 'N/A',
                    'rate': 0,
                    'present': 0,
                    'total': 0
                })
                continue

            qs = AttendanceRecord.objects.filter(
                tenant=self.tenant,
                record_type='STUDENT',
                student_id__in=student_ids,
                date__gte=start_date,
                date__lte=today
            )
            total = qs.count()
            present = qs.filter(status__in=['PRESENT', 'LATE', 'HALF_DAY']).count()
            rate = round(present / total * 100, 1) if total > 0 else 0

            results.append({
                'section': str(section),
                'class': str(section.grade_level) if section.grade_level else 'N/A',
                'rate': rate,
                'present': present,
                'total': total
            })

        return results

    def _get_current_academic_year(self):
        """Get current academic year."""
        from tenants.models import AcademicYear

        try:
            return AcademicYear.objects.get(
                tenant=self.tenant,
                is_current=True
            )
        except AcademicYear.DoesNotExist:
            return None


class SuperAdminAnalytics:
    """
    Analytics for platform super admins.
    System-wide metrics and health monitoring.
    """
    
    CACHE_TIMEOUT = 600  # 10 minutes
    
    def get_system_health(self):
        """
        Get system-wide health metrics.
        
        Returns:
            {
                'total_tenants': int,
                'active_subscriptions': int,
                'trial_subscriptions': int,
                'past_due_subscriptions': int,
                'total_revenue_this_month': Decimal,
                'tenant_growth': [...],
                'error_rate': float
            }
        """
        cache_key = "system_health_metrics"
        health = cache.get(cache_key)
        
        if health is None:
            from tenants.models import Tenant
            from billing.models import Subscription
            
            health = {
                'total_tenants': Tenant.objects.count(),
                'active_tenants': Tenant.objects.filter(is_active=True).count(),
                'active_subscriptions': Subscription.objects.filter(
                    status='active'
                ).count(),
                'trial_subscriptions': Subscription.objects.filter(
                    status='trial'
                ).count(),
                'past_due_subscriptions': Subscription.objects.filter(
                    status='past_due'
                ).count(),
                'total_revenue_this_month': float(self._get_monthly_revenue()),
                'tenant_growth': self._get_tenant_growth(),
                'error_rate': self._get_error_rate(),
            }
            cache.set(cache_key, health, self.CACHE_TIMEOUT)
        
        return health
    
    def get_tenant_growth(self):
        """
        Get tenant growth over time.
        
        Returns:
            [
                {'month': '2024-01', 'count': 10},
                {'month': '2024-02', 'count': 15},
                ...
            ]
        """
        from tenants.models import Tenant
        
        growth = Tenant.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        return [
            {
                'month': item['month'].strftime('%Y-%m'),
                'count': item['count']
            }
            for item in growth
        ]
    
    def get_revenue_trend(self):
        """Get revenue trend over time."""
        from billing.models import Invoice
        
        revenue = Invoice.objects.filter(
            status='paid'
        ).annotate(
            month=TruncMonth('paid_at')
        ).values('month').annotate(
            total=Sum('total_amount')
        ).order_by('month')
        
        return [
            {
                'month': item['month'].strftime('%Y-%m'),
                'revenue': float(item['total'])
            }
            for item in revenue
        ]
    
    def _get_monthly_revenue(self):
        """Get revenue for current month."""
        from billing.models import Invoice
        
        this_month_start = timezone.now().replace(day=1, hour=0, minute=0)
        
        return Invoice.objects.filter(
            status='paid',
            paid_at__gte=this_month_start
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    
    def _get_error_rate(self):
        """Get system error rate."""
        # This would integrate with logging/monitoring system
        return 0.0  # Placeholder
