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
