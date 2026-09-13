"""
Serializers for the staffwork module.

Highlights:
- DailyStatusUpdateWriteSerializer supports a WRITABLE NESTED list of
  per-student remarks, so a teacher submits their update and every per-student
  flag in a single POST/PATCH.
- List serializers stay lightweight; detail serializers embed nested reps of
  the related user/teacher/section/subject/student for read convenience.
- Tenant validation on FK fields mirrors the complaints app.
"""

from django.db import transaction
from rest_framework import serializers

from .models import (
    LessonPlan, LessonPlanAttachment, AdminTaskTemplate, AdminTaskInstance,
    DailyStatusUpdate, StudentDailyRemark, Report,
)
from .permissions import can_remark_on_student


def _tenant_of(request):
    return getattr(getattr(request, 'user', None), 'tenant', None)


# ---------------------------------------------------------------------------
# Lightweight nested reps
# ---------------------------------------------------------------------------
class UserBriefSerializer(serializers.Serializer):
    """Minimal user representation for embedding."""

    id = serializers.UUIDField(read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else None


class StudentBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.SerializerMethodField()
    admission_number = serializers.CharField(read_only=True)

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else None


# ---------------------------------------------------------------------------
# Lesson plans
# ---------------------------------------------------------------------------
class LessonPlanAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonPlanAttachment
        fields = ['id', 'file', 'caption', 'uploaded_by', 'created_at']
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class LessonPlanListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default=None)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'topic', 'date', 'status', 'status_display',
            'teacher', 'teacher_name', 'section', 'section_name',
            'subject', 'subject_name', 'created_at',
        ]


class LessonPlanSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default=None)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    attachments = LessonPlanAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'topic', 'objectives', 'activities', 'resources', 'homework',
            'date', 'status', 'status_display',
            'teacher', 'teacher_name', 'section', 'section_name',
            'subject', 'subject_name', 'shared_with', 'attachments',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonPlanWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonPlan
        fields = [
            'id', 'topic', 'objectives', 'activities', 'resources', 'homework',
            'date', 'status', 'section', 'subject', 'shared_with',
        ]
        read_only_fields = ['id']

    def validate_section(self, value):
        tenant = _tenant_of(self.context.get('request'))
        if value and tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Section does not belong to your school.')
        return value

    def validate_subject(self, value):
        tenant = _tenant_of(self.context.get('request'))
        if value and tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Subject does not belong to your school.')
        return value


# ---------------------------------------------------------------------------
# Admin task templates + instances
# ---------------------------------------------------------------------------
class AdminTaskTemplateSerializer(serializers.ModelSerializer):
    role_scope_name = serializers.CharField(source='role_scope.name', read_only=True, default=None)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)

    class Meta:
        model = AdminTaskTemplate
        fields = [
            'id', 'title', 'description', 'role_scope', 'role_scope_name',
            'frequency', 'frequency_display', 'day_of_week', 'due_time',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_role_scope(self, value):
        tenant = _tenant_of(self.context.get('request'))
        if value and tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Role does not belong to your school.')
        return value


class AdminTaskInstanceSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_title = serializers.CharField(source='template.title', read_only=True, default=None)

    class Meta:
        model = AdminTaskInstance
        fields = [
            'id', 'template', 'template_title', 'assigned_to', 'assigned_to_name',
            'date', 'title', 'description', 'due_time', 'status', 'status_display',
            'update_notes', 'attachment', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'template', 'assigned_to', 'title', 'description', 'due_time',
            'completed_at', 'created_at', 'updated_at',
        ]


class AdminTaskCreateSerializer(serializers.ModelSerializer):
    """Ad-hoc task creation by a full-access user."""

    class Meta:
        model = AdminTaskInstance
        fields = [
            'id', 'assigned_to', 'date', 'title', 'description', 'due_time',
        ]
        read_only_fields = ['id']

    def validate_assigned_to(self, value):
        tenant = _tenant_of(self.context.get('request'))
        if value and tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('User does not belong to your school.')
        return value


class CompleteAdminTaskSerializer(serializers.Serializer):
    """Mark an admin task complete (or another terminal status)."""

    update_notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=[('COMPLETED', 'Completed'), ('IN_PROGRESS', 'In Progress'),
                 ('SKIPPED', 'Skipped')],
        default='COMPLETED',
    )


