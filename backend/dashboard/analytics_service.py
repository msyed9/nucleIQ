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
            stats = {
                'total_students': self._get_total_students(),
                'total_staff': self._get_total_staff(),
                'active_classes': self._get_active_classes(),
                'pending_fees': self._get_pending_fees(),
                'today_attendance_rate': self._get_today_attendance_rate(),
                'upcoming_exams': self._get_upcoming_exams(),
                'recent_admissions': self._get_recent_admissions(),
                'storage_used_gb': self._get_storage_used(),
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
            # This would query actual exam results
            # Placeholder with realistic structure
            heatmap = {
                'classes': ['Class 5A', 'Class 5B', 'Class 6A', 'Class 6B'],
                'subjects': ['Math', 'Science', 'English', 'Social Studies'],
                'data': [
                    [85, 78, 92, 88],  # Class 5A
                    [72, 81, 88, 85],  # Class 5B (Math low)
                    [90, 85, 87, 91],  # Class 6A
                    [88, 89, 90, 87],  # Class 6B
                ],
                'alerts': [
                    {
                        'class': 'Class 5B',
                        'subject': 'Math',
                        'score': 72,
                        'change': -10,
                        'severity': 'high',
                        'message': 'Class 5B Math scores dropped by 10%'
                    }
                ]
            }
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
            this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
            
            collections = self._get_collections(this_month_start)
            expenses = self._get_expenses(this_month_start)
            
            health = {
                'cash_flow': {
                    'collections': float(collections),
                    'expenses': float(expenses),
                    'net': float(collections - expenses),
                },
                'ageing_report': {
                    'current': float(self._get_outstanding_fees(0, 30)),
                    '30_60_days': float(self._get_outstanding_fees(30, 60)),
                    '60_90_days': float(self._get_outstanding_fees(60, 90)),
                    'over_90_days': float(self._get_outstanding_fees(90, 999)),
                },
                'collection_rate': self._get_collection_rate(),
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
        # from fees.models import FeePayment
        # return FeePayment.objects.filter(
        #     tenant=self.tenant,
        #     paid_at__gte=start_date,
        #     status='paid'
        # ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return Decimal('0')  # Placeholder
    
    def _get_expenses(self, start_date):
        """Get total expenses since start_date."""
        # from finance.models import Expense
        # return Expense.objects.filter(
        #     tenant=self.tenant,
        #     date__gte=start_date
        # ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return Decimal('0')  # Placeholder
    
    def _get_outstanding_fees(self, min_days, max_days):
        """Get outstanding fees for specific age range."""
        # Calculate fees outstanding for specific age range
        # This would query FeePayment with date calculations
        return Decimal('0')  # Placeholder
    
    def _get_collection_rate(self):
        """Calculate collection rate percentage."""
        # total_expected = self._get_total_expected_fees()
        # total_collected = self._get_total_collected_fees()
        # return (total_collected / total_expected * 100) if total_expected > 0 else 0
        return 0.0  # Placeholder
    
    def _get_monthly_collection_trend(self):
        """Get monthly collection trend for last 6 months."""
        # This would return monthly collection data
        return []  # Placeholder
    
    def _get_daily_attendance_trend(self):
        """Get daily attendance trend for last 30 days."""
        return []  # Placeholder
    
    def _get_weekly_attendance_trend(self):
        """Get weekly attendance trend for last 12 weeks."""
        return []  # Placeholder
    
    def _get_attendance_by_class(self):
        """Get attendance rates by class."""
        return []  # Placeholder


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
