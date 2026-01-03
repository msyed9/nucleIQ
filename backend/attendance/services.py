"""
Attendance Calculation and Business Logic Services
"""

from datetime import datetime, date, timedelta
from django.db.models import Count, Q
from django.utils import timezone
from .models import AttendanceRecord, AttendanceMonthlyAggregate, AttendanceConfiguration


class AttendanceCalculationService:
    """Service for attendance calculations and aggregations."""
    
    @staticmethod
    def calculate_working_days(start_date, end_date, tenant):
        """
        Calculate working days excluding Sundays and holidays.
        """
        from tenants.models import Holiday
        
        total_days = (end_date - start_date).days + 1
        
        # Count Sundays
        sundays = 0
        current = start_date
        while current <= end_date:
            if current.weekday() == 6:  # Sunday
                sundays += 1
            current += timedelta(days=1)
        
        # Get holidays in date range
        holidays = Holiday.objects.filter(
            tenant=tenant,
            is_deleted=False,
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        
        # Count holiday days (excluding Sundays which are already counted)
        holiday_days = 0
        for holiday in holidays:
            current = max(holiday.start_date, start_date)
            end = min(holiday.end_date, end_date)
            
            while current <= end:
                # Only count if not already a Sunday
                if current.weekday() != 6:
                    holiday_days += 1
                current += timedelta(days=1)
        
        working_days = total_days - sundays - holiday_days
        return max(working_days, 0)  # Ensure non-negative
    
    @staticmethod
    def is_holiday(date, tenant, record_type='STUDENT'):
        """
        Check if a given date is a holiday.
        
        Args:
            date: Date to check
            tenant: Tenant instance
            record_type: 'STUDENT' or 'STAFF'
        
        Returns:
            tuple: (is_holiday: bool, holiday: Holiday instance or None)
        """
        from tenants.models import Holiday
        
        # Check if date is Sunday
        if date.weekday() == 6:
            return (True, None)
        
        # Check for holidays
        holiday = Holiday.objects.filter(
            tenant=tenant,
            is_deleted=False,
            start_date__lte=date,
            end_date__gte=date,
            is_attendance_blocked=True
        ).first()
        
        if holiday:
            # Check if holiday applies to this record type
            if record_type == 'STUDENT' and holiday.applies_to_students:
                return (True, holiday)
            elif record_type == 'STAFF' and holiday.applies_to_staff:
                return (True, holiday)
        
        return (False, None)
    
    @staticmethod
    def calculate_attendance_percentage(present_days, late_days, working_days):
        """
        Calculate attendance percentage.
        Formula: (Present + Late) / Working Days * 100
        """
        if working_days == 0:
            return 0
        
        effective_present = present_days + late_days
        percentage = (effective_present / working_days) * 100
        return round(percentage, 2)
    
    @staticmethod
    def recalculate_monthly_aggregate(record_type, entity_id, month_date, tenant):
        """
        Recalculate monthly aggregate for a student or staff member.
        """
        from students.models import Student
        from staff.models import Staff
        from tenants.models import AcademicYear
        
        # Get first and last day of month
        first_day = month_date.replace(day=1)
        if month_date.month == 12:
            last_day = date(month_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(month_date.year, month_date.month + 1, 1) - timedelta(days=1)
        
        # Calculate working days
        working_days = AttendanceCalculationService.calculate_working_days(
            first_day, last_day, tenant
        )
        
        # Get attendance records
        if record_type == 'STUDENT':
            records = AttendanceRecord.objects.filter(
                student_id=entity_id,
                date__range=[first_day, last_day]
            )
            entity = Student.objects.get(id=entity_id)
        else:
            records = AttendanceRecord.objects.filter(
                staff_id=entity_id,
                date__range=[first_day, last_day]
            )
            entity = Staff.objects.get(id=entity_id)
        
        # Count by status
        present = records.filter(status='PRESENT').count()
        absent = records.filter(status='ABSENT').count()
        late = records.filter(status='LATE').count()
        half_day = records.filter(status='HALF_DAY').count()
        on_leave = records.filter(status='ON_LEAVE').count()
        
        # Calculate percentage
        percentage = AttendanceCalculationService.calculate_attendance_percentage(
            present, late, working_days
        )
        
        # Get academic year
        academic_year = AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True
        ).first()
        
        # Update or create aggregate
        aggregate_data = {
            'total_days': (last_day - first_day).days + 1,
            'working_days': working_days,
            'present_days': present,
            'absent_days': absent,
            'late_days': late,
            'half_days': half_day,
            'leave_days': on_leave,
            'attendance_percentage': percentage,
            'academic_year': academic_year,
            'record_type': record_type,
        }
        
        if record_type == 'STUDENT':
            aggregate, created = AttendanceMonthlyAggregate.objects.update_or_create(
                tenant=tenant,
                student=entity,
                month=first_day,
                defaults=aggregate_data
            )
        else:
            aggregate, created = AttendanceMonthlyAggregate.objects.update_or_create(
                tenant=tenant,
                staff=entity,
                month=first_day,
                defaults=aggregate_data
            )
        
        return aggregate
    
    @staticmethod
    def check_consecutive_absents(record_type, entity_id, tenant):
        """
        Check for consecutive absents and return count.
        """
        records = AttendanceRecord.objects.filter(
            tenant=tenant,
            record_type=record_type
        )
        
        if record_type == 'STUDENT':
            records = records.filter(student_id=entity_id)
        else:
            records = records.filter(staff_id=entity_id)
        
        records = records.order_by('-date')[:10]
        
        consecutive = 0
        for record in records:
            if record.status == 'ABSENT':
                consecutive += 1
            else:
                break
        
        return consecutive
