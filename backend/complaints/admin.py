"""Complaints admin configuration."""

from django.contrib import admin

from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'type', 'category', 'student', 'created_by', 'assigned_to',
        'status', 'priority', 'created_at',
    ]
    list_filter = ['type', 'category', 'status', 'priority', 'created_at']
    search_fields = [
        'title', 'description', 'student__first_name', 'student__last_name',
        'student__admission_number', 'created_by__email',
    ]
    raw_id_fields = ['tenant', 'student', 'teacher', 'created_by', 'assigned_to']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Entry', {
            'fields': ('type', 'category', 'title', 'description', 'priority')
        }),
        ('Links', {
            'fields': ('tenant', 'student', 'teacher', 'created_by', 'assigned_to')
        }),
        ('Resolution', {
            'fields': ('status', 'resolution_notes', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        """Scope the admin list to the user's tenant (superusers see all)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser or getattr(request.user, 'is_platform_admin', False):
            return qs
        tenant_id = getattr(request.user, 'tenant_id', None)
        return qs.filter(tenant_id=tenant_id) if tenant_id else qs.none()
