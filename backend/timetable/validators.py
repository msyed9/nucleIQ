"""
Timetable Validators for Conflict Detection
Provides API for checking availability before creating/updating slots.
"""

from datetime import time
from typing import Dict, List, Optional, Tuple
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import TimetableSlot


class TimetableValidator:
    """
    Validator class for timetable conflict checking.
    """
    
    @staticmethod
    def check_availability(
        tenant,
        academic_year,
        day_of_week: str,
        start_time: time,
        end_time: time,
        teacher_id: Optional[str] = None,
        room: Optional[str] = None,
        section_id: Optional[str] = None,
        exclude_slot_id: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Check availability for a given time slot.
        
        Args:
            tenant: Tenant instance
            academic_year: AcademicYear instance
            day_of_week: Day of the week (e.g., 'MONDAY')
            start_time: Start time
            end_time: End time
            teacher_id: Optional teacher ID to check
            room: Optional room to check
            section_id: Optional section ID to check
            exclude_slot_id: Optional slot ID to exclude (for updates)
        
        Returns:
            Dictionary with availability status and conflicts
        """
        conflicts = {
            'teacher_conflicts': [],
            'room_conflicts': [],
            'section_conflicts': [],
            'is_available': True
        }
        
        # Validate time range
        if end_time <= start_time:
            conflicts['is_available'] = False
            conflicts['error'] = 'End time must be after start time'
            return conflicts
        
        # Check teacher availability
        if teacher_id:
            teacher_conflicts = TimetableValidator._check_teacher_availability(
                tenant, academic_year, day_of_week, start_time, end_time,
                teacher_id, exclude_slot_id
            )
            if teacher_conflicts:
                conflicts['teacher_conflicts'] = teacher_conflicts
                conflicts['is_available'] = False
        
        # Check room availability
        if room:
            room_conflicts = TimetableValidator._check_room_availability(
                tenant, academic_year, day_of_week, start_time, end_time,
                room, exclude_slot_id
            )
            if room_conflicts:
                conflicts['room_conflicts'] = room_conflicts
                conflicts['is_available'] = False
        
        # Check section availability
        if section_id:
            section_conflicts = TimetableValidator._check_section_availability(
                tenant, academic_year, day_of_week, start_time, end_time,
                section_id, exclude_slot_id
            )
            if section_conflicts:
                conflicts['section_conflicts'] = section_conflicts
                conflicts['is_available'] = False
        
        return conflicts
    
    @staticmethod
    def _check_teacher_availability(
        tenant,
        academic_year,
        day_of_week: str,
        start_time: time,
        end_time: time,
        teacher_id: str,
        exclude_slot_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Check if teacher is available at the given time.
        """
        query = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            teacher_id=teacher_id,
            day_of_week=day_of_week,
            is_active=True,
            is_deleted=False
        )
        
        if exclude_slot_id:
            query = query.exclude(id=exclude_slot_id)
        
        # Check for time overlap
        conflicts = query.filter(
            Q(start_time__lt=end_time) &
            Q(end_time__gt=start_time)
        )
        
        return [
            {
                'id': str(slot.id),
                'section': str(slot.section),
                'subject': slot.subject.name,
                'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}",
                'room': slot.room or 'N/A'
            }
            for slot in conflicts
        ]
    
    @staticmethod
    def _check_room_availability(
        tenant,
        academic_year,
        day_of_week: str,
        start_time: time,
        end_time: time,
        room: str,
        exclude_slot_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Check if room is available at the given time.
        """
        query = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            room=room,
            day_of_week=day_of_week,
            is_active=True,
            is_deleted=False
        )
        
        if exclude_slot_id:
            query = query.exclude(id=exclude_slot_id)
        
        # Check for time overlap
        conflicts = query.filter(
            Q(start_time__lt=end_time) &
            Q(end_time__gt=start_time)
        )
        
        return [
            {
                'id': str(slot.id),
                'section': str(slot.section),
                'subject': slot.subject.name,
                'teacher': slot.teacher.get_full_name() if slot.teacher else 'N/A',
                'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
            }
            for slot in conflicts
        ]
    
    @staticmethod
    def _check_section_availability(
        tenant,
        academic_year,
        day_of_week: str,
        start_time: time,
        end_time: time,
        section_id: str,
        exclude_slot_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Check if section is available at the given time.
        """
        query = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            section_id=section_id,
            day_of_week=day_of_week,
            is_active=True,
            is_deleted=False
        )
        
        if exclude_slot_id:
            query = query.exclude(id=exclude_slot_id)
        
        # Check for time overlap
        conflicts = query.filter(
            Q(start_time__lt=end_time) &
            Q(end_time__gt=start_time)
        )
        
        return [
            {
                'id': str(slot.id),
                'subject': slot.subject.name,
                'teacher': slot.teacher.get_full_name() if slot.teacher else 'N/A',
                'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}",
                'room': slot.room or 'N/A'
            }
            for slot in conflicts
        ]
    
    @staticmethod
    def get_teacher_schedule(
        tenant,
        academic_year,
        teacher_id: str,
        day_of_week: Optional[str] = None
    ) -> List[Dict]:
        """
        Get complete schedule for a teacher.
        
        Args:
            tenant: Tenant instance
            academic_year: AcademicYear instance
            teacher_id: Teacher ID
            day_of_week: Optional day filter
        
        Returns:
            List of scheduled slots
        """
        query = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            teacher_id=teacher_id,
            is_active=True,
            is_deleted=False
        ).select_related('section', 'subject', 'section__grade_level')
        
        if day_of_week:
            query = query.filter(day_of_week=day_of_week)
        
        return [
            {
                'id': str(slot.id),
                'day': slot.day_of_week,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'section': str(slot.section),
                'subject': slot.subject.name,
                'room': slot.room or 'N/A',
                'period_number': slot.period_number
            }
            for slot in query.order_by('day_of_week', 'start_time')
        ]
    
    @staticmethod
    def get_section_schedule(
        tenant,
        academic_year,
        section_id: str,
        day_of_week: Optional[str] = None
    ) -> List[Dict]:
        """
        Get complete schedule for a section/class.
        
        Args:
            tenant: Tenant instance
            academic_year: AcademicYear instance
            section_id: Section ID
            day_of_week: Optional day filter
        
        Returns:
            List of scheduled slots
        """
        query = TimetableSlot.objects.filter(
            tenant=tenant,
            academic_year=academic_year,
            section_id=section_id,
            is_active=True,
            is_deleted=False
        ).select_related('subject', 'teacher', 'teacher__user')
        
        if day_of_week:
            query = query.filter(day_of_week=day_of_week)
        
        return [
            {
                'id': str(slot.id),
                'day': slot.day_of_week,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'subject': slot.subject.name,
                'teacher': slot.teacher.get_full_name() if slot.teacher else 'N/A',
                'teacher_id': str(slot.teacher.id) if slot.teacher else None,
                'room': slot.room or 'N/A',
                'period_number': slot.period_number
            }
            for slot in query.order_by('day_of_week', 'start_time')
        ]
    
    @staticmethod
    def validate_bulk_slots(
        tenant,
        academic_year,
        slots_data: List[Dict]
    ) -> Dict[str, any]:
        """
        Validate multiple slots at once for bulk creation.
        
        Args:
            tenant: Tenant instance
            academic_year: AcademicYear instance
            slots_data: List of slot dictionaries
        
        Returns:
            Validation results with conflicts
        """
        results = {
            'valid': [],
            'invalid': [],
            'conflicts': []
        }
        
        for idx, slot_data in enumerate(slots_data):
            try:
                conflicts = TimetableValidator.check_availability(
                    tenant=tenant,
                    academic_year=academic_year,
                    day_of_week=slot_data.get('day_of_week'),
                    start_time=slot_data.get('start_time'),
                    end_time=slot_data.get('end_time'),
                    teacher_id=slot_data.get('teacher_id'),
                    room=slot_data.get('room'),
                    section_id=slot_data.get('section_id')
                )
                
                if conflicts['is_available']:
                    results['valid'].append({
                        'index': idx,
                        'data': slot_data
                    })
                else:
                    results['invalid'].append({
                        'index': idx,
                        'data': slot_data,
                        'conflicts': conflicts
                    })
            except Exception as e:
                results['invalid'].append({
                    'index': idx,
                    'data': slot_data,
                    'error': str(e)
                })
        
        return results
