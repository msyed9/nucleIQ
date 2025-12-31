"""
Student 360° Aggregation Service
Collects data from all modules for comprehensive profile
"""

from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models import Student, StudentRemark


class Student360Service:
    """
    Service to aggregate student data from all modules.
    """
    
    def __init__(self, student):
        self.student = student
    
    def get_360_profile(self):
        """
        Get complete 360° profile data.
        
        Returns:
            {
                'student': {...},
                'kpis': {...},
                'recent_activity': [...],
                'siblings': [...],
                'family_summary': {...}
            }
        """
        return {
            'student': self._get_student_basic(),
            'kpis': self._get_kpis(),
            'recent_activity': self._get_recent_activity(),
            'siblings': self._get_siblings_data(),
            'family_summary': self._get_family_summary(),
            'academic_summary': self._get_academic_summary(),
            'financial_summary': self._get_financial_summary(),
            'health_summary': self._get_health_summary(),
        }
    
    def _get_student_basic(self):
        """Get basic student information."""
        enrollment = self.student.get_current_enrollment()
        
        # Handle photo URL safely
        photo_url = None
        if self.student.photo:
            try:
                photo_url = self.student.photo.url
            except (ValueError, AttributeError):
                photo_url = None
        
        return {
            'id': str(self.student.id),
            'admission_number': self.student.admission_number,
            'full_name': self.student.get_full_name(),
            'first_name': self.student.first_name,
            'last_name': self.student.last_name,
            'class': enrollment.section.grade_level.name if enrollment else 'N/A',
            'section': enrollment.section.name if enrollment else 'N/A',
            'roll_number': enrollment.roll_number if enrollment else 'N/A',
            'photo_url': photo_url,
            'age': self.student.get_age(),
            'blood_group': self.student.blood_group,
            'email': self.student.email,
            'phone': self.student.phone,
            'father_name': self.student.father_name,
            'father_phone': self.student.father_phone,
            'mother_name': self.student.mother_name,
            'mother_phone': self.student.mother_phone,
        }
    
    def _get_kpis(self):
        """Get key performance indicators."""
        return {
            'attendance_percentage': self._get_attendance_percentage(),
            'fee_balance': self._get_fee_balance(),
            'upcoming_exams': self._get_upcoming_exams_count(),
            'library_books_issued': self._get_library_books_count(),
            'pending_assignments': self._get_pending_assignments_count(),
            'total_remarks': StudentRemark.objects.filter(student=self.student).count(),
            'positive_remarks': StudentRemark.objects.filter(
                student=self.student, remark_type='POSITIVE'
            ).count(),
            'negative_remarks': StudentRemark.objects.filter(
                student=self.student, remark_type='NEGATIVE'
            ).count(),
            'pending_actions': StudentRemark.objects.filter(
                student=self.student, requires_action=True, action_taken=False
            ).count(),
        }
    
    def _get_recent_activity(self, limit=10):
        """Get recent activity feed (remarks)."""
        remarks = StudentRemark.objects.filter(
            student=self.student
        ).select_related('created_by_staff').order_by('-created_at')[:limit]
        
        return [
            {
                'id': str(remark.id),
                'type': remark.remark_type,
                'category': remark.category,
                'title': remark.title,
                'description': remark.description,
                'created_by': remark.created_by_staff.get_full_name() if remark.created_by_staff else 'System',
                'created_at': remark.created_at.isoformat(),
                'color_class': remark.get_color_class(),
                'is_important': remark.is_important,
                'requires_action': remark.requires_action,
                'action_taken': remark.action_taken,
                'parent_acknowledged': remark.parent_acknowledged,
            }
            for remark in remarks
        ]
    
    def _get_siblings_data(self):
        """Get sibling information."""
        siblings = self.student.get_siblings()
        data = []
        for sibling in siblings:
            enrollment = sibling.get_current_enrollment()
            data.append({
                'id': str(sibling.id),
                'name': sibling.get_full_name(),
                'class': enrollment.section.grade_level.name if enrollment else 'N/A',
                'admission_number': sibling.admission_number,
                'photo_url': sibling.photo.url if sibling.photo else None,
            })
        return data
    
    def _get_family_summary(self):
        """Get family-level summary (for multi-child families)."""
        siblings = self.student.get_siblings()
        all_students = list(siblings) + [self.student]
        
        total_fee_balance = sum(self._get_fee_balance_for_student(s) for s in all_students)
        
        return {
            'total_children': len(all_students),
            'total_fee_balance': float(total_fee_balance),
            'family_id': self.student.family_id,
        }
    
    def _get_academic_summary(self):
        """Get academic performance summary."""
        # This would query exam/grade models
        return {
            'current_gpa': 0.0,  # Placeholder
            'rank_in_class': 0,  # Placeholder
            'subjects_count': 0,  # Placeholder
            'attendance_percentage': self._get_attendance_percentage(),
        }
    
    def _get_financial_summary(self):
        """Get financial summary."""
        return {
            'total_fees': 0.0,  # Placeholder
            'paid': 0.0,  # Placeholder
            'pending': self._get_fee_balance(),
            'last_payment_date': None,  # Placeholder
        }
    
    def _get_health_summary(self):
        """Get health summary."""
        latest_health = self.student.health_records.first()
        
        if latest_health:
            return {
                'height_cm': float(latest_health.height_cm) if latest_health.height_cm else None,
                'weight_kg': float(latest_health.weight_kg) if latest_health.weight_kg else None,
                'bmi': latest_health.get_bmi(),
                'allergies': latest_health.allergies,
                'last_checkup': latest_health.date.isoformat(),
            }
        
        return {}
    
    # Helper methods (placeholders - would integrate with actual modules)
    
    def _get_attendance_percentage(self):
        """Calculate attendance percentage."""
        # from attendance.models import Attendance
        # Would calculate from actual attendance records
        return 95.5  # Placeholder
    
    def _get_fee_balance(self):
        """Get pending fee balance."""
        # from fees.models import FeePayment
        # Would calculate from actual fee records
        return 5000.0  # Placeholder
    
    def _get_fee_balance_for_student(self, student):
        """Get fee balance for specific student."""
        return 5000.0  # Placeholder
    
    def _get_upcoming_exams_count(self):
        """Get count of upcoming exams."""
        # from exams.models import Exam
        return 3  # Placeholder
    
    def _get_library_books_count(self):
        """Get count of currently issued library books."""
        # from library.models import BookIssue
        return 2  # Placeholder
    
    def _get_pending_assignments_count(self):
        """Get count of pending assignments."""
        # from academics.models import Assignment
        return 4  # Placeholder


def create_system_remark(student, title, description, category, source_module, source_reference=None, remark_type='SYSTEM'):
    """
    Helper function to create system-generated remarks.
    
    Usage:
        create_system_remark(
            student=student,
            title="Library Book Overdue",
            description="Book 'Python Programming' is overdue by 7 days",
            category="LIBRARY",
            source_module="library",
            source_reference="book_issue_123"
        )
    """
    return StudentRemark.objects.create(
        student=student,
        remark_type=remark_type,
        category=category,
        title=title,
        description=description,
        is_system_generated=True,
        source_module=source_module,
        source_reference=source_reference or '',
        visible_to_parent=True,
        visible_to_student=False,
    )
