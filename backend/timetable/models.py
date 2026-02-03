"""
Timetable Models for Conflict-Free Scheduling
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from core.models import TenantAwareModel


class TimetableSlot(TenantAwareModel):
    """
    Timetable Slot model representing a scheduled class period.
    Includes conflict detection for teachers and rooms.
    """
    
    DAY_OF_WEEK_CHOICES = [
        ('MONDAY', 'Monday'),
        ('TUESDAY', 'Tuesday'),
        ('WEDNESDAY', 'Wednesday'),
        ('THURSDAY', 'Thursday'),
        ('FRIDAY', 'Friday'),
        ('SATURDAY', 'Saturday'),
        ('SUNDAY', 'Sunday'),
    ]
    
    # Core relationships
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='timetable_slots',
        help_text=_('Academic year for this timetable slot')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='timetable_slots',
        help_text=_('Section/Class for this slot')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='timetable_slots',
        help_text=_('Subject being taught')
    )
    
    teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='timetable_slots',
        help_text=_('Teacher assigned to this slot')
    )
    
    # Timing
    day_of_week = models.CharField(
        max_length=10,
        choices=DAY_OF_WEEK_CHOICES,
        help_text=_('Day of the week')
    )
    
    start_time = models.TimeField(
        help_text=_('Start time of the class')
    )
    
    end_time = models.TimeField(
        help_text=_('End time of the class')
    )
    
    # Room/Location
    room = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Room number or location')
    )
    
    # Additional metadata
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this slot is currently active')
    )
    
    notes = models.TextField(
        blank=True,
        help_text=_('Additional notes or instructions')
    )
    
    # Period number (optional, for display ordering)
    period_number = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('Period number in the daily schedule')
    )
    
    class Meta:
        db_table = 'timetable_slots'
        verbose_name = _('Timetable Slot')
        verbose_name_plural = _('Timetable Slots')
        ordering = ['day_of_week', 'start_time', 'period_number']
        indexes = [
            models.Index(fields=['tenant', 'academic_year', 'section']),
            models.Index(fields=['tenant', 'teacher', 'day_of_week']),
            models.Index(fields=['tenant', 'day_of_week', 'start_time']),
            models.Index(fields=['room', 'day_of_week', 'start_time']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F('start_time')),
                name='end_time_after_start_time'
            )
        ]
    
    def __str__(self):
        return f"{self.section} - {self.subject.name} ({self.day_of_week} {self.start_time}-{self.end_time})"
    
    def clean(self):
        """
        Validate the timetable slot for conflicts.
        """
        super().clean()
        
        # Validate time range
        if self.end_time <= self.start_time:
            raise ValidationError({
                'end_time': _('End time must be after start time')
            })
        
        # Check for teacher conflicts
        if self.teacher:
            teacher_conflicts = self._check_teacher_conflicts()
            if teacher_conflicts:
                raise ValidationError({
                    'teacher': _(
                        f'Teacher {self.teacher.get_full_name()} is already scheduled '
                        f'during this time on {self.day_of_week}'
                    )
                })
        
        # Check for room conflicts
        if self.room:
            room_conflicts = self._check_room_conflicts()
            if room_conflicts:
                raise ValidationError({
                    'room': _(
                        f'Room {self.room} is already booked '
                        f'during this time on {self.day_of_week}'
                    )
                })
        
        # Check for section conflicts (students can't be in two places at once)
        section_conflicts = self._check_section_conflicts()
        if section_conflicts:
            raise ValidationError({
                'section': _(
                    f'Section {self.section} already has a class '
                    f'scheduled during this time on {self.day_of_week}'
                )
            })
    
    def _check_teacher_conflicts(self):
        """
        Check if the teacher is already assigned to another slot at the same time.
        """
        if not self.teacher:
            return None
        
        conflicts = TimetableSlot.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year,
            teacher=self.teacher,
            day_of_week=self.day_of_week,
            is_active=True,
            is_deleted=False
        ).exclude(id=self.id)
        
        # Check for time overlap
        conflicts = conflicts.filter(
            models.Q(start_time__lt=self.end_time) &
            models.Q(end_time__gt=self.start_time)
        )
        
        return conflicts.first()
    
    def _check_room_conflicts(self):
        """
        Check if the room is already booked at the same time.
        """
        if not self.room:
            return None
        
        conflicts = TimetableSlot.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year,
            room=self.room,
            day_of_week=self.day_of_week,
            is_active=True,
            is_deleted=False
        ).exclude(id=self.id)
        
        # Check for time overlap
        conflicts = conflicts.filter(
            models.Q(start_time__lt=self.end_time) &
            models.Q(end_time__gt=self.start_time)
        )
        
        return conflicts.first()
    
    def _check_section_conflicts(self):
        """
        Check if the section already has a class at the same time.
        """
        conflicts = TimetableSlot.objects.filter(
            tenant=self.tenant,
            academic_year=self.academic_year,
            section=self.section,
            day_of_week=self.day_of_week,
            is_active=True,
            is_deleted=False
        ).exclude(id=self.id)
        
        # Check for time overlap
        conflicts = conflicts.filter(
            models.Q(start_time__lt=self.end_time) &
            models.Q(end_time__gt=self.start_time)
        )
        
        return conflicts.first()
    
    def get_duration_minutes(self):
        """
        Calculate the duration of the slot in minutes.
        """
        from datetime import datetime, timedelta
        
        # Convert times to datetime for calculation
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        
        duration = end - start
        return int(duration.total_seconds() / 60)
    
    def save(self, *args, **kwargs):
        """
        Override save to run validation.
        """
        self.full_clean()
        super().save(*args, **kwargs)


class TimetableTemplate(TenantAwareModel):
    """
    Timetable Template for reusable timetable configurations.
    Allows schools to create and reuse timetable patterns.
    """
    
    name = models.CharField(
        max_length=200,
        help_text=_('Template name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Template description')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='timetable_templates',
        help_text=_('Academic year this template is for')
    )
    
    is_default = models.BooleanField(
        default=False,
        help_text=_('Whether this is the default template')
    )
    
    class Meta:
        db_table = 'timetable_templates'
        verbose_name = _('Timetable Template')
        verbose_name_plural = _('Timetable Templates')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name', 'academic_year'],
                name='unique_template_name_per_year'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"


class TimetablePeriodConfig(TenantAwareModel):
    """
    Configuration for timetable periods per tenant.
    Defines the daily schedule structure including period timings and breaks.
    """
    
    DEFAULT_WORKING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    
    DEFAULT_PERIODS = [
        {'period': 1, 'start': '08:00', 'end': '08:45', 'type': 'class'},
        {'period': 2, 'start': '08:45', 'end': '09:30', 'type': 'class'},
        {'period': 3, 'start': '09:30', 'end': '10:15', 'type': 'class'},
        {'period': 0, 'start': '10:15', 'end': '10:30', 'type': 'break', 'label': 'Short Break'},
        {'period': 4, 'start': '10:30', 'end': '11:15', 'type': 'class'},
        {'period': 5, 'start': '11:15', 'end': '12:00', 'type': 'class'},
        {'period': 6, 'start': '12:00', 'end': '12:45', 'type': 'class'},
        {'period': 0, 'start': '12:45', 'end': '13:30', 'type': 'break', 'label': 'Lunch Break'},
        {'period': 7, 'start': '13:30', 'end': '14:15', 'type': 'class'},
        {'period': 8, 'start': '14:15', 'end': '15:00', 'type': 'class'},
    ]
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='timetable_period_configs',
        help_text=_('Academic year this configuration is for')
    )
    
    name = models.CharField(
        max_length=100,
        default='Default Schedule',
        help_text=_('Configuration name (e.g., "Regular Schedule", "Exam Schedule")')
    )
    
    working_days = models.JSONField(
        default=list,
        help_text=_('Days when school operates as JSON array: ["MONDAY", "TUESDAY", ...]')
    )
    
    periods = models.JSONField(
        default=list,
        help_text=_(
            'Period timings as JSON array: '
            '[{"period": 1, "start": "08:00", "end": "08:45", "type": "class"}, ...]'
        )
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this configuration is currently active')
    )
    
    class Meta:
        db_table = 'timetable_period_configs'
        verbose_name = _('Period Configuration')
        verbose_name_plural = _('Period Configurations')
        ordering = ['-is_active', '-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'academic_year', 'name'],
                name='unique_period_config_name_per_year'
            )
        ]
    
    def __str__(self):
        status = '(Active)' if self.is_active else ''
        return f"{self.name} - {self.academic_year.name} {status}"
    
    def save(self, *args, **kwargs):
        # Set defaults if not provided
        if not self.working_days:
            self.working_days = self.DEFAULT_WORKING_DAYS.copy()
        if not self.periods:
            self.periods = self.DEFAULT_PERIODS.copy()
        super().save(*args, **kwargs)
    
    def get_class_periods(self):
        """Return only class periods (exclude breaks)."""
        return [p for p in self.periods if p.get('type') == 'class']
    
    def get_period_count(self):
        """Return the number of class periods per day."""
        return len(self.get_class_periods())


class SubjectSectionLoad(TenantAwareModel):
    """
    Defines how many periods per week a subject needs for a specific section.
    Used by the auto-generation algorithm to schedule classes.
    """
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='subject_section_loads',
        help_text=_('Academic year for this load configuration')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='subject_loads',
        help_text=_('Section/Class this load applies to')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='section_loads',
        help_text=_('Subject to be scheduled')
    )
    
    periods_per_week = models.PositiveIntegerField(
        default=1,
        help_text=_('Number of periods for this subject per week')
    )
    
    preferred_teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_subject_loads',
        help_text=_('Preferred teacher for this subject-section combination')
    )
    
    room_preference = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Preferred room or room type (e.g., "Lab", "Room 101")')
    )
    
    max_periods_per_day = models.PositiveIntegerField(
        default=2,
        help_text=_('Maximum periods of this subject allowed per day')
    )
    
    requires_lab = models.BooleanField(
        default=False,
        help_text=_('Whether this subject requires a lab/special room')
    )
    
    priority = models.PositiveIntegerField(
        default=5,
        help_text=_('Scheduling priority (1=highest, 10=lowest). Higher priority subjects are scheduled first.')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this load is active for scheduling')
    )
    
    class Meta:
        db_table = 'timetable_subject_section_loads'
        verbose_name = _('Subject Section Load')
        verbose_name_plural = _('Subject Section Loads')
        ordering = ['section', 'subject__name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'academic_year', 'section', 'subject'],
                name='unique_subject_section_load'
            )
        ]
    
    def __str__(self):
        return f"{self.section} - {self.subject.name}: {self.periods_per_week} periods/week"
    
    def clean(self):
        """Validate the subject section load."""
        super().clean()
        
        if self.periods_per_week < 1:
            raise ValidationError({
                'periods_per_week': _('Periods per week must be at least 1')
            })
        
        if self.max_periods_per_day < 1:
            raise ValidationError({
                'max_periods_per_day': _('Max periods per day must be at least 1')
            })
        
        if self.priority < 1 or self.priority > 10:
            raise ValidationError({
                'priority': _('Priority must be between 1 and 10')
            })
