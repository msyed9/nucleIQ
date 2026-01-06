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
                'family_summary': {...},
                'attendance_details': {...},
                'fee_details': {...}
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
            'attendance_details': self._get_attendance_details(),
            'fee_details': self._get_fee_details(),
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
    
    # Helper methods - Real data integration
    
    def _get_attendance_percentage(self):
        """Calculate attendance percentage from real data."""
        try:
            from attendance.models import AttendanceRecord
            from django.db.models import Count, Q
            from datetime import date, timedelta
            
            # Get current enrollment
            enrollment = self.student.get_current_enrollment()
            if not enrollment:
                return 0.0
            
            # Get current academic year
            academic_year = enrollment.academic_year
            
            # Calculate for current academic year
            attendance_records = AttendanceRecord.objects.filter(
                tenant=self.student.tenant,
                record_type='STUDENT',
                student=self.student,
                academic_year=academic_year
            )
            
            total_days = attendance_records.count()
            if total_days == 0:
                return 0.0
            
            present_days = attendance_records.filter(
                Q(status='PRESENT') | Q(status='LATE')
            ).count()
            
            return round((present_days / total_days) * 100, 2)
            
        except Exception as e:
            print(f"Error calculating attendance: {e}")
            return 0.0
    
    def _get_attendance_details(self):
        """Get detailed attendance statistics."""
        try:
            from attendance.models import AttendanceRecord
            from django.db.models import Count, Q
            
            enrollment = self.student.get_current_enrollment()
            if not enrollment:
                return {
                    'total_days': 0,
                    'present_days': 0,
                    'absent_days': 0,
                    'late_days': 0,
                    'half_days': 0,
                    'percentage': 0.0
                }
            
            academic_year = enrollment.academic_year
            
            # Get all attendance records
            records = AttendanceRecord.objects.filter(
                tenant=self.student.tenant,
                record_type='STUDENT',
                student=self.student,
                academic_year=academic_year
            )
            
            total_days = records.count()
            present_days = records.filter(status='PRESENT').count()
            absent_days = records.filter(status='ABSENT').count()
            late_days = records.filter(status='LATE').count()
            half_days = records.filter(status='HALF_DAY').count()
            
            percentage = round((present_days + late_days) / total_days * 100, 2) if total_days > 0 else 0.0
            
            return {
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': absent_days,
                'late_days': late_days,
                'half_days': half_days,
                'percentage': percentage
            }
            
        except Exception as e:
            print(f"Error getting attendance details: {e}")
            return {
                'total_days': 0,
                'present_days': 0,
                'absent_days': 0,
                'late_days': 0,
                'half_days': 0,
                'percentage': 0.0
            }
    
    def _get_fee_balance(self):
        """Get pending fee balance from real data."""
        try:
            from fees.models import FeeInvoice
            from django.db.models import Sum
            
            # Get all pending invoices for this student
            invoices = FeeInvoice.objects.filter(
                tenant=self.student.tenant,
                student=self.student,
                status__in=['PENDING', 'PARTIAL']
            )
            
            # Calculate total pending amount
            total_amount = invoices.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            paid_amount = invoices.aggregate(
                paid=Sum('paid_amount')
            )['paid'] or 0
            
            balance = float(total_amount - paid_amount)
            return balance
            
        except Exception as e:
            print(f"Error calculating fee balance: {e}")
            return 0.0
    
    def _get_fee_details(self):
        """Get detailed fee information."""
        try:
            from fees.models import FeeInvoice, FeeAllocation
            from django.db.models import Sum
            
            enrollment = self.student.get_current_enrollment()
            if not enrollment:
                return {
                    'total_fee': 0.0,
                    'paid_amount': 0.0,
                    'pending_amount': 0.0,
                    'discount_percentage': 0.0,
                    'discount_amount': 0.0,
                    'pending_percentage': 0.0
                }
            
            academic_year = enrollment.academic_year
            
            # Get fee allocations for this student
            allocations = FeeAllocation.objects.filter(
                tenant=self.student.tenant,
                student=self.student,
                academic_year=academic_year,
                is_active=True
            )
            
            # Calculate total allocated fee
            total_allocated = sum(
                allocation.get_final_amount() 
                for allocation in allocations
            )
            
            # Get discount percentage (average of all allocations)
            discount_pct = allocations.aggregate(
                avg_discount=Sum('discount_percentage')
            )['avg_discount'] or 0
            
            # Get invoices
            invoices = FeeInvoice.objects.filter(
                tenant=self.student.tenant,
                student=self.student,
                academic_year=academic_year
            )
            
            total_amount = invoices.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            paid_amount = invoices.aggregate(
                paid=Sum('paid_amount')
            )['paid'] or 0
            
            pending_amount = float(total_amount - paid_amount)
            pending_percentage = round(
                (pending_amount / total_amount * 100) if total_amount > 0 else 0, 
                2
            )
            
            # Calculate discount amount
            discount_amount = sum(
                allocation.amount - allocation.get_final_amount()
                for allocation in allocations
            )
            
            return {
                'total_fee': float(total_amount),
                'paid_amount': float(paid_amount),
                'pending_amount': pending_amount,
                'discount_percentage': float(discount_pct),
                'discount_amount': float(discount_amount),
                'pending_percentage': pending_percentage
            }
            
        except Exception as e:
            print(f"Error getting fee details: {e}")
            return {
                'total_fee': 0.0,
                'paid_amount': 0.0,
                'pending_amount': 0.0,
                'discount_percentage': 0.0,
                'discount_amount': 0.0,
                'pending_percentage': 0.0
            }
    
    def _get_fee_balance_for_student(self, student):
        """Get fee balance for specific student."""
        try:
            from fees.models import FeeInvoice
            from django.db.models import Sum
            
            invoices = FeeInvoice.objects.filter(
                tenant=student.tenant,
                student=student,
                status__in=['PENDING', 'PARTIAL']
            )
            
            total_amount = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
            paid_amount = invoices.aggregate(paid=Sum('paid_amount'))['paid'] or 0
            
            return float(total_amount - paid_amount)
            
        except Exception as e:
            print(f"Error calculating fee balance for student: {e}")
            return 0.0
    
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


