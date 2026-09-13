"""Staffwork admin configuration."""

from django.contrib import admin

from .models import (
    LessonPlan, LessonPlanAttachment, AdminTaskTemplate, AdminTaskInstance,
    DailyStatusUpdate, StudentDailyRemark, Report,
)


class _TenantScopedAdmin(admin.ModelAdmin):
    """Scope the changelist to the current user's tenant (superusers see all)."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'is_platform_admin', False):
            return qs
        tenant_id = getattr(request.user, 'tenant_id', None)
        return qs.filter(tenant_id=tenant_id) if tenant_id else qs.none()


class LessonPlanAttachmentInline(admin.TabularInline):
    model = LessonPlanAttachment
    extra = 0
    raw_id_fields = ['tenant', 'uploaded_by']


@admin.register(LessonPlan)
class LessonPlanAdmin(_TenantScopedAdmin):
    list_display = ['topic', 'teacher', 'section', 'subject', 'date', 'status', 'created_at']
    list_filter = ['status', 'date', 'created_at']
    search_fields = ['topic', 'objectives', 'teacher__email']
    raw_id_fields = ['tenant', 'teacher', 'section', 'subject']
    filter_horizontal = ['shared_with']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [LessonPlanAttachmentInline]
    ordering = ['-date']


@admin.register(AdminTaskTemplate)
class AdminTaskTemplateAdmin(_TenantScopedAdmin):
    list_display = ['title', 'role_scope', 'frequency', 'day_of_week', 'is_active']
    list_filter = ['frequency', 'is_active']
    search_fields = ['title', 'description']
    raw_id_fields = ['tenant', 'role_scope']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AdminTaskInstance)
class AdminTaskInstanceAdmin(_TenantScopedAdmin):
    list_display = ['title', 'assigned_to', 'date', 'status', 'due_time', 'completed_at']
    list_filter = ['status', 'date']
    search_fields = ['title', 'assigned_to__email']
    raw_id_fields = ['tenant', 'template', 'assigned_to']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    ordering = ['-date']


class StudentDailyRemarkInline(admin.TabularInline):
    model = StudentDailyRemark
    extra = 0
    raw_id_fields = ['tenant', 'student']
    fields = [
        'student', 'did_not_do_homework', 'did_not_complete_classwork',
        'was_disruptive', 'was_absent', 'participated_well', 'severity', 'remark',
    ]


@admin.register(DailyStatusUpdate)
class DailyStatusUpdateAdmin(_TenantScopedAdmin):
    list_display = ['user', 'role', 'date', 'status', 'reviewed_by', 'created_at']
    list_filter = ['role', 'status', 'date']
    search_fields = ['summary', 'details', 'user__email']
    raw_id_fields = ['tenant', 'user', 'reviewed_by', 'related_class']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    inlines = [StudentDailyRemarkInline]
    ordering = ['-date']


@admin.register(Report)
class ReportAdmin(_TenantScopedAdmin):
    list_display = ['title', 'generated_by', 'created_at']
    search_fields = ['title', 'description']
    raw_id_fields = ['tenant', 'generated_by']
    filter_horizontal = ['shared_with']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
