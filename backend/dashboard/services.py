"""
Dashboard Services for NucleiQ
Business logic for dashboard operations, widget data, and leaderboards
"""

from django.db.models import Count, Sum, Avg, Q, F, Max
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for managing dashboards and layouts."""
    
    @staticmethod
    def get_default_layout_for_role(role_code, tenant=None):
        """
        Get the default dashboard layout for a specific role.
        
        Args:
            role_code: Role code (e.g., 'principal', 'teacher', 'parent')
            tenant: Tenant instance (optional, for tenant-specific layouts)
        
        Returns:
            list: Layout configuration
        """
        from .models import RoleDefaultLayout
        
        # Try to get tenant-specific layout first
        if tenant:
            try:
                layout = RoleDefaultLayout.objects.get(
                    tenant=tenant,
                    role_code=role_code,
                    is_active=True
                )
                return layout.layout
            except RoleDefaultLayout.DoesNotExist:
                pass
        
        # Return system default layouts based on role
        return DashboardService._get_system_default_layout(role_code)
    
    @staticmethod
    def _get_system_default_layout(role_code):
        """Get system default layout based on role."""
        layouts = {
            'principal': [
                {'i': 'overview_stats', 'x': 0, 'y': 0, 'w': 12, 'h': 2, 'minW': 6, 'minH': 2},
                {'i': 'student_enrollment_chart', 'x': 0, 'y': 2, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'fee_collection_chart', 'x': 6, 'y': 2, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'attendance_heatmap', 'x': 0, 'y': 6, 'w': 8, 'h': 4, 'minW': 6, 'minH': 3},
                {'i': 'leaderboard_academic', 'x': 8, 'y': 6, 'w': 4, 'h': 4, 'minW': 3, 'minH': 3},
                {'i': 'recent_activity', 'x': 0, 'y': 10, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'upcoming_events', 'x': 6, 'y': 10, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
            ],
            'teacher': [
                {'i': 'my_classes_today', 'x': 0, 'y': 0, 'w': 4, 'h': 3, 'minW': 3, 'minH': 2},
                {'i': 'attendance_quick', 'x': 4, 'y': 0, 'w': 4, 'h': 3, 'minW': 3, 'minH': 2},
                {'i': 'pending_tasks', 'x': 8, 'y': 0, 'w': 4, 'h': 3, 'minW': 3, 'minH': 2},
                {'i': 'class_leaderboard', 'x': 0, 'y': 3, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'homework_status', 'x': 6, 'y': 3, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'timetable_today', 'x': 0, 'y': 7, 'w': 12, 'h': 3, 'minW': 6, 'minH': 2},
            ],
            'student': [
                {'i': 'my_schedule_today', 'x': 0, 'y': 0, 'w': 6, 'h': 3, 'minW': 4, 'minH': 2},
                {'i': 'my_attendance', 'x': 6, 'y': 0, 'w': 3, 'h': 3, 'minW': 2, 'minH': 2},
                {'i': 'my_rank', 'x': 9, 'y': 0, 'w': 3, 'h': 3, 'minW': 2, 'minH': 2},
                {'i': 'pending_homework', 'x': 0, 'y': 3, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'class_leaderboard', 'x': 6, 'y': 3, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'recent_results', 'x': 0, 'y': 7, 'w': 12, 'h': 3, 'minW': 6, 'minH': 2},
            ],
            'parent': [
                {'i': 'children_overview', 'x': 0, 'y': 0, 'w': 12, 'h': 3, 'minW': 6, 'minH': 2},
                {'i': 'attendance_summary', 'x': 0, 'y': 3, 'w': 4, 'h': 4, 'minW': 3, 'minH': 3},
                {'i': 'fee_summary', 'x': 4, 'y': 3, 'w': 4, 'h': 4, 'minW': 3, 'minH': 3},
                {'i': 'academic_progress', 'x': 8, 'y': 3, 'w': 4, 'h': 4, 'minW': 3, 'minH': 3},
                {'i': 'recent_remarks', 'x': 0, 'y': 7, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'homework_pending', 'x': 6, 'y': 7, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'school_announcements', 'x': 0, 'y': 11, 'w': 12, 'h': 3, 'minW': 6, 'minH': 2},
            ],
            'accountant': [
                {'i': 'fee_overview', 'x': 0, 'y': 0, 'w': 12, 'h': 2, 'minW': 6, 'minH': 2},
                {'i': 'fee_collection_chart', 'x': 0, 'y': 2, 'w': 8, 'h': 4, 'minW': 6, 'minH': 3},
                {'i': 'pending_dues', 'x': 8, 'y': 2, 'w': 4, 'h': 4, 'minW': 3, 'minH': 3},
                {'i': 'recent_payments', 'x': 0, 'y': 6, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
                {'i': 'fee_defaulters', 'x': 6, 'y': 6, 'w': 6, 'h': 4, 'minW': 4, 'minH': 3},
            ],
        }
        
        return layouts.get(role_code, layouts.get('teacher', []))
    
    @staticmethod
    def get_parent_dashboard_config(tenant):
        """Get active parent dashboard configuration for a tenant."""
        from .models import ParentDashboardConfig
        
        try:
            return ParentDashboardConfig.objects.get(
                tenant=tenant,
                is_active=True
            )
        except ParentDashboardConfig.DoesNotExist:
            # Return default config
            return None
    
    @staticmethod
    def initialize_user_dashboard(user):
        """Initialize a dashboard layout for a new user."""
        from .models import DashboardLayout
        
        layout, created = DashboardLayout.objects.get_or_create(user=user)
        
        if created:
            # Get the user's primary role
            role = user.roles.first()
            role_code = role.code if role else 'staff'
            
            # For parents, check if tenant has custom config
            if hasattr(user, 'is_parent') and user.is_parent:
                role_code = 'parent'
            
            # Set default layout
            layout.layout = DashboardService.get_default_layout_for_role(
                role_code, 
                user.tenant
            )
            layout.save(update_fields=['layout'])
        
        return layout


class LeaderboardService:
    """Service for managing leaderboards and rankings."""
    
    def __init__(self, tenant):
        self.tenant = tenant
    
    def update_all_leaderboards(self):
        """Update all active leaderboards for the tenant."""
        from .models import Leaderboard
        
        leaderboards = Leaderboard.objects.filter(
            tenant=self.tenant,
            is_active=True
        )
        
        for leaderboard in leaderboards:
            self.update_leaderboard(leaderboard)
    
    def update_leaderboard(self, leaderboard):
        """Update a specific leaderboard with current rankings."""
        from .models import LeaderboardEntry
        
        # Get period dates
        period_start, period_end = self._get_period_dates(leaderboard.period)
        
        # Get previous entries for rank change calculation
        previous_entries = {
            (e.student_id or e.staff_id or e.section_id): e.rank
            for e in LeaderboardEntry.objects.filter(
                leaderboard=leaderboard,
                period_end__lt=period_start
            ).order_by('-period_end')[:leaderboard.max_entries * 3]
        }
        
        # Calculate rankings based on type
        if leaderboard.leaderboard_type == 'ACADEMIC':
            rankings = self._calculate_academic_rankings(leaderboard, period_start, period_end)
        elif leaderboard.leaderboard_type == 'ATTENDANCE':
            rankings = self._calculate_attendance_rankings(leaderboard, period_start, period_end)
        elif leaderboard.leaderboard_type == 'HOMEWORK':
            rankings = self._calculate_homework_rankings(leaderboard, period_start, period_end)
        elif leaderboard.leaderboard_type == 'BEHAVIOR':
            rankings = self._calculate_behavior_rankings(leaderboard, period_start, period_end)
        elif leaderboard.leaderboard_type == 'TEACHER_ATTENDANCE':
            rankings = self._calculate_teacher_attendance_rankings(leaderboard, period_start, period_end)
        elif leaderboard.leaderboard_type == 'TEACHER_PERFORMANCE':
            rankings = self._calculate_teacher_performance_rankings(leaderboard, period_start, period_end)
        else:
            rankings = []
        
        # Clear old entries for this period
        LeaderboardEntry.objects.filter(
            leaderboard=leaderboard,
            period_start=period_start,
            period_end=period_end
        ).delete()
        
        # Create new entries
        entries = []
        for rank, ranking in enumerate(rankings[:leaderboard.max_entries], start=1):
            entity_id = ranking.get('student_id') or ranking.get('staff_id') or ranking.get('section_id')
            previous_rank = previous_entries.get(entity_id)
            
            entry = LeaderboardEntry(
                tenant=self.tenant,
                leaderboard=leaderboard,
                student_id=ranking.get('student_id'),
                staff_id=ranking.get('staff_id'),
                section_id=ranking.get('section_id'),
                rank=rank,
                previous_rank=previous_rank,
                score=Decimal(str(ranking.get('score', 0))),
                period_start=period_start,
                period_end=period_end,
                details=ranking.get('details', {})
            )
            entries.append(entry)
        
        LeaderboardEntry.objects.bulk_create(entries)
        
        return len(entries)
    
    def _get_period_dates(self, period):
        """Get start and end dates for the specified period."""
        today = timezone.now().date()
        
        if period == 'DAILY':
            return today, today
        elif period == 'WEEKLY':
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return start, end
        elif period == 'MONTHLY':
            start = today.replace(day=1)
            next_month = (start + timedelta(days=32)).replace(day=1)
            end = next_month - timedelta(days=1)
            return start, end
        elif period == 'QUARTERLY':
            quarter = (today.month - 1) // 3
            start = date(today.year, quarter * 3 + 1, 1)
            end_month = quarter * 3 + 3
            if end_month > 12:
                end_month = 12
            next_quarter = date(today.year, end_month, 1) + timedelta(days=32)
            end = next_quarter.replace(day=1) - timedelta(days=1)
            return start, end
        elif period == 'YEARLY':
            start = date(today.year, 1, 1)
            end = date(today.year, 12, 31)
            return start, end
        else:  # ALL_TIME
            start = date(2000, 1, 1)
            end = today
            return start, end
    
    def _calculate_academic_rankings(self, leaderboard, period_start, period_end):
        """Calculate academic performance rankings."""
        from exams.models import ExamResult
        from students.models import StudentEnrollment
        
        queryset = ExamResult.objects.filter(
            student__tenant=self.tenant,
            exam__exam_date__gte=period_start,
            exam__exam_date__lte=period_end
        )
        
        # Apply section filter if set
        if leaderboard.section_filter:
            queryset = queryset.filter(
                student__enrollments__section=leaderboard.section_filter
            )
        elif leaderboard.class_filter:
            queryset = queryset.filter(
                student__enrollments__section__class_room=leaderboard.class_filter
            )
        
        # Calculate average percentage per student
        rankings = queryset.values('student_id').annotate(
            avg_score=Avg('percentage'),
            exam_count=Count('id')
        ).order_by('-avg_score')
        
        return [
            {
                'student_id': r['student_id'],
                'score': r['avg_score'] or 0,
                'details': {'exam_count': r['exam_count']}
            }
            for r in rankings
        ]
    
    def _calculate_attendance_rankings(self, leaderboard, period_start, period_end):
        """Calculate attendance rankings."""
        from attendance.models import Attendance
        from students.models import StudentEnrollment
        
        queryset = Attendance.objects.filter(
            tenant=self.tenant,
            date__gte=period_start,
            date__lte=period_end
        )
        
        if leaderboard.section_filter:
            queryset = queryset.filter(section=leaderboard.section_filter)
        elif leaderboard.class_filter:
            queryset = queryset.filter(section__class_room=leaderboard.class_filter)
        
        # Calculate attendance percentage per student
        rankings = queryset.values('student_id').annotate(
            total_days=Count('id'),
            present_days=Count('id', filter=Q(status='PRESENT'))
        ).order_by()
        
        result = []
        for r in rankings:
            if r['total_days'] > 0:
                percentage = (r['present_days'] / r['total_days']) * 100
                result.append({
                    'student_id': r['student_id'],
                    'score': percentage,
                    'details': {
                        'present_days': r['present_days'],
                        'total_days': r['total_days']
                    }
                })
        
        return sorted(result, key=lambda x: x['score'], reverse=True)
    
    def _calculate_homework_rankings(self, leaderboard, period_start, period_end):
        """Calculate homework completion rankings."""
        from academics.models import HomeworkCompletion
        
        queryset = HomeworkCompletion.objects.filter(
            homework__tenant=self.tenant,
            homework__due_date__gte=period_start,
            homework__due_date__lte=period_end
        )
        
        if leaderboard.section_filter:
            queryset = queryset.filter(homework__section=leaderboard.section_filter)
        elif leaderboard.class_filter:
            queryset = queryset.filter(homework__section__grade_level=leaderboard.class_filter)
        
        rankings = queryset.values('student_id').annotate(
            completed=Count('id', filter=Q(is_completed=True)),
            on_time=Count('id', filter=Q(is_late=False, is_completed=True)),
            total=Count('id')
        ).order_by()
        
        result = []
        for r in rankings:
            if r['total'] > 0:
                score = (r['completed'] / r['total']) * 70 + (r['on_time'] / r['total']) * 30
                result.append({
                    'student_id': r['student_id'],
                    'score': score,
                    'details': {
                        'completed': r['completed'],
                        'on_time': r['on_time'],
                        'total': r['total']
                    }
                })
        
        return sorted(result, key=lambda x: x['score'], reverse=True)
    
    def _calculate_behavior_rankings(self, leaderboard, period_start, period_end):
        """Calculate behavior/merit point rankings."""
        from students.models import StudentRemark
        
        queryset = StudentRemark.objects.filter(
            student__tenant=self.tenant,
            created_at__date__gte=period_start,
            created_at__date__lte=period_end
        )
        
        if leaderboard.section_filter:
            queryset = queryset.filter(
                student__enrollments__section=leaderboard.section_filter
            )
        
        # Calculate net points (positive - negative)
        rankings = queryset.values('student_id').annotate(
            positive_count=Count('id', filter=Q(remark_type='POSITIVE')),
            negative_count=Count('id', filter=Q(remark_type='NEGATIVE'))
        ).order_by()
        
        result = []
        for r in rankings:
            net_score = r['positive_count'] * 10 - r['negative_count'] * 5
            result.append({
                'student_id': r['student_id'],
                'score': max(net_score, 0),
                'details': {
                    'positive': r['positive_count'],
                    'negative': r['negative_count']
                }
            })
        
        return sorted(result, key=lambda x: x['score'], reverse=True)
    
    def _calculate_teacher_attendance_rankings(self, leaderboard, period_start, period_end):
        """Calculate teacher attendance rankings."""
        from attendance.models import StaffAttendance
        
        queryset = StaffAttendance.objects.filter(
            tenant=self.tenant,
            date__gte=period_start,
            date__lte=period_end
        )
        
        rankings = queryset.values('staff_id').annotate(
            total_days=Count('id'),
            present_days=Count('id', filter=Q(status='PRESENT'))
        ).order_by()
        
        result = []
        for r in rankings:
            if r['total_days'] > 0:
                percentage = (r['present_days'] / r['total_days']) * 100
                result.append({
                    'staff_id': r['staff_id'],
                    'score': percentage,
                    'details': {
                        'present_days': r['present_days'],
                        'total_days': r['total_days']
                    }
                })
        
        return sorted(result, key=lambda x: x['score'], reverse=True)
    
    def _calculate_teacher_performance_rankings(self, leaderboard, period_start, period_end):
        """Calculate teacher performance rankings based on student results."""
        from exams.models import ExamResult
        from timetable.models import SubjectAssignment
        
        # Get teachers and their classes
        assignments = SubjectAssignment.objects.filter(
            tenant=self.tenant,
            is_active=True
        ).values('teacher_id', 'section_id', 'subject_id')
        
        # Calculate average student performance per teacher
        teacher_scores = {}
        
        for assignment in assignments:
            results = ExamResult.objects.filter(
                student__enrollments__section_id=assignment['section_id'],
                subject_id=assignment['subject_id'],
                exam__exam_date__gte=period_start,
                exam__exam_date__lte=period_end
            ).aggregate(
                avg_score=Avg('percentage'),
                student_count=Count('student_id', distinct=True)
            )
            
            if results['avg_score']:
                teacher_id = assignment['teacher_id']
                if teacher_id not in teacher_scores:
                    teacher_scores[teacher_id] = {
                        'scores': [],
                        'student_count': 0
                    }
                teacher_scores[teacher_id]['scores'].append(results['avg_score'])
                teacher_scores[teacher_id]['student_count'] += results['student_count'] or 0
        
        result = []
        for teacher_id, data in teacher_scores.items():
            avg_score = sum(data['scores']) / len(data['scores'])
            result.append({
                'staff_id': teacher_id,
                'score': avg_score,
                'details': {
                    'classes_taught': len(data['scores']),
                    'students_taught': data['student_count']
                }
            })
        
        return sorted(result, key=lambda x: x['score'], reverse=True)
    
    def get_leaderboard_data(self, leaderboard_id):
        """Get leaderboard data with entity details."""
        from .models import Leaderboard, LeaderboardEntry
        from students.models import Student
        from staff.models import Staff
        
        try:
            leaderboard = Leaderboard.objects.get(
                id=leaderboard_id,
                tenant=self.tenant,
                is_active=True
            )
        except Leaderboard.DoesNotExist:
            return None
        
        # Get current period dates
        period_start, period_end = self._get_period_dates(leaderboard.period)
        
        entries = LeaderboardEntry.objects.filter(
            leaderboard=leaderboard,
            period_start=period_start,
            period_end=period_end
        ).select_related('student', 'staff', 'section').order_by('rank')
        
        result = {
            'id': leaderboard.id,
            'name': leaderboard.name,
            'type': leaderboard.leaderboard_type,
            'period': leaderboard.period,
            'icon': leaderboard.icon,
            'color': leaderboard.color,
            'show_scores': leaderboard.show_scores,
            'show_rank_change': leaderboard.show_rank_change,
            'period_start': period_start.isoformat(),
            'period_end': period_end.isoformat(),
            'entries': []
        }
        
        for entry in entries:
            entity_data = {}
            if entry.student:
                entity_data = {
                    'id': entry.student.id,
                    'name': entry.student.get_full_name(),
                    'type': 'student',
                    'photo': entry.student.photo.url if entry.student.photo else None,
                    'class': str(entry.student.get_current_enrollment().section) if entry.student.get_current_enrollment() else None
                }
            elif entry.staff:
                entity_data = {
                    'id': entry.staff.id,
                    'name': f"{entry.staff.first_name} {entry.staff.last_name}",
                    'type': 'staff',
                    'photo': entry.staff.photo.url if entry.staff.photo else None,
                    'designation': entry.staff.designation
                }
            elif entry.section:
                entity_data = {
                    'id': entry.section.id,
                    'name': str(entry.section),
                    'type': 'section'
                }
            
            result['entries'].append({
                'rank': entry.rank,
                'previous_rank': entry.previous_rank,
                'rank_change': entry.rank_change,
                'score': float(entry.score),
                'entity': entity_data,
                'details': entry.details
            })
        
        return result


class WidgetDataService:
    """Service for computing and caching widget data."""
    
    def __init__(self, tenant, user=None):
        self.tenant = tenant
        self.user = user
    
    def get_widget_data(self, widget_id, config=None):
        """Get data for a specific widget."""
        data_methods = {
            'overview_stats': self._get_overview_stats,
            'student_count': self._get_student_count,
            'staff_count': self._get_staff_count,
            'fee_trend_chart': self._get_fee_trend_data,
            'fee_collection_chart': self._get_fee_collection_data,
            'attendance_heatmap': self._get_attendance_heatmap,
            'recent_activity': self._get_recent_activity,
            'upcoming_events': self._get_upcoming_events,
            'leaderboard_academic': lambda c: self._get_leaderboard_data('ACADEMIC', c),
            'class_leaderboard': lambda c: self._get_leaderboard_data('ACADEMIC', c),
            'children_overview': self._get_children_overview,
            'attendance_summary': self._get_attendance_summary,
            'fee_summary': self._get_fee_summary,
            'academic_progress': self._get_academic_progress,
            'recent_remarks': self._get_recent_remarks,
            'homework_pending': self._get_homework_pending,
            'school_announcements': self._get_school_announcements,
            'my_classes_today': self._get_my_classes_today,
            'timetable_today': self._get_timetable_today,
            'pending_tasks': self._get_pending_tasks,
            'homework_status': self._get_homework_status,
            'my_schedule_today': self._get_my_schedule_today,
            'my_attendance': self._get_my_attendance,
            'my_rank': self._get_my_rank,
            'pending_homework': self._get_pending_homework,
            'recent_results': self._get_recent_results,
            'fee_overview': self._get_fee_overview,
            'pending_dues': self._get_pending_dues,
            'recent_payments': self._get_recent_payments,
            'fee_defaulters': self._get_fee_defaulters,
        }
        
        method = data_methods.get(widget_id)
        if method:
            try:
                return method(config or {})
            except Exception as e:
                logger.error(f"Error getting widget data for {widget_id}: {e}")
                return {'error': str(e)}
        
        return {'error': f'Unknown widget: {widget_id}'}
    
    def _get_overview_stats(self, config):
        """Get overview statistics."""
        from students.models import StudentEnrollment
        from staff.models import Staff
        from fees.models import FeeTransaction
        from attendance.models import AttendanceRecord
        
        today = timezone.now().date()
        current_year = self._get_current_academic_year()
        
        stats = {}
        
        # Student count
        student_qs = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            status='ACTIVE'
        )
        if current_year:
            student_qs = student_qs.filter(academic_year=current_year)
        stats['total_students'] = student_qs.count()
        
        # Staff count
        stats['total_staff'] = Staff.objects.filter(
            tenant=self.tenant,
            is_active=True
        ).count()
        
        # Today's attendance rate
        attendance_today = AttendanceRecord.objects.filter(
            tenant=self.tenant,
            date=today
        )
        total_today = attendance_today.count()
        present_today = attendance_today.filter(status='PRESENT').count()
        stats['attendance_rate'] = round(present_today / total_today * 100, 1) if total_today > 0 else 0
        
        # Fee collection this month
        month_start = today.replace(day=1)
        stats['fee_collected_this_month'] = FeeTransaction.objects.filter(
            tenant=self.tenant,
            transaction_date__date__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Pending fees
        stats['pending_fees'] = self._calculate_pending_fees()
        
        return stats
    
    def _get_student_count(self, config):
        """Get student count widget data."""
        from students.models import StudentEnrollment
        
        current_year = self._get_current_academic_year()
        
        count_qs = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            status='ACTIVE'
        )
        if current_year:
            count_qs = count_qs.filter(academic_year=current_year)
        count = count_qs.count()
        
        # Get last month's count for trend
        last_month = timezone.now().date().replace(day=1) - timedelta(days=1)
        last_month_qs = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            enrollment_date__lte=last_month
        )
        if current_year:
            last_month_qs = last_month_qs.filter(academic_year=current_year)
        last_month_count = last_month_qs.count()
        
        change = count - last_month_count
        
        return {
            'value': count,
            'change': change,
            'change_percentage': round(change / max(last_month_count, 1) * 100, 1)
        }
    
    def _get_staff_count(self, config):
        """Get staff count widget data."""
        from staff.models import Staff
        
        count = Staff.objects.filter(
            tenant=self.tenant,
            is_active=True
        ).count()
        
        return {'value': count}
    
    def _get_fee_trend_data(self, config):
        """Get fee collection trend data."""
        from fees.models import FeeTransaction
        
        period = config.get('period', 'monthly')
        today = timezone.now().date()
        
        data = []
        
        if period == 'weekly':
            for i in range(12):
                week_start = today - timedelta(weeks=11-i)
                week_end = week_start + timedelta(days=6)
                amount = FeeTransaction.objects.filter(
                    tenant=self.tenant,
                    transaction_date__date__gte=week_start,
                    transaction_date__date__lte=week_end
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                data.append({
                    'period': week_start.strftime('%d %b'),
                    'amount': float(amount)
                })
        else:  # monthly
            for i in range(12):
                month_date = today.replace(day=1) - timedelta(days=30*(11-i))
                month_start = month_date.replace(day=1)
                next_month = (month_start + timedelta(days=32)).replace(day=1)
                month_end = next_month - timedelta(days=1)
                
                amount = FeeTransaction.objects.filter(
                    tenant=self.tenant,
                    transaction_date__date__gte=month_start,
                    transaction_date__date__lte=month_end
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                data.append({
                    'period': month_start.strftime('%b %Y'),
                    'amount': float(amount)
                })
        
        return {'data': data}
    
    def _get_fee_collection_data(self, config):
        """Get detailed fee collection data."""
        return self._get_fee_trend_data(config)
    
    def _get_attendance_heatmap(self, config):
        """Get attendance heatmap data."""
        from attendance.models import AttendanceRecord
        from tenants.models import Section
        from students.models import StudentEnrollment
        
        today = timezone.now().date()
        start_date = today - timedelta(days=30)
        
        sections = Section.objects.filter(
            tenant=self.tenant,
            is_active=True
        ).select_related('grade_level')
        
        heatmap_data = []
        
        for section in sections:
            section_data = {
                'section': str(section),
                'class': str(section.grade_level) if section.grade_level else 'N/A',
                'data': []
            }

            enrollment_qs = StudentEnrollment.objects.filter(
                tenant=self.tenant,
                section=section,
                status='ACTIVE'
            )
            current_year = self._get_current_academic_year()
            if current_year:
                enrollment_qs = enrollment_qs.filter(academic_year=current_year)

            student_ids = enrollment_qs.values_list('student_id', flat=True)
            
            for i in range(30):
                date = start_date + timedelta(days=i)
                attendance = AttendanceRecord.objects.filter(
                    tenant=self.tenant,
                    record_type='STUDENT',
                    student_id__in=student_ids,
                    date=date
                )
                total = attendance.count()
                present = attendance.filter(status='PRESENT').count()
                
                rate = round(present / total * 100, 1) if total > 0 else None
                section_data['data'].append({
                    'date': date.isoformat(),
                    'rate': rate
                })
            
            heatmap_data.append(section_data)
        
        return {'data': heatmap_data}
    
    def _get_recent_activity(self, config):
        """Get recent activity feed."""
        from students.models import Student
        from fees.models import FeeTransaction
        from attendance.models import AttendanceRecord
        
        activities = []
        limit = config.get('limit', 10)
        
        # Recent payments
        payments = FeeTransaction.objects.filter(
            tenant=self.tenant
        ).select_related('invoice__student').order_by('-transaction_date')[:5]

        for payment in payments:
            student_name = payment.invoice.student.get_full_name() if payment.invoice and payment.invoice.student else 'Unknown'
            activities.append({
                'type': 'payment',
                'title': f'Fee payment received',
                'description': f'{student_name} paid ₹{payment.amount}',
                'time': payment.transaction_date.isoformat(),
                'badge': 'success'
            })
        
        # Sort by time and limit
        activities.sort(key=lambda x: x['time'], reverse=True)
        return {'activities': activities[:limit]}
    
    def _get_upcoming_events(self, config):
        """Get upcoming events."""
        from communication.models import Event
        
        today = timezone.now().date()
        limit = config.get('limit', 5)
        
        events = Event.objects.filter(
            tenant=self.tenant,
            start_date__gte=today
        ).order_by('start_date')[:limit]
        
        return {
            'events': [
                {
                    'id': e.id,
                    'title': e.title,
                    'date': e.start_date.isoformat(),
                    'description': e.description[:100] if e.description else '',
                    'type': e.event_type
                }
                for e in events
            ]
        }
    
    def _get_leaderboard_data(self, leaderboard_type, config):
        """Get leaderboard data for widget."""
        from .models import Leaderboard
        
        try:
            leaderboard = Leaderboard.objects.filter(
                tenant=self.tenant,
                leaderboard_type=leaderboard_type,
                is_active=True
            ).first()
            
            if not leaderboard:
                return {'entries': [], 'message': 'No leaderboard configured'}
            
            service = LeaderboardService(self.tenant)
            return service.get_leaderboard_data(leaderboard.id)
        except Exception as e:
            return {'entries': [], 'error': str(e)}
    
    def _get_children_overview(self, config):
        """Get parent's children overview."""
        if not self.user:
            return {'children': []}
        
        from students.models import Student, StudentEnrollment
        from students.models import ParentStudent
        
        try:
            children = ParentStudent.objects.filter(
                parent__user=self.user
            ).select_related('student')
            
            result = []
            for child_rel in children:
                student = child_rel.student
                enrollment = student.get_current_enrollment()
                
                result.append({
                    'id': student.id,
                    'name': student.get_full_name(),
                    'photo': student.photo.url if student.photo else None,
                    'class': str(enrollment.section) if enrollment else 'N/A',
                    'roll_number': enrollment.roll_number if enrollment else None
                })
            
            return {'children': result}
        except Exception:
            return {'children': []}
    
    def _get_attendance_summary(self, config):
        """Get attendance summary for parent's children."""
        children = self._get_parent_children()
        if not children:
            return {'summary': []}
        
        from attendance.models import Attendance
        
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        result = []
        for child in children:
            attendance = Attendance.objects.filter(
                student=child,
                date__gte=month_start
            )
            total = attendance.count()
            present = attendance.filter(status='PRESENT').count()
            
            result.append({
                'student_id': child.id,
                'student_name': child.get_full_name(),
                'present_days': present,
                'total_days': total,
                'percentage': round(present / total * 100, 1) if total > 0 else 0
            })
        
        return {'summary': result}
    
    def _get_fee_summary(self, config):
        """Get fee summary for parent's children."""
        children = self._get_parent_children()
        if not children:
            return {'summary': []}
        
        from fees.models import FeeInvoice, FeeTransaction
        
        result = []
        for child in children:
            invoices = FeeInvoice.objects.filter(student=child)
            total_due = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
            paid = invoices.aggregate(paid=Sum('paid_amount'))['paid'] or 0
            
            result.append({
                'student_id': str(child.id),
                'student_name': child.get_full_name(),
                'total_due': float(total_due),
                'paid': float(paid),
                'pending': float(total_due - paid)
            })
        
        return {'summary': result}
    
    def _get_academic_progress(self, config):
        """Get academic progress for parent's children."""
        children = self._get_parent_children()
        if not children:
            return {'progress': []}
        
        from exams.models import ExamResult
        
        result = []
        for child in children:
            # Get last 5 exam results
            results = ExamResult.objects.filter(
                student=child
            ).select_related('exam', 'subject').order_by('-exam__exam_date')[:5]
            
            result.append({
                'student_id': child.id,
                'student_name': child.get_full_name(),
                'results': [
                    {
                        'exam': r.exam.name,
                        'subject': r.subject.name,
                        'percentage': float(r.percentage),
                        'grade': r.grade
                    }
                    for r in results
                ]
            })
        
        return {'progress': result}
    
    def _get_recent_remarks(self, config):
        """Get recent remarks for parent's children."""
        children = self._get_parent_children()
        if not children:
            return {'remarks': []}
        
        from students.models import StudentRemark
        
        remarks = StudentRemark.objects.filter(
            student__in=children,
            visible_to_parent=True
        ).select_related('student', 'created_by').order_by('-created_at')[:10]
        
        return {
            'remarks': [
                {
                    'id': r.id,
                    'student_name': r.student.get_full_name(),
                    'type': r.remark_type,
                    'category': r.category,
                    'content': r.content,
                    'created_by': r.created_by.get_full_name() if r.created_by else 'System',
                    'created_at': r.created_at.isoformat()
                }
                for r in remarks
            ]
        }
    
    def _get_homework_pending(self, config):
        """Get pending homework for parent's children."""
        children = self._get_parent_children()
        if not children:
            return {'homework': []}
        
        from academics.models import Homework, HomeworkSubmission
        
        today = timezone.now().date()
        
        # Get homework for children's sections
        enrollments = [c.get_current_enrollment() for c in children if c.get_current_enrollment()]
        sections = [e.section for e in enrollments]
        
        pending = Homework.objects.filter(
            section__in=sections,
            due_date__gte=today
        ).exclude(
            submissions__student__in=children,
            submissions__status__in=['SUBMITTED', 'GRADED']
        ).order_by('due_date')[:10]
        
        return {
            'homework': [
                {
                    'id': h.id,
                    'title': h.title,
                    'subject': h.subject.name,
                    'section': str(h.section),
                    'due_date': h.due_date.isoformat(),
                    'is_urgent': (h.due_date - today).days <= 2
                }
                for h in pending
            ]
        }
    
    def _get_school_announcements(self, config):
        """Get school announcements."""
        from communication.models import Announcement
        
        limit = config.get('limit', 5)
        
        announcements = Announcement.objects.filter(
            tenant=self.tenant,
            is_active=True,
            target_audience__in=['ALL', 'PARENTS']
        ).order_by('-created_at')[:limit]
        
        return {
            'announcements': [
                {
                    'id': a.id,
                    'title': a.title,
                    'content': a.content[:200],
                    'created_at': a.created_at.isoformat(),
                    'priority': a.priority
                }
                for a in announcements
            ]
        }
    
    def _get_parent_children(self):
        """Helper to get parent's children."""
        if not self.user:
            return []
        
        from students.models import ParentStudent
        
        try:
            children_ids = ParentStudent.objects.filter(
                parent__user=self.user
            ).values_list('student_id', flat=True)
            
            from students.models import Student
            return list(Student.objects.filter(id__in=children_ids))
        except Exception:
            return []
    
    def _get_current_academic_year(self):
        """Get current academic year."""
        from tenants.models import AcademicYear
        
        try:
            return AcademicYear.objects.get(
                tenant=self.tenant,
                is_active=True
            )
        except AcademicYear.DoesNotExist:
            return AcademicYear.objects.filter(
                tenant=self.tenant
            ).order_by('-start_date').first()
    
    def _calculate_pending_fees(self):
        """Calculate total pending fees."""
        from fees.models import FeeInvoice

        total_due = FeeInvoice.objects.filter(
            tenant=self.tenant
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        total_paid = FeeInvoice.objects.filter(
            tenant=self.tenant
        ).aggregate(total=Sum('paid_amount'))['total'] or 0

        return float(total_due - total_paid)
    
    # Teacher widget methods
    def _get_my_classes_today(self, config):
        """Get teacher's classes for today."""
        from timetable.models import Period
        
        if not self.user:
            return {'classes': []}
        
        today = timezone.now()
        weekday = today.strftime('%A').upper()
        
        periods = Period.objects.filter(
            tenant=self.tenant,
            teacher__user=self.user,
            day=weekday
        ).select_related('section', 'subject').order_by('start_time')
        
        return {
            'classes': [
                {
                    'time': p.start_time.strftime('%H:%M'),
                    'section': str(p.section),
                    'subject': p.subject.name,
                    'room': p.room or 'TBD'
                }
                for p in periods
            ]
        }
    
    def _get_timetable_today(self, config):
        """Get today's timetable."""
        return self._get_my_classes_today(config)
    
    def _get_pending_tasks(self, config):
        """Get pending tasks for teacher."""
        from helpdesk.models import Ticket
        
        if not self.user:
            return {'tasks': []}
        
        tasks = Ticket.objects.filter(
            tenant=self.tenant,
            assigned_to=self.user,
            status__in=['OPEN', 'IN_PROGRESS']
        ).order_by('-priority', 'created_at')[:10]
        
        return {
            'tasks': [
                {
                    'id': t.id,
                    'title': t.title,
                    'priority': t.priority,
                    'status': t.status,
                    'created_at': t.created_at.isoformat()
                }
                for t in tasks
            ]
        }
    
    def _get_homework_status(self, config):
        """Get homework submission status for teacher's classes."""
        from academics.models import Homework, HomeworkCompletion
        from timetable.models import SubjectAssignment
        
        if not self.user:
            return {'homework': []}
        
        # Get teacher's assignments
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=self.user, tenant=self.tenant)
            
            assignments = SubjectAssignment.objects.filter(
                teacher=staff,
                is_active=True
            ).values_list('section_id', 'subject_id')
            
            homework_list = Homework.objects.filter(
                tenant=self.tenant,
                section_id__in=[a[0] for a in assignments],
                subject_id__in=[a[1] for a in assignments]
            ).order_by('-due_date')[:10]
            
            result = []
            for h in homework_list:
                total_students = h.section.students.count() if hasattr(h.section, 'students') else 0
                submitted = HomeworkCompletion.objects.filter(
                    homework=h,
                    is_completed=True
                ).count()
                
                result.append({
                    'id': str(h.id),
                    'title': h.title,
                    'section': str(h.section),
                    'due_date': h.due_date.isoformat(),
                    'submitted': submitted,
                    'total': total_students,
                    'percentage': round(submitted / total_students * 100, 1) if total_students > 0 else 0
                })
            
            return {'homework': result}
        except Exception:
            return {'homework': []}
    
    # Student widget methods
    def _get_my_schedule_today(self, config):
        """Get student's schedule for today."""
        from timetable.models import Period
        from students.models import StudentEnrollment
        
        if not self.user:
            return {'schedule': []}
        
        # Get student's enrollment
        try:
            from students.models import ParentStudent
            student = ParentStudent.objects.get(parent__user=self.user).student
            enrollment = student.get_current_enrollment()
            
            if not enrollment:
                return {'schedule': []}
            
            today = timezone.now()
            weekday = today.strftime('%A').upper()
            
            periods = Period.objects.filter(
                section=enrollment.section,
                day=weekday
            ).select_related('subject', 'teacher').order_by('start_time')
            
            return {
                'schedule': [
                    {
                        'time': p.start_time.strftime('%H:%M'),
                        'subject': p.subject.name,
                        'teacher': f"{p.teacher.first_name} {p.teacher.last_name}" if p.teacher else 'TBD',
                        'room': p.room or 'TBD'
                    }
                    for p in periods
                ]
            }
        except Exception:
            return {'schedule': []}
    
    def _get_my_attendance(self, config):
        """Get student's attendance summary."""
        from attendance.models import AttendanceRecord
        
        # This would need to fetch student based on user
        return {'attendance': {'present': 0, 'total': 0, 'percentage': 0}}
    
    def _get_my_rank(self, config):
        """Get student's current rank."""
        from .models import LeaderboardEntry
        
        # This would need to fetch student's rank
        return {'rank': None, 'total': 0, 'change': None}
    
    def _get_pending_homework(self, config):
        """Get student's pending homework."""
        return self._get_homework_pending(config)
    
    def _get_recent_results(self, config):
        """Get student's recent exam results."""
        return self._get_academic_progress(config)
    
    # Accountant widget methods
    def _get_fee_overview(self, config):
        """Get fee overview for accountant."""
        from fees.models import FeeInvoice, FeeTransaction
        
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        total_due = FeeInvoice.objects.filter(
            tenant=self.tenant
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        collected = FeeInvoice.objects.filter(
            tenant=self.tenant
        ).aggregate(total=Sum('paid_amount'))['total'] or 0

        collected_this_month = FeeTransaction.objects.filter(
            tenant=self.tenant,
            transaction_date__date__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return {
            'total_due': float(total_due),
            'collected': float(collected),
            'pending': float(total_due - collected),
            'collected_this_month': float(collected_this_month),
            'collection_rate': round(collected / total_due * 100, 1) if total_due > 0 else 0
        }
    
    def _get_pending_dues(self, config):
        """Get students with pending dues."""
        from fees.models import StudentFee
        from students.models import Student
        
        # Get students with pending fees
        pending = StudentFee.objects.filter(
            tenant=self.tenant,
            status='PENDING'
        ).select_related('student').order_by('-total_amount')[:20]
        
        return {
            'pending': [
                {
                    'student_id': f.student.id,
                    'student_name': f.student.get_full_name(),
                    'amount': float(f.total_amount),
                    'fee_type': f.fee_structure.name if f.fee_structure else 'Fee',
                    'due_date': f.due_date.isoformat() if f.due_date else None
                }
                for f in pending
            ]
        }
    
    def _get_recent_payments(self, config):
        """Get recent fee payments."""
        from fees.models import FeePayment
        
        limit = config.get('limit', 10)
        
        payments = FeePayment.objects.filter(
            tenant=self.tenant,
            status='COMPLETED'
        ).select_related('student').order_by('-payment_date')[:limit]
        
        return {
            'payments': [
                {
                    'id': p.id,
                    'student_name': p.student.get_full_name(),
                    'amount': float(p.amount),
                    'payment_date': p.payment_date.isoformat(),
                    'payment_mode': p.payment_mode,
                    'receipt_number': p.receipt_number
                }
                for p in payments
            ]
        }
    
    def _get_fee_defaulters(self, config):
        """Get fee defaulters list."""
        from fees.models import StudentFee
        
        today = timezone.now().date()
        
        defaulters = StudentFee.objects.filter(
            tenant=self.tenant,
            status='PENDING',
            due_date__lt=today
        ).select_related('student').order_by('-due_date')[:20]
        
        return {
            'defaulters': [
                {
                    'student_id': f.student.id,
                    'student_name': f.student.get_full_name(),
                    'amount': float(f.total_amount),
                    'due_date': f.due_date.isoformat(),
                    'overdue_days': (today - f.due_date).days
                }
                for f in defaulters
            ]
        }