def generate_admission_number(tenant):
    """
    Generate unique admission number based on tenant settings.
    Supports configurable formats like:
    - ADM{YEAR}{SEQUENCE:04d} -> ADM20240001
    - {PREFIX}{SEQUENCE:05d} -> STU00001
    - {YEAR}-{SEQUENCE:03d} -> 2024-001
    """
    from datetime import datetime
    from django.db import transaction
    
    # Get tenant settings
    try:
        settings = tenant.settings
    except:
        # Fallback to default if settings don't exist
        settings = None
    
    if settings and settings.auto_generate_admission_number:
        # Use configured format
        format_str = settings.admission_number_format
        
        # Get current sequence and increment
        with transaction.atomic():
            settings.refresh_from_db()
            sequence = settings.admission_number_sequence
            settings.admission_number_sequence = sequence + 1
            settings.save(update_fields=['admission_number_sequence'])
        
        # Replace placeholders
        year = datetime.now().year
        admission_number = format_str.replace('{YEAR}', str(year))
        admission_number = admission_number.replace('{PREFIX}', settings.admission_number_prefix)
        
        # Handle sequence formatting (e.g., {SEQUENCE:04d})
        import re
        sequence_pattern = r'\{SEQUENCE:(\d+)d\}'
        match = re.search(sequence_pattern, admission_number)
        if match:
            width = int(match.group(1))
            admission_number = re.sub(sequence_pattern, str(sequence).zfill(width), admission_number)
        else:
            # Simple {SEQUENCE} replacement
            admission_number = admission_number.replace('{SEQUENCE}', str(sequence))
        
        return admission_number
    else:
        # Fallback to old method
        year = datetime.now().year
        prefix = f"ADM{year}"
        
        # Get last admission number for this year
        last_student = Student.objects.filter(
            tenant=tenant,
            admission_number__startswith=prefix
        ).order_by('-admission_number').first()
        
        if last_student:
            try:
                last_num = int(last_student.admission_number[len(prefix):])
                new_num = last_num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:05d}"



