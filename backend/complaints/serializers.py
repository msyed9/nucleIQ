"""Complaints serializers."""

from rest_framework import serializers

from students.models import Student
from staff.models import Staff

from .models import Complaint

try:
    from users.models import User
except Exception:  # pragma: no cover - fallback if custom user path differs
    from django.contrib.auth import get_user_model
    User = get_user_model()


def _tenant_of(request):
    return getattr(getattr(request, 'user', None), 'tenant', None)


class ComplaintSerializer(serializers.ModelSerializer):
    """Full detail representation (flat, read-oriented)."""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(
        source='student.admission_number', read_only=True
    )
    teacher_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'title', 'description', 'type', 'type_display',
            'category', 'priority', 'priority_display', 'status', 'status_display',
            'student', 'student_name', 'student_admission_number',
            'teacher', 'teacher_name',
            'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name',
            'resolution_notes', 'resolved_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_by', 'resolved_at', 'created_at', 'updated_at',
        ]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() if obj.teacher else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class ComplaintListSerializer(serializers.ModelSerializer):
    """Lightweight representation for list views."""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'title', 'type', 'category', 'priority', 'status',
            'student', 'student_name', 'created_by_name', 'assigned_to_name',
            'created_at',
        ]

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class ComplaintWriteSerializer(serializers.ModelSerializer):
    """Create/update serializer with tenant validation."""

    class Meta:
        model = Complaint
        fields = [
            'id', 'title', 'description', 'type', 'category', 'priority',
            'status', 'student', 'teacher', 'assigned_to',
        ]
        read_only_fields = ['id']

    def validate_student(self, value):
        tenant = _tenant_of(self.context.get('request'))
        if tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Student does not belong to your school.')
        return value

    def validate_teacher(self, value):
        if value is None:
            return value
        tenant = _tenant_of(self.context.get('request'))
        if tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Teacher does not belong to your school.')
        return value

    def validate_assigned_to(self, value):
        if value is None:
            return value
        tenant = _tenant_of(self.context.get('request'))
        if tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Assignee does not belong to your school.')
        return value


class AssignComplaintSerializer(serializers.Serializer):
    """Assign a complaint to a user."""

    assigned_to = serializers.UUIDField()

    def validate_assigned_to(self, value):
        tenant = _tenant_of(self.context.get('request'))
        qs = User.objects.filter(pk=value)
        if tenant:
            qs = qs.filter(tenant_id=tenant.id)
        if not qs.exists():
            raise serializers.ValidationError('User not found in your school.')
        return value


class ResolveComplaintSerializer(serializers.Serializer):
    """Mark a complaint resolved with notes."""

    resolution_notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=[('RESOLVED', 'Resolved'), ('CLOSED', 'Closed')],
        default='RESOLVED',
    )
