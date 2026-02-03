"""
Timetable Serializers
"""

from rest_framework import serializers
from .models import TimetableSlot, TimetableTemplate
from tenants.models import AcademicYear, Section, Subject
from staff.models import Staff


class TimetableSlotSerializer(serializers.ModelSerializer):
    """
    Serializer for TimetableSlot with nested relationships.
    """
    
    # Read-only nested fields
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    grade_level = serializers.CharField(source='section.grade_level.name', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = TimetableSlot
        fields = [
            'id',
            'academic_year',
            'section',
            'section_name',
            'grade_level',
            'subject',
            'subject_name',
            'subject_code',
            'teacher',
            'teacher_name',
            'day_of_week',
            'start_time',
            'end_time',
            'duration_minutes',
            'room',
            'period_number',
            'is_active',
            'notes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.teacher:
            return obj.teacher.get_full_name()
        return None
    
    def get_duration_minutes(self, obj):
        """Get duration in minutes."""
        return obj.get_duration_minutes()
    
    def validate(self, data):
        """
        Validate the timetable slot for conflicts.
        """
        from .validators import TimetableValidator
        from core.middleware import get_current_tenant
        
        tenant = get_current_tenant()
        if not tenant:
            raise serializers.ValidationError("Tenant context is required")
        
        # Get the slot ID if updating
        slot_id = self.instance.id if self.instance else None

        # Resolve values for partial updates
        academic_year = data.get('academic_year') or getattr(self.instance, 'academic_year', None)
        section = data.get('section') or getattr(self.instance, 'section', None)
        subject = data.get('subject') or getattr(self.instance, 'subject', None)
        day_of_week = data.get('day_of_week') or getattr(self.instance, 'day_of_week', None)
        start_time = data.get('start_time') or getattr(self.instance, 'start_time', None)
        end_time = data.get('end_time') or getattr(self.instance, 'end_time', None)
        teacher = data.get('teacher') if 'teacher' in data else getattr(self.instance, 'teacher', None)
        room = data.get('room') if 'room' in data else getattr(self.instance, 'room', None)

        # Ensure tenant safety for related objects
        for related in [academic_year, section, subject, teacher]:
            if related is not None and hasattr(related, 'tenant_id') and related.tenant_id != tenant.id:
                raise serializers.ValidationError("Related object does not belong to current tenant")

        if not all([academic_year, section, day_of_week, start_time, end_time]):
            return data
        
        # Check availability
        conflicts = TimetableValidator.check_availability(
            tenant=tenant,
            academic_year=academic_year,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            teacher_id=teacher.id if teacher else None,
            room=room,
            section_id=section.id if section else None,
            exclude_slot_id=slot_id
        )
        
        if not conflicts['is_available']:
            error_messages = []
            
            if conflicts.get('teacher_conflicts'):
                error_messages.append(
                    f"Teacher conflict: Already scheduled at this time"
                )
            
            if conflicts.get('room_conflicts'):
                error_messages.append(
                    f"Room conflict: Room is already booked at this time"
                )
            
            if conflicts.get('section_conflicts'):
                error_messages.append(
                    f"Section conflict: Section already has a class at this time"
                )
            
            raise serializers.ValidationError({
                'non_field_errors': error_messages,
                'conflicts': conflicts
            })
        
        return data


class TimetableSlotCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating timetable slots.
    """
    
    class Meta:
        model = TimetableSlot
        fields = [
            'academic_year',
            'section',
            'subject',
            'teacher',
            'day_of_week',
            'start_time',
            'end_time',
            'room',
            'period_number',
            'notes'
        ]

    def validate(self, data):
        """
        Validate the timetable slot for conflicts.
        """
        from .validators import TimetableValidator
        from core.middleware import get_current_tenant

        tenant = get_current_tenant()
        if not tenant:
            raise serializers.ValidationError("Tenant context is required")

        for related in [data.get('academic_year'), data.get('section'), data.get('subject'), data.get('teacher')]:
            if related is not None and hasattr(related, 'tenant_id') and related.tenant_id != tenant.id:
                raise serializers.ValidationError("Related object does not belong to current tenant")

        conflicts = TimetableValidator.check_availability(
            tenant=tenant,
            academic_year=data.get('academic_year'),
            day_of_week=data.get('day_of_week'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            teacher_id=data.get('teacher').id if data.get('teacher') else None,
            room=data.get('room'),
            section_id=data.get('section').id if data.get('section') else None,
            exclude_slot_id=None
        )

        if not conflicts['is_available']:
            error_messages = []

            if conflicts.get('teacher_conflicts'):
                error_messages.append(
                    "Teacher conflict: Already scheduled at this time"
                )

            if conflicts.get('room_conflicts'):
                error_messages.append(
                    "Room conflict: Room is already booked at this time"
                )

            if conflicts.get('section_conflicts'):
                error_messages.append(
                    "Section conflict: Section already has a class at this time"
                )

            raise serializers.ValidationError({
                'non_field_errors': error_messages,
                'conflicts': conflicts
            })

        return data


class TimetableTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for TimetableTemplate.
    """
    
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = TimetableTemplate
        fields = [
            'id',
            'name',
            'description',
            'academic_year',
            'academic_year_name',
            'is_default',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeacherScheduleSerializer(serializers.Serializer):
    """
    Serializer for teacher schedule view.
    """
    teacher_id = serializers.UUIDField()
    day_of_week = serializers.ChoiceField(
        choices=TimetableSlot.DAY_OF_WEEK_CHOICES,
        required=False
    )


class SectionScheduleSerializer(serializers.Serializer):
    """
    Serializer for section schedule view.
    """
    section_id = serializers.UUIDField()
    day_of_week = serializers.ChoiceField(
        choices=TimetableSlot.DAY_OF_WEEK_CHOICES,
        required=False
    )


class AvailabilityCheckSerializer(serializers.Serializer):
    """
    Serializer for checking availability.
    """
    academic_year = serializers.UUIDField()
    day_of_week = serializers.ChoiceField(choices=TimetableSlot.DAY_OF_WEEK_CHOICES)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    teacher_id = serializers.UUIDField(required=False, allow_null=True)
    room = serializers.CharField(required=False, allow_blank=True)
    section_id = serializers.UUIDField(required=False, allow_null=True)
    exclude_slot_id = serializers.UUIDField(required=False, allow_null=True)


class BulkSlotCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk slot creation.
    """
    slots = serializers.ListField(
        child=TimetableSlotCreateSerializer()
    )


class TimetablePeriodConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for TimetablePeriodConfig.
    """
    
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    period_count = serializers.SerializerMethodField()
    
    class Meta:
        from .models import TimetablePeriodConfig
        model = TimetablePeriodConfig
        fields = [
            'id',
            'academic_year',
            'academic_year_name',
            'name',
            'working_days',
            'periods',
            'period_count',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_period_count(self, obj):
        """Get the number of class periods."""
        return obj.get_period_count()


class SubjectSectionLoadSerializer(serializers.ModelSerializer):
    """
    Serializer for SubjectSectionLoad.
    """
    
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    grade_level = serializers.CharField(source='section.grade_level.name', read_only=True)
    
    class Meta:
        from .models import SubjectSectionLoad
        model = SubjectSectionLoad
        fields = [
            'id',
            'academic_year',
            'section',
            'section_name',
            'grade_level',
            'subject',
            'subject_name',
            'subject_code',
            'periods_per_week',
            'preferred_teacher',
            'teacher_name',
            'room_preference',
            'max_periods_per_day',
            'requires_lab',
            'priority',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.preferred_teacher:
            return obj.preferred_teacher.get_full_name()
        return None


class SubjectSectionLoadCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating SubjectSectionLoad.
    """
    
    class Meta:
        from .models import SubjectSectionLoad
        model = SubjectSectionLoad
        fields = [
            'academic_year',
            'section',
            'subject',
            'periods_per_week',
            'preferred_teacher',
            'room_preference',
            'max_periods_per_day',
            'requires_lab',
            'priority',
            'is_active'
        ]


class BulkSubjectLoadCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk creating subject section loads.
    """
    loads = serializers.ListField(
        child=SubjectSectionLoadCreateSerializer()
    )


class TimetableGenerateSerializer(serializers.Serializer):
    """
    Serializer for timetable generation request.
    """
    section_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_null=True,
        help_text='List of section IDs to generate for. If not provided, generates for all sections with loads.'
    )
    clear_existing = serializers.BooleanField(
        default=False,
        help_text='If True, delete existing slots before generating.'
    )
    preview_only = serializers.BooleanField(
        default=False,
        help_text='If True, return proposed timetable without saving.'
    )


class SlotSwapSerializer(serializers.Serializer):
    """
    Serializer for swapping two timetable slots.
    """
    slot1_id = serializers.UUIDField(help_text='ID of the first slot')
    slot2_id = serializers.UUIDField(help_text='ID of the second slot')


class CopyDaySerializer(serializers.Serializer):
    """
    Serializer for copying a day's timetable.
    """
    source_section_id = serializers.UUIDField(help_text='Section to copy from')
    source_day = serializers.ChoiceField(
        choices=TimetableSlot.DAY_OF_WEEK_CHOICES,
        help_text='Day to copy from'
    )
    target_section_id = serializers.UUIDField(help_text='Section to copy to')
    target_day = serializers.ChoiceField(
        choices=TimetableSlot.DAY_OF_WEEK_CHOICES,
        help_text='Day to copy to'
    )
    overwrite = serializers.BooleanField(
        default=False,
        help_text='If True, delete existing slots at target before copying'
    )