def create_student_from_lead(lead, section, academic_year=None):
    """
    Create student record from lead with parent user account.
    
    Args:
        lead: Lead instance
        section: Section instance to enroll in
        academic_year: AcademicYear instance (optional, uses current if not provided)
    
    Returns:
        dict: {
            'student': Student instance,
            'enrollment': StudentEnrollment instance,
            'parent_user': User instance,
            'temp_password': str (temporary password for parent)
        }
    
    Raises:
        ValueError: If lead already converted or missing required data
    """
    from django.db import transaction
    from django.contrib.auth import get_user_model
    from .models import Student, StudentEnrollment
    from datetime import date
    import secrets
    import string
    
    User = get_user_model()
    
    # Validation
    if lead.converted_to_student:
        raise ValueError("Lead already converted to student")
    
    if not lead.student_name or not lead.parent_email:
        raise ValueError("Missing required lead data (student name or parent email)")
    
    # Parse student name
    name_parts = lead.student_name.strip().split()
    first_name = name_parts[0] if name_parts else "Student"
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
    
    # Get or use current academic year
    if not academic_year:
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=lead.tenant,
            is_active=True
        ).first()
        
        if not academic_year:
            raise ValueError("No active academic year found")
    
    # Generate temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    
    with transaction.atomic():
        # 1. Generate admission number
        admission_number = generate_admission_number(lead.tenant)
        
        # 2. Create student record
        student = Student.objects.create(
            tenant=lead.tenant,
            admission_number=admission_number,
            admission_date=date.today(),
            first_name=first_name,
            last_name=last_name,
            date_of_birth=lead.date_of_birth or date.today(),
            gender=lead.gender[0] if lead.gender else 'O',
            email=lead.parent_email,  # Use parent email initially
            phone=lead.parent_phone,
            address=lead.address or '',
            father_name=lead.parent_name,
            father_phone=lead.parent_phone,
            father_email=lead.parent_email,
            mother_name='',  # Can be updated later
            mother_phone=lead.parent_alternate_phone or '',
            is_active=True,
            notes=f"Converted from lead {lead.lead_number}"
        )
        
        # 3. Create enrollment with PENDING_DOCS status
        enrollment = StudentEnrollment.objects.create(
            tenant=lead.tenant,
            student=student,
            academic_year=academic_year,
            section=section,
            status='ACTIVE',  # Note: Using ACTIVE as PENDING_DOCS might not be in STATUS_CHOICES
            enrollment_date=date.today(),
            roll_number='',  # Can be assigned later
            notes=f"Enrolled from lead conversion. Documents pending."
        )
        
        # 4. Create parent user account
        # Check if user already exists with this email
        parent_user = User.objects.filter(email=lead.parent_email).first()
        
        if not parent_user:
            # Create new parent user
            username = f"parent_{admission_number}".lower()
            parent_user = User.objects.create_user(
                username=username,
                email=lead.parent_email,
                password=temp_password,
                first_name=lead.parent_name.split()[0] if lead.parent_name else 'Parent',
                last_name=' '.join(lead.parent_name.split()[1:]) if len(lead.parent_name.split()) > 1 else '',
                tenant=lead.tenant,
                role='PARENT',
                is_active=True
            )
        else:
            # User exists, update password
            parent_user.set_password(temp_password)
            parent_user.save()
        
        # 5. Update lead
        lead.converted_to_student = True
        lead.student = student
        lead.converted_at = timezone.now()
        lead.status = 'ADMITTED'
        lead.save()
        
        # 6. Create system remark
        create_system_remark(
            student=student,
            title="Student Admission",
            description=f"Student admitted from lead {lead.lead_number}. Admission number: {admission_number}",
            category="GENERAL",
            source_module="crm",
            source_reference=str(lead.id),
            remark_type="SYSTEM"
        )
    
    return {
        'student': student,
        'enrollment': enrollment,
        'parent_user': parent_user,
        'temp_password': temp_password,
        'admission_number': admission_number
    }