# ---------------------------------------------------------------------------
# Daily status updates (+ writable nested student remarks)
# ---------------------------------------------------------------------------
class StudentDailyRemarkSerializer(serializers.ModelSerializer):
    student_detail = StudentBriefSerializer(source='student', read_only=True)
    has_negative_flag = serializers.BooleanField(read_only=True)

    class Meta:
        model = StudentDailyRemark
        fields = [
            'id', 'student', 'student_detail',
            'did_not_do_homework', 'did_not_complete_classwork', 'was_disruptive',
            'was_absent', 'participated_well', 'remark', 'severity',
            'has_negative_flag', 'created_at',
        ]
        read_only_fields = ['id', 'has_negative_flag', 'created_at']


class DailyStatusUpdateListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remark_count = serializers.IntegerField(source='student_remarks.count', read_only=True)

    class Meta:
        model = DailyStatusUpdate
        fields = [
            'id', 'user', 'user_name', 'role', 'date', 'summary',
            'status', 'status_display', 'remark_count', 'created_at',
        ]


class DailyStatusUpdateSerializer(serializers.ModelSerializer):
    """Read/detail representation with embedded student remarks."""

    user_detail = UserBriefSerializer(source='user', read_only=True)
    reviewed_by_detail = UserBriefSerializer(source='reviewed_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    related_class_name = serializers.CharField(source='related_class.name', read_only=True, default=None)
    student_remarks = StudentDailyRemarkSerializer(many=True, read_only=True)

    class Meta:
        model = DailyStatusUpdate
        fields = [
            'id', 'user', 'user_detail', 'role', 'date', 'summary', 'details',
            'attachment', 'related_class', 'related_class_name',
            'status', 'status_display', 'reviewed_by', 'reviewed_by_detail',
            'review_notes', 'reviewed_at', 'student_remarks',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'reviewed_by', 'reviewed_at', 'review_notes',
            'created_at', 'updated_at',
        ]


class DailyStatusUpdateWriteSerializer(serializers.ModelSerializer):
    """
    Create/update a daily update together with its per-student remarks in one
    call. `student_remarks` is a writable nested list; on update the incoming
    list fully replaces the existing remarks for the update.
    """

    student_remarks = StudentDailyRemarkSerializer(many=True, required=False)

    class Meta:
        model = DailyStatusUpdate
        fields = [
            'id', 'role', 'date', 'summary', 'details', 'attachment',
            'related_class', 'status', 'student_remarks',
        ]
        read_only_fields = ['id']

    def validate_related_class(self, value):
        tenant = _tenant_of(self.context.get('request'))
        if value and tenant and value.tenant_id != tenant.id:
            raise serializers.ValidationError('Class does not belong to your school.')
        return value

    def validate_student_remarks(self, remarks):
        """Enforce tenant + teacher-scoped remark authorization."""
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        tenant = _tenant_of(request)
        seen = set()
        for item in remarks:
            student = item['student']
            if tenant and student.tenant_id != tenant.id:
                raise serializers.ValidationError('Student does not belong to your school.')
            if student.id in seen:
                raise serializers.ValidationError('Duplicate remark for a student.')
            seen.add(student.id)
            if not can_remark_on_student(user, student.id):
                raise serializers.ValidationError(
                    f'You may not add a remark for student {student.id}.'
                )
        return remarks

    def _write_remarks(self, update, remarks_data):
        tenant = update.tenant
        StudentDailyRemark.objects.bulk_create([
            StudentDailyRemark(
                tenant=tenant, daily_update=update, student=item['student'],
                did_not_do_homework=item.get('did_not_do_homework', False),
                did_not_complete_classwork=item.get('did_not_complete_classwork', False),
                was_disruptive=item.get('was_disruptive', False),
                was_absent=item.get('was_absent', False),
                participated_well=item.get('participated_well', False),
                remark=item.get('remark', ''),
                severity=item.get('severity', ''),
            )
            for item in remarks_data
        ])

    @transaction.atomic
    def create(self, validated_data):
        remarks_data = validated_data.pop('student_remarks', [])
        request = self.context.get('request')
        validated_data['user'] = request.user
        validated_data['tenant'] = _tenant_of(request)
        update = super().create(validated_data)
        self._write_remarks(update, remarks_data)
        return update

    @transaction.atomic
    def update(self, instance, validated_data):
        remarks_data = validated_data.pop('student_remarks', None)
        update = super().update(instance, validated_data)
        if remarks_data is not None:
            # Full replace: drop existing remarks, recreate from payload.
            instance.student_remarks.all().delete()
            self._write_remarks(update, remarks_data)
        return update


class ReviewDailyUpdateSerializer(serializers.Serializer):
    """Supervisor/principal review of a submitted daily update."""

    review_notes = serializers.CharField(required=False, allow_blank=True)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'description', 'file', 'generated_by',
            'generated_by_name', 'shared_with', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'generated_by', 'created_at', 'updated_at']
