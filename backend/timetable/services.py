"""
Timetable Generation Service

This module provides the TimetableGeneratorService class which implements
a greedy algorithm for auto-generating timetables based on subject loads
and constraints.
"""

import logging
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field

from django.db import transaction
from django.db.models import Q

from .models import TimetableSlot, TimetablePeriodConfig, SubjectSectionLoad
from .validators import TimetableValidator

logger = logging.getLogger(__name__)


@dataclass
class SlotAssignment:
    """Represents a proposed slot assignment."""
    section_id: str
    subject_id: str
    teacher_id: Optional[str]
    room: str
    day: str
    period_config: Dict[str, Any]
    
    
@dataclass
class GenerationResult:
    """Result of timetable generation."""
    success: bool
    generated_count: int = 0
    skipped_count: int = 0
    unscheduled: List[Dict] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    slots_created: List[Dict] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'success': self.success,
            'generated_count': self.generated_count,
            'skipped_count': self.skipped_count,
            'unscheduled': self.unscheduled,
            'warnings': self.warnings,
            'errors': self.errors,
            'slots_created': self.slots_created
        }


class TimetableGeneratorService:
    """
    Service for auto-generating timetables using a greedy algorithm.
    
    The algorithm works as follows:
    1. Load period configuration and subject loads
    2. Sort subject loads by priority (lab subjects first, then by priority field)
    3. For each subject load, attempt to assign required periods across the week
    4. Track conflicts and unscheduled items
    5. Return results with generated slots and any failures
    """
    
    def __init__(self, tenant, academic_year):
        """
        Initialize the generator service.
        
        Args:
            tenant: Tenant instance
            academic_year: AcademicYear instance
        """
        self.tenant = tenant
        self.academic_year = academic_year
        self.config: Optional[TimetablePeriodConfig] = None
        
        # Schedule tracking - prevents double-booking
        self.teacher_schedule: Dict[str, Dict[str, List[int]]] = {}  # {teacher_id: {day: [period_nums]}}
        self.room_schedule: Dict[str, Dict[str, List[int]]] = {}     # {room: {day: [period_nums]}}
        self.section_schedule: Dict[str, Dict[str, List[int]]] = {}  # {section_id: {day: [period_nums]}}
        
        # Track subject assignments per section per day (for max_periods_per_day constraint)
        self.subject_daily_count: Dict[str, Dict[str, Dict[str, int]]] = {}  # {section_id: {day: {subject_id: count}}}
        
    def generate(
        self,
        section_ids: Optional[List[str]] = None,
        clear_existing: bool = False,
        preview_only: bool = False
    ) -> GenerationResult:
        """
        Generate timetable for specified sections or all sections.
        
        Args:
            section_ids: List of section IDs to generate for (None = all with loads)
            clear_existing: If True, delete existing slots before generating
            preview_only: If True, don't save to database (dry run)
            
        Returns:
            GenerationResult with details of what was generated
        """
        result = GenerationResult(success=True)
        
        try:
            # 1. Load and validate configuration
            self.config = self._get_active_config()
            if not self.config:
                result.success = False
                result.errors.append(
                    "No active period configuration found. Please create one first."
                )
                return result
            
            # 2. Load subject loads
            subject_loads = self._get_subject_loads(section_ids)
            if not subject_loads:
                result.success = False
                result.errors.append(
                    "No subject loads defined. Please configure subject-section loads first."
                )
                return result
            
            logger.info(f"Generating timetable for {len(subject_loads)} subject-section combinations")
            
            # 3. Build existing schedule maps (for teachers/rooms already allocated)
            if not clear_existing:
                self._build_existing_schedule_maps(section_ids)
            
            # 4. Clear existing slots if requested
            if clear_existing and not preview_only:
                self._clear_existing_slots(section_ids)
            
            # 5. Sort loads by scheduling difficulty
            sorted_loads = self._sort_by_difficulty(subject_loads)
            
            # 6. Generate slots
            with transaction.atomic():
                for load in sorted_loads:
                    self._process_subject_load(load, result, preview_only)
            
            # 7. Log summary
            if result.unscheduled:
                result.warnings.append(
                    f"{len(result.unscheduled)} subject-section combinations could not be fully scheduled"
                )
            
            logger.info(
                f"Generation complete: {result.generated_count} slots created, "
                f"{len(result.unscheduled)} unscheduled items"
            )
            
        except Exception as e:
            logger.exception("Error during timetable generation")
            result.success = False
            result.errors.append(f"Generation failed: {str(e)}")
        
        return result
    
    def _get_active_config(self) -> Optional[TimetablePeriodConfig]:
        """Get the active period configuration for this academic year."""
        return TimetablePeriodConfig.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year,
            is_active=True
        ).first()
    
    def _get_subject_loads(self, section_ids: Optional[List[str]] = None) -> List[SubjectSectionLoad]:
        """Get all active subject loads for the specified sections."""
        queryset = SubjectSectionLoad.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year,
            is_active=True
        ).select_related('section', 'subject', 'preferred_teacher')
        
        if section_ids:
            queryset = queryset.filter(section_id__in=section_ids)
        
        return list(queryset)
    
    def _build_existing_schedule_maps(self, section_ids: Optional[List[str]] = None) -> None:
        """Build schedule maps from existing timetable slots."""
        existing_slots = TimetableSlot.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year,
            is_active=True,
            is_deleted=False
        )
        
        # If we're generating for specific sections, we still need to track
        # teacher and room availability across ALL sections
        for slot in existing_slots:
            day = slot.day_of_week
            period = slot.period_number
            
            # Track teacher schedule
            if slot.teacher_id:
                teacher_id = str(slot.teacher_id)
                if teacher_id not in self.teacher_schedule:
                    self.teacher_schedule[teacher_id] = {}
                if day not in self.teacher_schedule[teacher_id]:
                    self.teacher_schedule[teacher_id][day] = []
                if period not in self.teacher_schedule[teacher_id][day]:
                    self.teacher_schedule[teacher_id][day].append(period)
            
            # Track room schedule
            if slot.room:
                room = slot.room
                if room not in self.room_schedule:
                    self.room_schedule[room] = {}
                if day not in self.room_schedule[room]:
                    self.room_schedule[room][day] = []
                if period not in self.room_schedule[room][day]:
                    self.room_schedule[room][day].append(period)
            
            # Track section schedule (only for sections we're NOT regenerating)
            section_id = str(slot.section_id)
            if section_ids is None or section_id not in section_ids:
                if section_id not in self.section_schedule:
                    self.section_schedule[section_id] = {}
                if day not in self.section_schedule[section_id]:
                    self.section_schedule[section_id][day] = []
                if period not in self.section_schedule[section_id][day]:
                    self.section_schedule[section_id][day].append(period)
    
    def _clear_existing_slots(self, section_ids: Optional[List[str]] = None) -> int:
        """Delete existing timetable slots for specified sections."""
        queryset = TimetableSlot.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year
        )
        
        if section_ids:
            queryset = queryset.filter(section_id__in=section_ids)
        
        count = queryset.count()
        queryset.delete()
        logger.info(f"Cleared {count} existing timetable slots")
        return count
    
    def _sort_by_difficulty(self, loads: List[SubjectSectionLoad]) -> List[SubjectSectionLoad]:
        """
        Sort subject loads by scheduling difficulty.
        
        Harder to schedule items should be placed first:
        1. Lab subjects (less flexible room options)
        2. Lower priority number (1 = highest priority)
        3. Higher periods per week (more slots to fill)
        """
        def sort_key(load: SubjectSectionLoad) -> Tuple:
            return (
                0 if load.requires_lab else 1,  # Labs first
                load.priority,                   # Lower priority number = higher priority
                -load.periods_per_week,          # More periods first
            )
        
        return sorted(loads, key=sort_key)
    
    def _process_subject_load(
        self,
        load: SubjectSectionLoad,
        result: GenerationResult,
        preview_only: bool
    ) -> None:
        """
        Process a single subject-section load and create slots.
        
        Args:
            load: SubjectSectionLoad to process
            result: GenerationResult to update
            preview_only: If True, don't save to database
        """
        section_id = str(load.section_id)
        subject_id = str(load.subject_id)
        teacher_id = str(load.preferred_teacher_id) if load.preferred_teacher_id else None
        room = load.room_preference or ''
        
        periods_remaining = load.periods_per_week
        periods_assigned = 0
        
        # Get working days and shuffle for distribution
        working_days = self.config.working_days.copy()
        random.shuffle(working_days)
        
        # Get class periods
        class_periods = self.config.get_class_periods()
        
        # Initialize daily count tracker for this subject-section
        if section_id not in self.subject_daily_count:
            self.subject_daily_count[section_id] = {}
        
        # Try to assign periods across days
        max_attempts = periods_remaining * len(working_days) * len(class_periods)
        attempts = 0
        
        while periods_remaining > 0 and attempts < max_attempts:
            attempts += 1
            assigned_this_round = False
            
            for day in working_days:
                if periods_remaining <= 0:
                    break
                
                # Initialize day tracking
                if day not in self.subject_daily_count[section_id]:
                    self.subject_daily_count[section_id][day] = {}
                
                # Check max periods per day constraint
                current_daily = self.subject_daily_count[section_id][day].get(subject_id, 0)
                if current_daily >= load.max_periods_per_day:
                    continue
                
                # Shuffle periods for variety
                shuffled_periods = class_periods.copy()
                random.shuffle(shuffled_periods)
                
                for period_config in shuffled_periods:
                    period_num = period_config['period']
                    
                    # Check if this slot is available
                    if self._is_slot_available(day, period_num, teacher_id, room, section_id):
                        # Create the slot
                        slot_data = self._create_slot(
                            load, day, period_config, preview_only
                        )
                        
                        if slot_data:
                            result.slots_created.append(slot_data)
                            result.generated_count += 1
                            periods_remaining -= 1
                            periods_assigned += 1
                            assigned_this_round = True
                            
                            # Update tracking
                            self._mark_slot_used(day, period_num, teacher_id, room, section_id, subject_id)
                            
                            break  # Move to next day
                
                if not assigned_this_round:
                    # No slot found for this day, continue to next
                    pass
            
            if not assigned_this_round:
                # Couldn't assign any slots this round, break to avoid infinite loop
                break
        
        # Track unscheduled if any periods remain
        if periods_remaining > 0:
            result.unscheduled.append({
                'section': str(load.section),
                'section_id': section_id,
                'subject': load.subject.name,
                'subject_id': subject_id,
                'periods_needed': load.periods_per_week,
                'periods_assigned': periods_assigned,
                'periods_remaining': periods_remaining,
                'teacher': load.preferred_teacher.get_full_name() if load.preferred_teacher else None
            })
    
    def _is_slot_available(
        self,
        day: str,
        period_num: int,
        teacher_id: Optional[str],
        room: str,
        section_id: str
    ) -> bool:
        """Check if a specific time slot is available."""
        
        # Check teacher availability
        if teacher_id:
            if teacher_id in self.teacher_schedule:
                if day in self.teacher_schedule[teacher_id]:
                    if period_num in self.teacher_schedule[teacher_id][day]:
                        return False
        
        # Check room availability (only if room is specified)
        if room:
            if room in self.room_schedule:
                if day in self.room_schedule[room]:
                    if period_num in self.room_schedule[room][day]:
                        return False
        
        # Check section availability
        if section_id in self.section_schedule:
            if day in self.section_schedule[section_id]:
                if period_num in self.section_schedule[section_id][day]:
                    return False
        
        return True
    
    def _mark_slot_used(
        self,
        day: str,
        period_num: int,
        teacher_id: Optional[str],
        room: str,
        section_id: str,
        subject_id: str
    ) -> None:
        """Mark a slot as used in tracking dictionaries."""
        
        # Teacher schedule
        if teacher_id:
            if teacher_id not in self.teacher_schedule:
                self.teacher_schedule[teacher_id] = {}
            if day not in self.teacher_schedule[teacher_id]:
                self.teacher_schedule[teacher_id][day] = []
            self.teacher_schedule[teacher_id][day].append(period_num)
        
        # Room schedule
        if room:
            if room not in self.room_schedule:
                self.room_schedule[room] = {}
            if day not in self.room_schedule[room]:
                self.room_schedule[room][day] = []
            self.room_schedule[room][day].append(period_num)
        
        # Section schedule
        if section_id not in self.section_schedule:
            self.section_schedule[section_id] = {}
        if day not in self.section_schedule[section_id]:
            self.section_schedule[section_id][day] = []
        self.section_schedule[section_id][day].append(period_num)
        
        # Subject daily count
        if section_id not in self.subject_daily_count:
            self.subject_daily_count[section_id] = {}
        if day not in self.subject_daily_count[section_id]:
            self.subject_daily_count[section_id][day] = {}
        if subject_id not in self.subject_daily_count[section_id][day]:
            self.subject_daily_count[section_id][day][subject_id] = 0
        self.subject_daily_count[section_id][day][subject_id] += 1
    
    def _create_slot(
        self,
        load: SubjectSectionLoad,
        day: str,
        period_config: Dict[str, Any],
        preview_only: bool
    ) -> Optional[Dict]:
        """
        Create a timetable slot.
        
        Args:
            load: SubjectSectionLoad being scheduled
            day: Day of week
            period_config: Period configuration dict with start/end times
            preview_only: If True, don't save to database
            
        Returns:
            Dict representation of created slot, or None if failed
        """
        try:
            slot_data = {
                'tenant_id': str(self.tenant.id),
                'academic_year_id': str(self.academic_year.id),
                'section_id': str(load.section_id),
                'section_name': str(load.section),
                'subject_id': str(load.subject_id),
                'subject_name': load.subject.name,
                'teacher_id': str(load.preferred_teacher_id) if load.preferred_teacher_id else None,
                'teacher_name': load.preferred_teacher.get_full_name() if load.preferred_teacher else None,
                'day_of_week': day,
                'start_time': period_config['start'],
                'end_time': period_config['end'],
                'period_number': period_config['period'],
                'room': load.room_preference or '',
                'is_active': True
            }
            
            if not preview_only:
                slot = TimetableSlot.objects.create(
                    tenant=self.tenant,
                    academic_year=self.academic_year,
                    section_id=load.section_id,
                    subject_id=load.subject_id,
                    teacher_id=load.preferred_teacher_id,
                    day_of_week=day,
                    start_time=period_config['start'],
                    end_time=period_config['end'],
                    period_number=period_config['period'],
                    room=load.room_preference or '',
                    is_active=True
                )
                slot_data['id'] = str(slot.id)
            
            return slot_data
            
        except Exception as e:
            logger.exception(f"Error creating slot: {e}")
            return None


