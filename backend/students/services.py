"""
Student 360° Aggregation Service
Collects data from all modules for comprehensive profile
"""

import uuid
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from core.utils import normalize_phone_number
from .models import Student, StudentRemark


class Student360Service:
    """
    Service to aggregate student data from all modules.
    """
    
    # Default row limits for the list-like sections. Callers (the view) may
    # override any of these via query params, clamped to MAX_LIMIT.
    DEFAULT_LIMITS = {
        'recent_activity': 10,
        'complaints': 10,
        'homework': 10,
        'exam_results': 5,
        'teacher_remarks': 15,
    }
    MAX_LIMIT = 50

    def __init__(self, student, options=None):
        self.student = student
        # `options` carries per-section limits resolved from request query params.
        self.options = options or {}
        # Resolve current enrollment once - most sections need it, and it is the
        # single most repeated query in the aggregation.
        self.enrollment = student.get_current_enrollment()
        self.academic_year = self.enrollment.academic_year if self.enrollment else None

    def _limit(self, key):
        """Resolve the effective row limit for a section, clamped to MAX_LIMIT."""
        raw = self.options.get(key, self.DEFAULT_LIMITS.get(key))
        try:
            value = int(raw)
        except (TypeError, ValueError):
            value = self.DEFAULT_LIMITS.get(key)
        return max(1, min(value, self.MAX_LIMIT))

    def get_360_profile(self):
        """
        Get complete 360° profile data.

        Returns a composite dict with one key per module section:
            student, kpis, recent_activity, siblings, family_summary,
            academic_summary, financial_summary, health_summary,
            attendance_details, fee_details, complaints, homework, exam_results
        """
        return {
            'student': self._get_student_basic(),
            'kpis': self._get_kpis(),
            'recent_activity': self._get_recent_activity(self._limit('recent_activity')),
            'siblings': self._get_siblings_data(),
            'family_summary': self._get_family_summary(),
            'academic_summary': self._get_academic_summary(),
            'financial_summary': self._get_financial_summary(),
            'health_summary': self._get_health_summary(),
            'attendance_details': self._get_attendance_details(),
            'fee_details': self._get_fee_details(),
            'complaints': self._get_complaints(self._limit('complaints')),
            'homework': self._get_homework(self._limit('homework')),
            'exam_results': self._get_exam_results(self._limit('exam_results')),
            'teacher_remarks': self._get_teacher_remarks(self._limit('teacher_remarks')),
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
        current_year = None
        enrollment = self.student.get_current_enrollment()
        if enrollment:
            current_year = enrollment.academic_year

        remarks_qs = StudentRemark.objects.filter(student=self.student)
        if current_year:
            remarks_qs = remarks_qs.filter(academic_year=current_year)

        return {
            'attendance_percentage': self._get_attendance_percentage(),
            'fee_balance': self._get_fee_balance(),
            'upcoming_exams': self._get_upcoming_exams_count(),
            'library_books_issued': self._get_library_books_count(),
            'pending_assignments': self._get_pending_assignments_count(),
            'open_complaints': self._get_open_complaints_count(),
            'total_remarks': remarks_qs.count(),
            'positive_remarks': remarks_qs.filter(remark_type='POSITIVE').count(),
            'negative_remarks': remarks_qs.filter(remark_type='NEGATIVE').count(),
            'pending_actions': remarks_qs.filter(requires_action=True, action_taken=False).count(),
        }
    
    def _get_recent_activity(self, limit=10):
        """Get recent activity feed (remarks)."""
        current_year = None
        enrollment = self.student.get_current_enrollment()
        if enrollment:
            current_year = enrollment.academic_year

        remarks = StudentRemark.objects.filter(student=self.student)
        if current_year:
            remarks = remarks.filter(academic_year=current_year)

        remarks = remarks.select_related('created_by_staff').order_by('-created_at')[:limit]
        
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
        enrollment = self.student.get_current_enrollment()
        subjects_count = 0
        average_score = None
        
        if enrollment:
            # Try to get subject count from the grade level
            try:
                from tenants.models import Subject
                subjects_count = Subject.objects.filter(
                    tenant=self.student.tenant,
                    grade_levels=enrollment.section.grade_level,
                    is_active=True
                ).count()
            except Exception:
                subjects_count = 0
            
            # Try to get exam scores/average
            try:
                from exams.models import ExamScore
                scores = ExamScore.objects.filter(
                    student=self.student,
                    exam__academic_year=enrollment.academic_year
                )
                avg = scores.aggregate(avg=Avg('marks_obtained'))['avg']
                if avg is not None:
                    average_score = round(float(avg), 2)
            except Exception:
                average_score = None
        
        return {
            'current_gpa': 0.0,
            'rank_in_class': 0,
            'subjects_count': subjects_count,
            'attendance_percentage': self._get_attendance_percentage(),
            'average_score': average_score,
        }
    
    def _get_financial_summary(self):
        """Get financial summary."""
        try:
            from fees.models import FeeInvoice, FeeTransaction
            from django.db.models import Sum, Max
            
            enrollment = self.student.get_current_enrollment()
            academic_year = enrollment.academic_year if enrollment else None
            
            # Query lifetime invoices to match KPI balances
            invoice_qs = FeeInvoice.objects.filter(
                tenant=self.student.tenant,
                student=self.student,
            )
            
            totals = invoice_qs.aggregate(
                total=Sum('total_amount'),
                paid=Sum('paid_amount'),
            )
            
            total_fees = float(totals['total'] or 0)
            paid = float(totals['paid'] or 0)
            pending = total_fees - paid
            
            # Get last payment date
            last_payment = FeeTransaction.objects.filter(
                tenant=self.student.tenant,
                invoice__student=self.student,
            ).order_by('-transaction_date').values_list('transaction_date', flat=True).first()
            
            return {
                'total_fees': total_fees,
                'paid': paid,
                'pending': pending,
                'last_payment_date': last_payment.isoformat() if last_payment else None,
            }
        except Exception as e:
            print(f"Error getting financial summary: {e}")
            return {
                'total_fees': 0.0,
                'paid': 0.0,
                'pending': self._get_fee_balance(),
                'last_payment_date': None,
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
                fee_structure__academic_year=academic_year,
                is_active=True
            )
            
            # Calculate total allocated fee
            total_allocated = sum(
                allocation.get_final_amount() 
                for allocation in allocations
            )
            
            # Get discount percentage (average of all allocations)
            discount_pct = allocations.aggregate(
                avg_discount=Avg('scholarship_percentage')
            )['avg_discount'] or 0
            
            # Get all invoices across all academic years to match overall KPI balance
            invoices = FeeInvoice.objects.filter(
                tenant=self.student.tenant,
                student=self.student
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
                float(allocation.fee_structure.amount) - float(allocation.get_final_amount())
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
        """Count homework assigned to the student's section that is not yet completed."""
        return self._get_homework().get('summary', {}).get('pending', 0)

    def _get_open_complaints_count(self):
        """Count complaints for this student that are still OPEN or IN_PROGRESS."""
        try:
            from complaints.models import Complaint
            return Complaint.objects.filter(
                tenant=self.student.tenant,
                student=self.student,
                status__in=['OPEN', 'IN_PROGRESS'],
            ).count()
        except Exception:  # complaints app optional / not migrated
            return 0

    # ------------------------------------------------------------------
    # Complaints / Issues / Queries (complaints app)
    # ------------------------------------------------------------------
    def _get_complaints(self, limit=10):
        """
        Recent complaints/issues/queries about this student, plus a status
        summary. Reads from the complaints app; degrades to an empty section
        if that app is unavailable.
        """
        empty = {
            'summary': {'total': 0, 'open': 0, 'in_progress': 0, 'resolved': 0, 'closed': 0},
            'items': [],
        }
        try:
            from complaints.models import Complaint
        except Exception:
            return empty

        try:
            qs = (
                Complaint.objects.filter(tenant=self.student.tenant, student=self.student)
                .select_related('created_by', 'assigned_to', 'teacher')
                .order_by('-created_at')
            )

            # Status counts over the full set (not just the recent page).
            counts = {row['status']: row['n'] for row in qs.values('status').annotate(n=Count('id'))}
            summary = {
                'total': sum(counts.values()),
                'open': counts.get('OPEN', 0),
                'in_progress': counts.get('IN_PROGRESS', 0),
                'resolved': counts.get('RESOLVED', 0),
                'closed': counts.get('CLOSED', 0),
            }

            items = [
                {
                    'id': str(c.id),
                    'title': c.title,
                    'description': c.description,
                    'type': c.type,
                    'category': c.category,
                    'priority': c.priority,
                    'status': c.status,
                    'raised_by': c.created_by.get_full_name() if c.created_by else 'System',
                    'assigned_to': c.assigned_to.get_full_name() if c.assigned_to else None,
                    'teacher': c.teacher.get_full_name() if c.teacher else None,
                    'resolution_notes': c.resolution_notes,
                    'resolved_at': c.resolved_at.isoformat() if c.resolved_at else None,
                    'created_at': c.created_at.isoformat(),
                }
                for c in qs[:limit]
            ]
            return {'summary': summary, 'items': items}
        except Exception as e:
            print(f"Error getting complaints: {e}")
            return empty

    # ------------------------------------------------------------------
    # Homework (academics app)
    # ------------------------------------------------------------------
    def _get_homework(self, limit=10):
        """
        Recent homework assigned to the student's current section, each tagged
        with a derived submission status (COMPLETED / PENDING / OVERDUE), plus a
        completed-vs-pending summary. Homework is assigned per-section; the
        per-student completion state lives in HomeworkCompletion.
        """
        from datetime import date

        empty = {
            'summary': {'total': 0, 'completed': 0, 'pending': 0, 'overdue': 0},
            'items': [],
        }
        if not self.enrollment:
            return empty
        try:
            from academics.models import Homework, HomeworkCompletion
        except Exception:
            return empty

        try:
            section = self.enrollment.section
            hw_qs = (
                Homework.objects.filter(section=section)
                .select_related('subject', 'teacher')
                .order_by('-assigned_date')
            )
            if self.academic_year:
                hw_qs = hw_qs.filter(academic_year=self.academic_year)

            # One query for this student's completion flags, keyed by homework id.
            completed_ids = set(
                HomeworkCompletion.objects.filter(
                    student=self.student, homework__section=section, is_completed=True
                ).values_list('homework_id', flat=True)
            )

            today = date.today()

            def derive_status(hw):
                if hw.id in completed_ids:
                    return 'COMPLETED'
                if hw.due_date and hw.due_date < today:
                    return 'OVERDUE'
                return 'PENDING'

            summary = {'total': 0, 'completed': 0, 'pending': 0, 'overdue': 0}
            items = []
            for hw in hw_qs:
                st = derive_status(hw)
                summary['total'] += 1
                summary[st.lower()] += 1
                if len(items) < limit:
                    items.append({
                        'id': str(hw.id),
                        'title': hw.title,
                        'subject': hw.subject.name if hw.subject_id else None,
                        'teacher': hw.teacher.get_full_name() if hw.teacher_id else None,
                        'assigned_date': hw.assigned_date.isoformat() if hw.assigned_date else None,
                        'due_date': hw.due_date.isoformat() if hw.due_date else None,
                        'priority': getattr(hw, 'priority', None),
                        'status': st,
                    })
            return {'summary': summary, 'items': items}
        except Exception as e:
            print(f"Error getting homework: {e}")
            return empty

    # ------------------------------------------------------------------
    # Exam results / marks (exams app)
    # ------------------------------------------------------------------
    def _get_exam_results(self, limit=5):
        """
        Most recent published exam results with subject-wise marks and grade,
        plus a simple chronological percentage trend and an overall average.
        """
        empty = {'items': [], 'trend': [], 'average_percentage': None}
        try:
            from exams.models import ExamResult
        except Exception:
            return empty

        try:
            qs = (
                ExamResult.objects.filter(student=self.student, status='PUBLISHED')
                .select_related('exam', 'exam__subject', 'exam__exam_term')
                .order_by('-created_at')
            )

            recent = list(qs[:limit])
            items = []
            for r in recent:
                exam = r.exam
                term = getattr(exam, 'exam_term', None) if exam else None
                items.append({
                    'id': str(r.id),
                    'exam': getattr(exam, 'name', None),
                    'subject': exam.subject.name if exam and exam.subject_id else None,
                    'term': getattr(term, 'name', None),
                    'marks_obtained': float(r.marks_obtained) if r.marks_obtained is not None else None,
                    'total_marks': float(exam.total_marks) if exam and exam.total_marks is not None else None,
                    'percentage': float(r.percentage) if r.percentage is not None else None,
                    'grade': r.grade,
                    'is_pass': r.is_pass,
                    'is_absent': r.is_absent,
                })

            # Chronological trend (oldest -> newest) for a simple line chart.
            trend = [
                {'exam': i['exam'], 'subject': i['subject'], 'percentage': i['percentage']}
                for i in reversed(items)
                if i['percentage'] is not None
            ]
            percentages = [i['percentage'] for i in items if i['percentage'] is not None]
            average = round(sum(percentages) / len(percentages), 2) if percentages else None

            return {'items': items, 'trend': trend, 'average_percentage': average}
        except Exception as e:
            print(f"Error getting exam results: {e}")
            return empty

    # ------------------------------------------------------------------
    # Teacher daily remarks (staffwork app)
    # ------------------------------------------------------------------
    def _get_teacher_remarks(self, limit=15):
        """
        Recent per-student daily observations recorded by teachers (staffwork
        StudentDailyRemark), a 30-day summary of flag counts, and a simple
        at-risk indicator. Degrades to an empty section if staffwork is
        unavailable.

        The at-risk flag trips when negative flags in the last 30 days cross a
        threshold, so the UI can surface a watchlist badge.
        """
        from datetime import timedelta

        empty = {
            'summary': {
                'window_days': 30, 'total': 0,
                'did_not_do_homework': 0, 'did_not_complete_classwork': 0,
                'was_disruptive': 0, 'was_absent': 0, 'participated_well': 0,
                'negative_total': 0,
            },
            'at_risk': False,
            'items': [],
        }
        try:
            from staffwork.models import StudentDailyRemark
        except Exception:
            return empty

        try:
            qs = (
                StudentDailyRemark.objects.filter(
                    tenant=self.student.tenant, student=self.student, is_deleted=False
                )
                .select_related('daily_update', 'daily_update__user')
                .order_by('-daily_update__date', '-created_at')
            )

            # 30-day summary over the full set (not just the recent page).
            window_start = timezone.now().date() - timedelta(days=30)
            window_qs = qs.filter(daily_update__date__gte=window_start)
            summary = {
                'window_days': 30,
                'total': window_qs.count(),
                'did_not_do_homework': window_qs.filter(did_not_do_homework=True).count(),
                'did_not_complete_classwork': window_qs.filter(did_not_complete_classwork=True).count(),
                'was_disruptive': window_qs.filter(was_disruptive=True).count(),
                'was_absent': window_qs.filter(was_absent=True).count(),
                'participated_well': window_qs.filter(participated_well=True).count(),
            }
            summary['negative_total'] = (
                summary['did_not_do_homework']
                + summary['did_not_complete_classwork']
                + summary['was_disruptive']
            )
            # At-risk if 3+ negative flags in the trailing 30 days.
            at_risk = summary['negative_total'] >= 3

            items = [
                {
                    'id': str(r.id),
                    'date': r.daily_update.date.isoformat() if r.daily_update_id else None,
                    'teacher': r.daily_update.user.get_full_name() if r.daily_update_id and r.daily_update.user_id else None,
                    'did_not_do_homework': r.did_not_do_homework,
                    'did_not_complete_classwork': r.did_not_complete_classwork,
                    'was_disruptive': r.was_disruptive,
                    'was_absent': r.was_absent,
                    'participated_well': r.participated_well,
                    'remark': r.remark,
                    'severity': r.severity,
                    'has_negative_flag': r.has_negative_flag,
                }
                for r in qs[:limit]
            ]
            return {'summary': summary, 'at_risk': at_risk, 'items': items}
        except Exception as e:
            print(f"Error getting teacher remarks: {e}")
            return empty


class SiblingLinkingService:
    """
    Links students into the same `family_id` group when they share a
    father's or mother's mobile number, so `Student.get_siblings()` and the
    Student 360 family summary pick them up automatically.

    Two entry points:
    - `link_new_student`: cheap, single-record check run right after a
      student is created (admission form, or a row inside a bulk import).
    - `sync_tenant`: full reconciliation pass over every active student in
      a tenant, used for mass/backfill matching (post-bulk-import or via the
      manual "sync siblings" endpoint). Idempotent - groups that already
      share one `family_id` are left untouched.
    """

    PHONE_FIELDS = ['father_phone', 'mother_phone']

    @classmethod
    def _student_phones(cls, student):
        """Normalized, de-duplicated, non-empty parent phone numbers for a student."""
        phones = set()
        for field in cls.PHONE_FIELDS:
            normalized = normalize_phone_number(getattr(student, field, ''))
            if normalized:
                phones.add(normalized)
        return phones

    @staticmethod
    def _raw_variants(normalized_phone):
        """Raw string forms a normalized 10-digit phone may be stored as in the DB."""
        return {
            normalized_phone,
            f'+91{normalized_phone}',
            f'91{normalized_phone}',
            f'0{normalized_phone}',
        }

    @staticmethod
    def _generate_family_id():
        return f"FAM-{uuid.uuid4().hex[:8].upper()}"

    @classmethod
    def link_new_student(cls, student):
        """
        Single-student fallback: call right after a new Student is saved.

        Looks up existing students in the same tenant whose father/mother
        phone matches this student's, and joins that family group - adopting
        an existing `family_id` if one of the matches already has one
        (merging multiple pre-existing family_ids together if needed), or
        minting a fresh `family_id` shared by the new student and its
        matches. Falls back to a fresh standalone `family_id` when there is
        no match, preserving today's behaviour for only-children.

        Returns:
            dict describing the outcome, e.g.
            {'linked': True, 'family_id': 'FAM-ABC123',
             'matched_student_ids': [...], 'merged_family_ids': [...]}
        """
        phones = cls._student_phones(student)

        if not phones:
            if not student.family_id:
                student.family_id = cls._generate_family_id()
                student.save(update_fields=['family_id'])
            return {'linked': False, 'reason': 'no_parent_phone', 'family_id': student.family_id}

        variants = set()
        for phone in phones:
            variants |= cls._raw_variants(phone)

        matches = list(
            Student.objects.filter(tenant=student.tenant)
            .filter(Q(father_phone__in=variants) | Q(mother_phone__in=variants))
            .exclude(id=student.id)
        )

        if not matches:
            if not student.family_id:
                student.family_id = cls._generate_family_id()
                student.save(update_fields=['family_id'])
            return {'linked': False, 'reason': 'no_match', 'family_id': student.family_id}

        existing_family_ids = sorted({m.family_id for m in matches if m.family_id})
        merged_family_ids = []

        if existing_family_ids:
            canonical = existing_family_ids[0]
            merged_family_ids = existing_family_ids[1:]
            if merged_family_ids:
                Student.objects.filter(
                    tenant=student.tenant, family_id__in=merged_family_ids
                ).update(family_id=canonical)
        else:
            canonical = cls._generate_family_id()
            Student.objects.filter(id__in=[m.id for m in matches]).update(family_id=canonical)

        if student.family_id != canonical:
            student.family_id = canonical
            student.save(update_fields=['family_id'])

        return {
            'linked': True,
            'family_id': canonical,
            'matched_student_ids': [str(m.id) for m in matches],
            'merged_family_ids': merged_family_ids,
        }

    @classmethod
    def sync_tenant(cls, tenant):
        """
        Bulk sync: scans every active student in the tenant, groups them by
        shared father/mother phone number - transitively, so if A matches B
        and B matches C on a different number, all three land in one family
        - and backfills/merges `family_id` across each resulting group.

        Idempotent: a group that already shares exactly one non-blank
        `family_id` requires no writes and is counted as skipped, so
        re-running this after every import is cheap and safe.

        Returns:
            dict: {
                'processed': int,               # active students scanned
                'groups_found': int,            # sibling groups with 2+ members
                'linked': int,                  # student rows whose family_id changed
                'skipped_already_linked': int,  # groups that needed no change
                'standalone_assigned': int,      # solo students backfilled with a fresh family_id
            }
        """
        students = list(
            Student.objects.filter(tenant=tenant, is_active=True)
            .only('id', 'family_id', 'father_phone', 'mother_phone')
        )

        # Union-find grouping: students sharing any normalized phone number
        # end up in the same connected component, even if the shared number
        # is on different sides (father/mother) or chains through a third student.
        parent = {s.id: s.id for s in students}

        def find(sid):
            root = sid
            while parent[root] != root:
                root = parent[root]
            while parent[sid] != root:
                parent[sid], sid = root, parent[sid]
            return root

        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb

        phone_to_first_student = {}
        for s in students:
            for phone in cls._student_phones(s):
                if phone in phone_to_first_student:
                    union(s.id, phone_to_first_student[phone])
                else:
                    phone_to_first_student[phone] = s.id

        groups = {}
        for s in students:
            groups.setdefault(find(s.id), []).append(s)

        stats = {
            'processed': len(students),
            'groups_found': 0,
            'linked': 0,
            'skipped_already_linked': 0,
            'standalone_assigned': 0,
        }

        for members in groups.values():
            if len(members) == 1:
                student = members[0]
                if not student.family_id:
                    student.family_id = cls._generate_family_id()
                    student.save(update_fields=['family_id'])
                    stats['standalone_assigned'] += 1
                continue

            stats['groups_found'] += 1
            existing_family_ids = sorted({m.family_id for m in members if m.family_id})

            if len(existing_family_ids) == 1 and all(m.family_id == existing_family_ids[0] for m in members):
                # Already correctly linked - skip to avoid redundant writes.
                stats['skipped_already_linked'] += 1
                continue

            canonical = existing_family_ids[0] if existing_family_ids else cls._generate_family_id()
            to_update_ids = [m.id for m in members if m.family_id != canonical]
            if to_update_ids:
                Student.objects.filter(id__in=to_update_ids).update(family_id=canonical)
                stats['linked'] += len(to_update_ids)

        return stats


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
    enrollment = student.get_current_enrollment()
    academic_year = enrollment.academic_year if enrollment else None

    return StudentRemark.objects.create(
        student=student,
        academic_year=academic_year,
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
