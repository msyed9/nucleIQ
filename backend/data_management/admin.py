"""
Data Management Admin Configuration
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from config.admin import admin_site
from .models import ImportJob, ImportFieldMapping
from .migration_models import (
    MigrationRun, MigrationPhaseLog, CrosswalkEntry, MigrationError,
    QuarantineRecord, ReconciliationReport, AcademicYearBatch, EntityScopeConfig
)


@admin.register(ImportJob, site=admin_site)
class ImportJobAdmin(admin.ModelAdmin):
    """Admin for ImportJob model"""
    
    list_display = [
        'id', 'module', 'status', 'original_filename',
        'total_rows', 'successful_rows', 'failed_rows',
        'created_by', 'created_at'
    ]
    
    list_filter = ['status', 'module', 'created_at', 'tenant']
    search_fields = ['original_filename', 'module']
    readonly_fields = [
        'id', 'tenant', 'module', 'status', 'original_filename', 'file_type',
        'total_rows', 'processed_rows', 'successful_rows', 'failed_rows',
        'duplicate_rows', 'created_record_ids', 'validation_errors',
        'preview_data', 'skip_duplicates', 'update_existing',
        'created_by', 'created_at', 'completed_at'
    ]
    
    ordering = ['-created_at']
    
    fieldsets = (
        ('Job Information', {
            'fields': ('id', 'tenant', 'module', 'status', 'original_filename', 'file_type')
        }),
        ('Progress', {
            'fields': ('total_rows', 'processed_rows', 'successful_rows', 'failed_rows', 'duplicate_rows')
        }),
        ('Options', {
            'fields': ('skip_duplicates', 'update_existing')
        }),
        ('Results', {
            'fields': ('validation_errors', 'created_record_ids'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'completed_at')
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ImportFieldMapping, site=admin_site)
class ImportFieldMappingAdmin(admin.ModelAdmin):
    """Admin for ImportFieldMapping model"""
    
    list_display = ['tenant', 'module', 'source_column', 'target_field', 'is_active']
    list_filter = ['tenant', 'module', 'is_active']
    search_fields = ['source_column', 'target_field']
    
    fieldsets = (
        (None, {
            'fields': ('tenant', 'module', 'source_column', 'target_field', 'is_active')
        }),
    )


# =============================================================================
# 10-YEAR MIGRATION ADMIN
# =============================================================================

class MigrationPhaseLogInline(admin.TabularInline):
    """Inline for phase logs within migration run."""
    model = MigrationPhaseLog
    extra = 0
    readonly_fields = ['phase', 'status', 'started_at', 'completed_at', 'total_entities', 'successful_entities', 'failed_entities']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


class AcademicYearBatchInline(admin.TabularInline):
    """Inline for year batches within migration run."""
    model = AcademicYearBatch
    extra = 0
    readonly_fields = ['academic_year_code', 'year_sequence', 'status', 'total_records', 'successful_records', 'failed_records']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(MigrationRun, site=admin_site)
class MigrationRunAdmin(admin.ModelAdmin):
    """Admin for 10-Year Migration Runs"""
    
    list_display = [
        'run_code', 'tenant', 'status', 'current_phase',
        'progress_display', 'source_system_name',
        'created_by', 'created_at'
    ]
    
    list_filter = ['status', 'current_phase', 'tenant', 'created_at']
    search_fields = ['run_code', 'description', 'source_system_name']
    readonly_fields = [
        'run_code', 'total_records', 'processed_records', 'successful_records',
        'failed_records', 'skipped_records', 'started_at', 'completed_at',
        'created_at', 'updated_at', 'phase_status'
    ]
    
    ordering = ['-created_at']
    inlines = [MigrationPhaseLogInline, AcademicYearBatchInline]
    
    fieldsets = (
        ('Migration Information', {
            'fields': ('run_code', 'tenant', 'description', 'status', 'current_phase')
        }),
        ('Source System', {
            'fields': ('source_system_name', 'start_academic_year', 'end_academic_year')
        }),
        ('Progress', {
            'fields': (
                ('total_records', 'processed_records'),
                ('successful_records', 'failed_records', 'skipped_records')
            )
        }),
        ('Phase Status', {
            'fields': ('phase_status',),
            'classes': ('collapse',)
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': (('started_at', 'completed_at'), 'created_by')
        }),
    )
    
    def progress_display(self, obj):
        """Display progress as percentage with color."""
        percentage = obj.get_progress_percentage()
        if percentage >= 100:
            color = 'green'
        elif percentage >= 50:
            color = 'orange'
        else:
            color = 'gray'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, percentage
        )
    progress_display.short_description = 'Progress'


@admin.register(MigrationPhaseLog, site=admin_site)
class MigrationPhaseLogAdmin(admin.ModelAdmin):
    """Admin for Migration Phase Logs"""
    
    list_display = ['migration_run', 'phase', 'status', 'total_entities', 'successful_entities', 'failed_entities', 'started_at']
    list_filter = ['phase', 'status', 'migration_run']
    search_fields = ['migration_run__run_code']
    readonly_fields = ['migration_run', 'phase', 'status', 'started_at', 'completed_at', 'total_entities', 'processed_entities', 'successful_entities', 'failed_entities']
    ordering = ['-started_at']


@admin.register(CrosswalkEntry, site=admin_site)
class CrosswalkEntryAdmin(admin.ModelAdmin):
    """Admin for Crosswalk Entries"""
    
    list_display = ['entity_type', 'source_id', 'target_id', 'status', 'academic_year_code', 'migration_run']
    list_filter = ['entity_type', 'status', 'academic_year_code', 'migration_run']
    search_fields = ['source_id', 'source_natural_key', 'target_id']
    readonly_fields = ['migration_run', 'entity_type', 'source_id', 'source_natural_key', 'source_data', 'target_id', 'target_natural_key', 'academic_year_code', 'status', 'processed_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Source', {
            'fields': ('migration_run', 'entity_type', 'source_id', 'source_natural_key', 'source_data')
        }),
        ('Target', {
            'fields': ('target_id', 'target_natural_key')
        }),
        ('Context', {
            'fields': ('academic_year_code', 'status', 'error_message', 'processed_at')
        }),
    )


@admin.register(MigrationError, site=admin_site)
class MigrationErrorAdmin(admin.ModelAdmin):
    """Admin for Migration Errors"""
    
    list_display = ['migration_run', 'phase', 'entity_type', 'error_type', 'severity', 'is_resolved', 'created_at']
    list_filter = ['severity', 'error_type', 'phase', 'entity_type', 'is_resolved', 'migration_run']
    search_fields = ['error_message', 'source_id', 'migration_run__run_code']
    readonly_fields = ['migration_run', 'phase', 'entity_type', 'source_id', 'source_row_number', 'source_file', 'source_data', 'academic_year_code', 'severity', 'error_type', 'error_code', 'error_message', 'error_details', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Error Source', {
            'fields': ('migration_run', 'phase', 'entity_type', 'source_id', 'source_file', 'source_row_number')
        }),
        ('Error Details', {
            'fields': ('severity', 'error_type', 'error_code', 'error_message', 'error_details')
        }),
        ('Context', {
            'fields': ('academic_year_code', 'source_data'),
            'classes': ('collapse',)
        }),
        ('Resolution', {
            'fields': ('is_resolved', 'resolution_notes', 'resolved_at', 'resolved_by')
        }),
    )
    
    actions = ['mark_resolved']
    
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_resolved=True, resolved_at=timezone.now(), resolved_by=request.user)
        self.message_user(request, f'{updated} errors marked as resolved.')
    mark_resolved.short_description = 'Mark selected errors as resolved'


@admin.register(QuarantineRecord, site=admin_site)
class QuarantineRecordAdmin(admin.ModelAdmin):
    """Admin for Quarantine Records"""
    
    list_display = ['migration_run', 'entity_type', 'source_id', 'status', 'academic_year_code', 'created_at']
    list_filter = ['status', 'entity_type', 'migration_run']
    search_fields = ['source_id', 'reason']
    readonly_fields = ['migration_run', 'entity_type', 'source_id', 'source_file', 'source_row_number', 'original_data', 'academic_year_code', 'reason', 'validation_errors']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Record Info', {
            'fields': ('migration_run', 'entity_type', 'source_id', 'source_file', 'source_row_number', 'academic_year_code')
        }),
        ('Quarantine Details', {
            'fields': ('status', 'reason', 'validation_errors')
        }),
        ('Data', {
            'fields': ('original_data', 'corrected_data'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReconciliationReport, site=admin_site)
class ReconciliationReportAdmin(admin.ModelAdmin):
    """Admin for Reconciliation Reports"""
    
    list_display = ['migration_run', 'report_type', 'academic_year_code', 'source_total', 'target_total', 'variance', 'is_valid', 'created_at']
    list_filter = ['report_type', 'is_valid', 'migration_run']
    search_fields = ['migration_run__run_code']
    readonly_fields = ['migration_run', 'report_type', 'academic_year_code', 'source_total', 'target_total', 'variance', 'variance_percentage', 'breakdown', 'spot_check_samples', 'created_at']
    ordering = ['-created_at']


@admin.register(AcademicYearBatch, site=admin_site)
class AcademicYearBatchAdmin(admin.ModelAdmin):
    """Admin for Academic Year Batches"""
    
    list_display = ['migration_run', 'academic_year_code', 'year_sequence', 'status', 'total_records', 'successful_records', 'failed_records']
    list_filter = ['status', 'migration_run']
    search_fields = ['academic_year_code', 'migration_run__run_code']
    readonly_fields = ['migration_run', 'academic_year_code', 'academic_year', 'year_sequence', 'start_date', 'end_date', 'status', 'total_records', 'processed_records', 'successful_records', 'failed_records', 'entity_progress', 'created_records', 'started_at', 'completed_at']
    ordering = ['migration_run', 'year_sequence']


@admin.register(EntityScopeConfig, site=admin_site)
class EntityScopeConfigAdmin(admin.ModelAdmin):
    """Admin for Entity Scope Configuration"""
    
    list_display = ['entity_type', 'data_scope', 'model_path', 'migration_order', 'supports_rollback', 'supports_update']
    list_filter = ['data_scope', 'supports_rollback', 'supports_update']
    search_fields = ['entity_type', 'model_path']
    ordering = ['data_scope', 'migration_order']
    
    fieldsets = (
        ('Entity Configuration', {
            'fields': ('entity_type', 'data_scope', 'model_path')
        }),
        ('Keys', {
            'fields': ('natural_key_fields', 'unique_field', 'depends_on')
        }),
        ('Migration Settings', {
            'fields': ('migration_order', 'batch_size', 'supports_rollback', 'supports_update')
        }),
    )