class TimetableSwapService:
    """
    Service for swapping timetable slots.
    """
    
    @staticmethod
    def swap_slots(slot1_id: str, slot2_id: str, tenant) -> Dict[str, Any]:
        """
        Swap the positions of two timetable slots.
        
        Args:
            slot1_id: ID of first slot
            slot2_id: ID of second slot
            tenant: Tenant instance
            
        Returns:
            Dict with success status and updated slots
        """
        try:
            slot1 = TimetableSlot.objects.get(id=slot1_id, tenant=tenant)
            slot2 = TimetableSlot.objects.get(id=slot2_id, tenant=tenant)
            
            # Store original values
            slot1_day = slot1.day_of_week
            slot1_start = slot1.start_time
            slot1_end = slot1.end_time
            slot1_period = slot1.period_number
            
            slot2_day = slot2.day_of_week
            slot2_start = slot2.start_time
            slot2_end = slot2.end_time
            slot2_period = slot2.period_number
            
            # Validate the swap won't create conflicts
            # Check if slot1's subject-teacher can go to slot2's position
            conflicts1 = TimetableValidator.check_availability(
                tenant=tenant,
                academic_year=slot1.academic_year,
                day_of_week=slot2_day,
                start_time=slot2_start,
                end_time=slot2_end,
                teacher_id=str(slot1.teacher_id) if slot1.teacher_id else None,
                room=slot1.room,
                section_id=str(slot1.section_id),
                exclude_slot_id=str(slot1.id)
            )
            
            # Check if slot2's subject-teacher can go to slot1's position
            conflicts2 = TimetableValidator.check_availability(
                tenant=tenant,
                academic_year=slot2.academic_year,
                day_of_week=slot1_day,
                start_time=slot1_start,
                end_time=slot1_end,
                teacher_id=str(slot2.teacher_id) if slot2.teacher_id else None,
                room=slot2.room,
                section_id=str(slot2.section_id),
                exclude_slot_id=str(slot2.id)
            )
            
            if not conflicts1['is_available'] or not conflicts2['is_available']:
                return {
                    'success': False,
                    'error': 'Swap would create conflicts',
                    'conflicts': {
                        'slot1_to_slot2': conflicts1,
                        'slot2_to_slot1': conflicts2
                    }
                }
            
            # Perform the swap
            with transaction.atomic():
                slot1.day_of_week = slot2_day
                slot1.start_time = slot2_start
                slot1.end_time = slot2_end
                slot1.period_number = slot2_period
                slot1.save()
                
                slot2.day_of_week = slot1_day
                slot2.start_time = slot1_start
                slot2.end_time = slot1_end
                slot2.period_number = slot1_period
                slot2.save()
            
            return {
                'success': True,
                'slot1': {
                    'id': str(slot1.id),
                    'day_of_week': slot1.day_of_week,
                    'start_time': str(slot1.start_time),
                    'end_time': str(slot1.end_time),
                    'period_number': slot1.period_number
                },
                'slot2': {
                    'id': str(slot2.id),
                    'day_of_week': slot2.day_of_week,
                    'start_time': str(slot2.start_time),
                    'end_time': str(slot2.end_time),
                    'period_number': slot2.period_number
                }
            }
            
        except TimetableSlot.DoesNotExist:
            return {
                'success': False,
                'error': 'One or both slots not found'
            }
        except Exception as e:
            logger.exception(f"Error swapping slots: {e}")
            return {
                'success': False,
                'error': str(e)
            }


