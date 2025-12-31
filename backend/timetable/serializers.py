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
        
        # Check availability
        conflicts = TimetableValidator.check_availability(
            tenant=tenant,
            academic_year=data.get('academic_year'),
            day_of_week=data.get('day_of_week'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            teacher_id=data.get('teacher').id if data.get('teacher') else None,
            room=data.get('room'),
            section_id=data.get('section').id if data.get('section') else None,
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
