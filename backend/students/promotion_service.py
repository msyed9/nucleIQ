"""
Student Promotion Service
Handles bulk student promotions from one academic year/section to another
"""

from django.db import transaction
from django.utils import timezone
from .models import Student, StudentEnrollment, StudentPromotion, StudentPromotionDetail
from tenants.models import AcademicYear, Section


class PromotionService:
    """
    Service for managing student promotions.
    """
    
    def __init__(self, tenant, user):
        self.tenant = tenant
        self.user = user
    
    def create_promotion_batch(
        self,
        academic_year_from_id,
        academic_year_to_id,
        section_from_id=None,
        section_to_id=None,
        criteria=None
    ):
        """
        Create a promotion batch.
        
        Args:
            academic_year_from_id: Source academic year
            academic_year_to_id: Target academic year
            section_from_id: Optional source section (None = all sections)
            section_to_id: Optional target section (None = same grade next year)
            criteria: Promotion criteria (dict with min_attendance, min_marks, etc.)
        
        Returns:
            StudentPromotion instance
        """
        academic_year_from = AcademicYear.objects.get(
            id=academic_year_from_id,
            tenant=self.tenant
        )
        academic_year_to = AcademicYear.objects.get(
            id=academic_year_to_id,
            tenant=self.tenant
        )
        
        section_from = None
        section_to = None
        
        if section_from_id:
            section_from = Section.objects.get(
                id=section_from_id,
                tenant=self.tenant
            )
        
        if section_to_id:
            section_to = Section.objects.get(
                id=section_to_id,
                tenant=self.tenant
            )
        
        # Count students to be promoted
        enrollments = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            academic_year=academic_year_from,
            status='ACTIVE'
        )
        
        if section_from:
            enrollments = enrollments.filter(section=section_from)
        
        total_students = enrollments.count()
        
        # Create promotion record
        promotion = StudentPromotion.objects.create(
            tenant=self.tenant,
            academic_year_from=academic_year_from,
            academic_year_to=academic_year_to,
            section_from=section_from,
            section_to=section_to,
            status='DRAFT',
            total_students=total_students,
            promotion_criteria=criteria or {},
            promoted_by=self.user
        )
        
        return promotion
    
    def preview_promotion(self, promotion_id):
        """
        Preview students eligible for promotion.
        
        Args:
            promotion_id: StudentPromotion ID
        
        Returns:
            dict: {
                'total': int,
                'eligible': list,
                'ineligible': list
            }
        """
        promotion = StudentPromotion.objects.get(
            id=promotion_id,
            tenant=self.tenant
        )
        
        # Get all active enrollments from source academic year
        enrollments = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            academic_year=promotion.academic_year_from,
            status='ACTIVE'
        ).select_related('student', 'section')
        
        if promotion.section_from:
            enrollments = enrollments.filter(section=promotion.section_from)
        
        eligible = []
        ineligible = []
        
        for enrollment in enrollments:
            # Check promotion criteria
            is_eligible, reason = self._check_eligibility(
                enrollment,
                promotion.promotion_criteria
            )
            
            student_data = {
                'student_id': str(enrollment.student.id),
                'name': enrollment.student.get_full_name(),
                'admission_number': enrollment.student.admission_number,
                'current_section': enrollment.section.name,
                'roll_number': enrollment.roll_number
            }
            
            if is_eligible:
                eligible.append(student_data)
            else:
                student_data['reason'] = reason
                ineligible.append(student_data)
        
        return {
            'total': len(enrollments),
            'eligible': eligible,
            'ineligible': ineligible,
            'eligible_count': len(eligible),
            'ineligible_count': len(ineligible)
        }
    
    def _check_eligibility(self, enrollment, criteria):
        """
        Check if student is eligible for promotion based on criteria.
        
        Args:
            enrollment: StudentEnrollment instance
            criteria: dict with promotion criteria
        
        Returns:
            tuple: (bool, str) - (is_eligible, reason_if_not)
        """
        if not criteria:
            return True, ""
        
        # Check minimum attendance (if criteria specified)
        min_attendance = criteria.get('min_attendance_percentage')
        if min_attendance:
            # Calculate attendance percentage
            try:
                from attendance.models import AttendanceRecord
                total_days = AttendanceRecord.objects.filter(
                    student=enrollment.student,
                    date__year=enrollment.academic_year.start_date.year
                ).count()
                
                if total_days > 0:
                    present_days = AttendanceRecord.objects.filter(
                        student=enrollment.student,
                        date__year=enrollment.academic_year.start_date.year,
                        status='PRESENT'
                    ).count()
                    
                    attendance_pct = (present_days / total_days) * 100
                    
                    if attendance_pct < float(min_attendance):
                        return False, f"Low attendance: {attendance_pct:.1f}%"
            except Exception:
                pass  # Attendance module not available or error
        
        # Check minimum marks (if criteria specified)
        min_percentage = criteria.get('min_percentage')
        if min_percentage:
            # Calculate average marks
            try:
                from exams.models import ExamResult
                results = ExamResult.objects.filter(
                    student=enrollment.student,
                    exam__academic_year=enrollment.academic_year
                )
                
                if results.exists():
                    avg_percentage = results.aggregate(
                        models.Avg('percentage_obtained')
                    )['percentage_obtained__avg']
                    
                    if avg_percentage and avg_percentage < float(min_percentage):
                        return False, f"Low marks: {avg_percentage:.1f}%"
            except Exception:
                pass  # Exam module not available or error
        
        return True, ""
    
    @transaction.atomic
    def execute_promotion(self, promotion_id, student_ids=None):
        """
        Execute promotion for students.
        
        Args:
            promotion_id: StudentPromotion ID
            student_ids: Optional list of student IDs (None = all eligible)
        
        Returns:
            dict: {
                'success': bool,
                'promoted': int,
                'details': list
            }
        """
        promotion = StudentPromotion.objects.select_for_update().get(
            id=promotion_id,
            tenant=self.tenant
        )
        
        if promotion.status == 'COMPLETED':
            raise ValueError("Promotion already completed")
        
        # Get enrollments to promote
        enrollments = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            academic_year=promotion.academic_year_from,
            status='ACTIVE'
        ).select_related('student', 'section')
        
        if promotion.section_from:
            enrollments = enrollments.filter(section=promotion.section_from)
        
        if student_ids:
            enrollments = enrollments.filter(student_id__in=student_ids)
        
        promoted_count = 0
        detained_count = 0
        details = []
        
        for enrollment in enrollments:
            # Check eligibility
            is_eligible, reason = self._check_eligibility(
                enrollment,
                promotion.promotion_criteria
            )
            
            if is_eligible:
                # Create new enrollment for next academic year
                new_enrollment = StudentEnrollment.objects.create(
                    tenant=self.tenant,
                    student=enrollment.student,
                    academic_year=promotion.academic_year_to,
                    section=promotion.section_to or enrollment.section,
                    roll_number=enrollment.roll_number,
                    status='ACTIVE'
                )
                
                # Mark old enrollment as completed
                enrollment.status = 'COMPLETED'
                enrollment.save()
                
                # Create promotion detail
                StudentPromotionDetail.objects.create(
                    promotion=promotion,
                    student=enrollment.student,
                    enrollment_from=enrollment,
                    enrollment_to=new_enrollment,
                    promotion_status='PROMOTED'
                )
                
                promoted_count += 1
                details.append({
                    'student': enrollment.student.get_full_name(),
                    'status': 'PROMOTED'
                })
            else:
                # Student detained
                StudentPromotionDetail.objects.create(
                    promotion=promotion,
                    student=enrollment.student,
                    enrollment_from=enrollment,
                    promotion_status='DETAINED',
                    detention_reason=reason
                )
                
                detained_count += 1
                details.append({
                    'student': enrollment.student.get_full_name(),
                    'status': 'DETAINED',
                    'reason': reason
                })
        
        # Update promotion record
        promotion.promoted_count = promoted_count
        promotion.detained_count = detained_count
        promotion.status = 'COMPLETED'
        promotion.completed_at = timezone.now()
        promotion.save()
        
        return {
            'success': True,
            'promoted': promoted_count,
            'detained': detained_count,
            'details': details
        }
