"""
Audit Log System
Provides comprehensive audit logging for all modules with filtering and export.
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantAdmin
from core.models import TenantAwareModel
from django.http import HttpResponse
import csv


class AuditLog(TenantAwareModel):
    """
    Unified audit log for tracking all CRUD operations across modules.
    """
    
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Export'),
        ('IMPORT', 'Import'),
        ('RESTORE', 'Restore'),
        ('BULK_UPDATE', 'Bulk Update'),
        ('BULK_DELETE', 'Bulk Delete'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    timestamp = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="When the action occurred"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        db_index=True,
        help_text="Type of action performed"
    )
    
    module = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Module/app where action occurred (e.g., students, fees)"
    )
    
    resource = models.CharField(
        max_length=100,
        help_text="Type of resource affected (e.g., Student, FeeStructure)"
    )
    
    resource_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID of the affected resource"
    )
    
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address"
    )
    
    user_agent = models.TextField(
        blank=True,
        help_text="Client user agent string"
    )
    
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Details of changes made (old/new values)"
    )
    
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='success',
        help_text="Outcome of the action"
    )
    
    error_message = models.TextField(
        blank=True,
        help_text="Error message if action failed"
    )
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tenant', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['module', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.resource} - {self.timestamp}"


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'user', 'action', 'module', 
            'resource', 'resource_id', 'ip_address', 'changes', 'status'
        ]
    
    def get_user(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return 'System'


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs.
    Only accessible by tenant admins.
    
    Filters:
        - user: Filter by user ID
        - module: Filter by module name (students, staff, fees, etc.)
        - action: Filter by action type (create, update, delete, etc.)
        - start_date: Filter by timestamp >= start_date (YYYY-MM-DD)
        - end_date: Filter by timestamp <= end_date (YYYY-MM-DD)
    """
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    serializer_class = AuditLogSerializer
    
    def get_queryset(self):
        queryset = AuditLog.objects.filter(tenant=self.request.user.tenant)
        
        # Filter by user
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(user__email__icontains=user_filter)
        
        # Filter by module
        module = self.request.query_params.get('module')
        if module and module != 'all':
            queryset = queryset.filter(module=module)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action and action != 'all':
            queryset = queryset.filter(action=action.upper())
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
        
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export audit logs to CSV file.
        """
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="audit-logs-{timezone.now().isoformat()}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Timestamp', 'User', 'Action', 'Module', 
            'Resource', 'Resource ID', 'IP Address', 'Status', 'Changes'
        ])
        
        for log in queryset[:5000]:  # Limit export to 5000 records
            writer.writerow([
                log.timestamp.isoformat(),
                log.user.get_full_name() if log.user else 'System',
                log.action,
                log.module,
                log.resource,
                log.resource_id,
                log.ip_address or '',
                log.status,
                str(log.changes) if log.changes else ''
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def modules(self, request):
        """
        Get list of all available modules for filtering.
        """
        modules = AuditLog.objects.filter(
            tenant=request.user.tenant
        ).values_list('module', flat=True).distinct()
        
        return Response(list(modules))


def log_action(
    tenant,
    user,
    action,
    module,
    resource,
    resource_id='',
    changes=None,
    status='success',
    error_message='',
    request=None
):
    """
    Helper function to create audit log entries.
    
    Args:
        tenant: Tenant instance
        user: User who performed the action
        action: Action type (CREATE, UPDATE, DELETE, etc.)
        module: Module name (students, staff, fees, etc.)
        resource: Resource type (Student, Staff, etc.)
        resource_id: ID of the affected resource
        changes: Dict with change details
        status: 'success' or 'failed'
        error_message: Error message if failed
        request: HTTP request object (for IP and user agent)
    """
    ip_address = None
    user_agent = ''
    
    if request:
        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    try:
        AuditLog.objects.create(
            tenant=tenant,
            user=user,
            action=action,
            module=module,
            resource=resource,
            resource_id=str(resource_id) if resource_id else '',
            ip_address=ip_address,
            user_agent=user_agent,
            changes=changes or {},
            status=status,
            error_message=error_message
        )
    except Exception as e:
        # Don't let audit logging failures break the application
        print(f"Failed to create audit log: {e}")
