"""
URL Configuration for Analytics API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from analytics.api.v1.views import AlertRuleViewSet, AlertEventViewSet


class PlatformOverviewView(APIView):
    """
    Platform overview analytics endpoint.
    Returns key metrics for the analytics dashboard.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]

    def get(self, request):
        from students.models import Student
        from staff.models import Staff
        from attendance.models import AttendanceRecord
        from fees.models import FeeTransaction

        tenant = request.user.tenant
        today = timezone.now().date()
        month_start = today.replace(day=1)

        # Get student count
        total_students = Student.objects.filter(tenant=tenant, status='ACTIVE').count()
        
        # Get staff count
        total_staff = Staff.objects.filter(tenant=tenant, is_active=True).count()

        # Get today's attendance rate
        try:
            today_attendance = AttendanceRecord.objects.filter(
                tenant=tenant,
                date=today
            )
            present_count = today_attendance.filter(status__in=['PRESENT', 'LATE']).count()
            total_marked = today_attendance.count()
            attendance_rate = round((present_count / total_marked * 100), 1) if total_marked > 0 else 0
        except Exception:
            attendance_rate = 0

        # Get monthly fee collection
        try:
            monthly_collection = FeeTransaction.objects.filter(
                tenant=tenant,
                transaction_date__date__gte=month_start
            ).aggregate(total=Count('id'))['total'] or 0
        except Exception:
            monthly_collection = 0

        return Response({
            'total_students': total_students,
            'total_staff': total_staff,
            'attendance_rate': attendance_rate,
            'monthly_transactions': monthly_collection,
            'platform_health': 95,  # Placeholder
            'active_modules': 12,   # Placeholder
        })


class TenantMetricsView(APIView):
    """
    Tenant-specific metrics for the analytics dashboard.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]

    def get(self, request):
        from students.models import Student
        from tenants.models import GradeLevel

        tenant = request.user.tenant
        
        # Get student distribution by class using StudentEnrollment
        from students.models import StudentEnrollment
        grade_levels = GradeLevel.objects.filter(tenant=tenant).order_by('display_order')
        class_distribution = []
        
        for grade in grade_levels:
            count = StudentEnrollment.objects.filter(
                tenant=tenant,
                section__grade_level=grade,
                status='ACTIVE',
                is_deleted=False
            ).values('student_id').distinct().count()
            class_distribution.append({
                'class_name': grade.name,
                'count': count
            })

        # Gender distribution
        gender_stats = Student.objects.filter(
            tenant=tenant,
            status='ACTIVE'
        ).values('gender').annotate(count=Count('id'))

        gender_distribution = {
            stat['gender'].lower(): stat['count'] 
            for stat in gender_stats if stat['gender']
        }

        return Response({
            'class_distribution': class_distribution,
            'gender_distribution': gender_distribution,
            'results': class_distribution,  # For backwards compatibility
        })


router = DefaultRouter()
router.register(r'alert-rules', AlertRuleViewSet, basename='alert-rules')
router.register(r'alert-events', AlertEventViewSet, basename='alert-events')

urlpatterns = [
    path('', include(router.urls)),
    path('platform/overview/', PlatformOverviewView.as_view(), name='platform-overview'),
    path('metrics/', TenantMetricsView.as_view(), name='tenant-metrics'),
]