class TimetableCopyService:
    """
    Service for copying timetable slots.
    """
    
    @staticmethod
    def copy_day(
        source_section_id: str,
        source_day: str,
        target_section_id: str,
        target_day: str,
        academic_year,
        tenant,
        overwrite: bool = False
    ) -> Dict[str, Any]:
        """
        Copy a day's timetable from one section/day to another.
        
        Args:
            source_section_id: Section to copy from
            source_day: Day to copy from
            target_section_id: Section to copy to
            target_day: Day to copy to
            academic_year: AcademicYear instance
            tenant: Tenant instance
            overwrite: If True, delete existing slots at target
            
        Returns:
            Dict with success status and copied slots count
        """
        try:
            # Get source slots
            source_slots = TimetableSlot.objects.filter(
                tenant=tenant,
                academic_year=academic_year,
                section_id=source_section_id,
                day_of_week=source_day,
                is_active=True,
                is_deleted=False
            )
            
            if not source_slots.exists():
                return {
                    'success': False,
                    'error': 'No slots found for source day'
                }
            
            with transaction.atomic():
                # Clear target if overwrite
                if overwrite:
                    TimetableSlot.objects.filter(
                        tenant=tenant,
                        academic_year=academic_year,
                        section_id=target_section_id,
                        day_of_week=target_day
                    ).delete()
                
                # Copy each slot
                copied_count = 0
                conflicts = []
                
                for source_slot in source_slots:
                    # Check availability at target
                    avail = TimetableValidator.check_availability(
                        tenant=tenant,
                        academic_year=academic_year,
                        day_of_week=target_day,
                        start_time=source_slot.start_time,
                        end_time=source_slot.end_time,
                        teacher_id=str(source_slot.teacher_id) if source_slot.teacher_id else None,
                        room=source_slot.room,
                        section_id=target_section_id
                    )
                    
                    if not avail['is_available']:
                        conflicts.append({
                            'subject': source_slot.subject.name,
                            'time': f"{source_slot.start_time}-{source_slot.end_time}",
                            'conflicts': avail
                        })
                        continue
                    
                    # Create new slot
                    TimetableSlot.objects.create(
                        tenant=tenant,
                        academic_year=academic_year,
                        section_id=target_section_id,
                        subject=source_slot.subject,
                        teacher=source_slot.teacher,
                        day_of_week=target_day,
                        start_time=source_slot.start_time,
                        end_time=source_slot.end_time,
                        period_number=source_slot.period_number,
                        room=source_slot.room,
                        is_active=True
                    )
                    copied_count += 1
                
                return {
                    'success': True,
                    'copied_count': copied_count,
                    'skipped_count': len(conflicts),
                    'conflicts': conflicts
                }
                
        except Exception as e:
            logger.exception(f"Error copying day: {e}")
            return {
                'success': False,
                'error': str(e)
            }
