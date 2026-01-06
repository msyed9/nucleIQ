"""
Parent Portal Backend Service

Provides data access and business logic for parent portal features.
"""

from django.db.models import Q, Sum, Avg, Count, Prefetch
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from .models import (
    Student, StudentEnrollment, ParentUser, StudentRemark, 
    StudentDocument, StudentHealthRecord
)


class ParentPortalService:
    """
    Service class for parent portal operations.
    Ensures parents can only access their linked students' data.
    """
    
    def __init__(self, user):
        """
        Initialize service with user context.
        
        Args:
            user: User object (must be a parent)
        """
        self.user = user
        
        # Get parent profile
        try:
            self.parent_profile = ParentUser.objects.get(
                user=user,
                portal_access_enabled=True
            )
        except ParentUser.DoesNotExist:
            raise PermissionDenied("User is not a parent or portal access is disabled")
    
    def get_accessible_students(self):
        """
        Get all students accessible to this parent.
        
        Returns:
            QuerySet of Student objects
        """
        return self.parent_profile.students.filter(
            is_active=True,
            tenant=self.user.tenant
        ).select_related(
            'tenant',
            'current_enrollment__academic_year',
            'current_enrollment__grade',
            'current_enrollment__section'
        )
    
    def get_student(self, student_id):
        """
        Get a specific student if parent has access.
        
        Args:
            student_id: Student primary key
        
        Returns:
            Student object
        
        Raises:
            PermissionDenied if parent doesn't have access to this student
        """
        student = get_object_or_404(
            Student,
            id=student_id,
            tenant=self.user.tenant,
            is_active=True
        )
        
        # Verify parent has access to this student
        if student not in self.parent_profile.students.all():
            raise PermissionDenied("You don't have access to this student")
        
        return student
    
    def get_student_attendance_summary(self, student_id, academic_year_id=None):
        """
        Get attendance summary for a student.
        
        Args:
            student_id: Student primary key
            academic_year_id: Optional academic year filter
        
        Returns:
            dict with attendance statistics
        """
        student = self.get_student(student_id)
        
        # Import here to avoid circular imports
        from attendance.models import StudentAttendance
        
        # Build query
        attendance_query = StudentAttendance.objects.filter(
            student=student,
            tenant=self.user.tenant
        )
        
        if academic_year_id:
            attendance_query = attendance_query.filter(
                academic_year_id=academic_year_id
            )
        
        # Calculate statistics
        total_days = attendance_query.count()
        present_days = attendance_query.filter(status='PRESENT').count()
        absent_days = attendance_query.filter(status='ABSENT').count()
        late_days = attendance_query.filter(status='LATE').count()
        excused_days = attendance_query.filter(status='EXCUSED').count()
        
        # Calculate percentage
        percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        return {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'excused_days': excused_days,
            'attendance_percentage': round(percentage, 2)
        }
    
    def get_student_fee_summary(self, student_id, academic_year_id=None):
        """
        Get fee summary for a student.
        
        Args:
            student_id: Student primary key
            academic_year_id: Optional academic year filter
        
        Returns:
            dict with fee statistics
        """
        student = self.get_student(student_id)
        
        # Import here to avoid circular imports
        from fees.models import FeeInvoice, FeePayment
        
        # Build query
        invoices_query = FeeInvoice.objects.filter(
            student=student,
            tenant=self.user.tenant
        )
        
        if academic_year_id:
            invoices_query = invoices_query.filter(
                academic_year_id=academic_year_id
            )
        
        # Calculate totals
        total_amount = invoices_query.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Get payments
        payments_query = FeePayment.objects.filter(
            invoice__in=invoices_query,
            status='COMPLETED'
        )
        
        paid_amount = payments_query.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        balance = total_amount - paid_amount
        
        # Get overdue invoices
        overdue_count = invoices_query.filter(
            due_date__lt=timezone.now(),
            status__in=['PENDING', 'PARTIAL']
        ).count()
        
        return {
            'total_amount': float(total_amount),
            'paid_amount': float(paid_amount),
            'balance': float(balance),
            'overdue_count': overdue_count,
            'payment_percentage': round((paid_amount / total_amount * 100), 2) if total_amount > 0 else 0
        }
    
    def get_student_exam_summary(self, student_id, academic_year_id=None):
        """
        Get exam results summary for a student.
        
        Args:
            student_id: Student primary key
            academic_year_id: Optional academic year filter
        
        Returns:
            dict with exam statistics
        """
        student = self.get_student(student_id)
        
        # Import here to avoid circular imports
        from exams.models import ExamResult
        
        # Build query
        results_query = ExamResult.objects.filter(
            student=student,
            tenant=self.user.tenant
        )
        
        if academic_year_id:
            results_query = results_query.filter(
                exam__academic_year_id=academic_year_id
            )
        
        # Calculate statistics
        total_exams = results_query.count()
        
        if total_exams == 0:
            return {
                'total_exams': 0,
                'average_percentage': 0,
                'highest_percentage': 0,
                'lowest_percentage': 0,
                'grade': 'N/A'
            }
        
        avg_percentage = results_query.aggregate(
            avg=Avg('percentage')
        )['avg'] or 0
        
        # Get highest and lowest
        percentages = list(results_query.values_list('percentage', flat=True))
        
        return {
            'total_exams': total_exams,
            'average_percentage': round(avg_percentage, 2),
            'highest_percentage': max(percentages) if percentages else 0,
            'lowest_percentage': min(percentages) if percentages else 0,
            'grade': self._calculate_grade(avg_percentage)
        }
    
    def get_student_360_summary(self, student_id, academic_year_id=None):
        """
        Get comprehensive 360° summary for a student.
        Combines attendance, fees, and exam data.
        
        Args:
            student_id: Student primary key
            academic_year_id: Optional academic year filter
        
        Returns:
            dict with complete student summary
        """
        student = self.get_student(student_id)
        
        return {
            'student': {
                'id': student.id,
                'admission_number': student.admission_number,
                'full_name': student.get_full_name(),
                'photo_url': student.photo.url if student.photo else None,
                'current_class': self._get_current_class(student),
            },
            'attendance': self.get_student_attendance_summary(student_id, academic_year_id),
            'fees': self.get_student_fee_summary(student_id, academic_year_id),
            'exams': self.get_student_exam_summary(student_id, academic_year_id),
        }
    
    def get_student_remarks(self, student_id, limit=10):
        """
        Get recent remarks for a student.
        
        Args:
            student_id: Student primary key
            limit: Maximum number of remarks to return
        
        Returns:
            QuerySet of StudentRemark objects
        """
        student = self.get_student(student_id)
        
        return StudentRemark.objects.filter(
            student=student,
            tenant=self.user.tenant,
            is_visible_to_parent=True
        ).select_related(
            'created_by'
        ).order_by('-created_at')[:limit]
    
    def get_student_documents(self, student_id):
        """
        Get documents for a student.
        
        Args:
            student_id: Student primary key
        
        Returns:
            QuerySet of StudentDocument objects
        """
        student = self.get_student(student_id)
        
        return StudentDocument.objects.filter(
            student=student,
            tenant=self.user.tenant
        ).order_by('-uploaded_at')
    
    def get_student_health_records(self, student_id):
        """
        Get health records for a student.
        
        Args:
            student_id: Student primary key
        
        Returns:
            QuerySet of StudentHealthRecord objects
        """
        student = self.get_student(student_id)
        
        return StudentHealthRecord.objects.filter(
            student=student,
            tenant=self.user.tenant
        ).order_by('-record_date')
    
    def update_last_login(self):
        """Update the parent's last login timestamp."""
        self.parent_profile.last_login_at = timezone.now()
        self.parent_profile.save(update_fields=['last_login_at'])
    
    @staticmethod
    def _calculate_grade(percentage):
        """
        Calculate letter grade from percentage.
        
        Args:
            percentage: Numeric percentage
        
        Returns:
            str: Letter grade
        """
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B'
        elif percentage >= 60:
            return 'C'
        elif percentage >= 50:
            return 'D'
        else:
            return 'F'
    
    @staticmethod
    def _get_current_class(student):
        """
        Get current class/section string for student.
        
        Args:
            student: Student object
        
        Returns:
            str: Class and section name
        """
        if hasattr(student, 'current_enrollment') and student.current_enrollment:
            enrollment = student.current_enrollment
            return f"{enrollment.grade.name} - {enrollment.section.name}"
        return "Not Enrolled"
