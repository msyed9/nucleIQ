"""
Serializers for 10-Year School Data Migration Module
"""

from rest_framework import serializers
from .migration_models import (
    MigrationRun, MigrationPhaseLog, CrosswalkEntry, MigrationError,
    QuarantineRecord, ReconciliationReport, AcademicYearBatch,
    EntityScopeConfig, DataScope, MigrationPhase, EntityType
)


class MigrationRunSerializer(serializers.ModelSerializer):
    """Serializer for MigrationRun model."""
    
    progress_percentage = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()
    
    class Meta:
        model = MigrationRun
        fields = [
            'id', 'run_code', 'description', 'status', 'current_phase',
            'source_system_name', 'source_data_summary',
            'start_academic_year', 'end_academic_year',
            'total_records', 'processed_records', 'successful_records',
            'failed_records', 'skipped_records',
            'phase_status', 'config',
            'started_at', 'completed_at',
            'created_at', 'updated_at',
            'created_by', 'created_by_email',
            'progress_percentage'
        ]
        read_only_fields = [
            'id', 'run_code', 'phase_status',
            'total_records', 'processed_records', 'successful_records',
            'failed_records', 'skipped_records',
            'started_at', 'completed_at', 'created_at', 'updated_at'
        ]
    
    def get_progress_percentage(self, obj):
        return obj.get_progress_percentage()
    
    def get_created_by_email(self, obj):
        return obj.created_by.email if obj.created_by else None


class MigrationRunCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new migration run."""
    
    class Meta:
        model = MigrationRun
        fields = [
            'description', 'source_system_name',
            'start_academic_year', 'end_academic_year',
            'config'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_platform_admin:
            # Platform admins can specify tenant in data or query param
            tenant_id = request.data.get('tenant') or request.query_params.get('tenant')
            if tenant_id:
                validated_data['tenant_id'] = tenant_id
            else:
                validated_data['tenant'] = request.user.tenant
        else:
            validated_data['tenant'] = request.user.tenant
            
        validated_data['created_by'] = request.user if request else None
        return super().create(validated_data)


class MigrationPhaseLogSerializer(serializers.ModelSerializer):
    """Serializer for MigrationPhaseLog model."""
    
    phase_display = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    
    class Meta:
        model = MigrationPhaseLog
        fields = [
            'id', 'phase', 'phase_display', 'status',
            'started_at', 'completed_at', 'duration_seconds',
            'total_entities', 'processed_entities',
            'successful_entities', 'failed_entities',
            'entity_counts', 'error_summary', 'notes'
        ]
    
    def get_phase_display(self, obj):
        return dict(MigrationPhase.choices).get(obj.phase, obj.phase)
    
    def get_duration_seconds(self, obj):
        if obj.started_at and obj.completed_at:
            return (obj.completed_at - obj.started_at).total_seconds()
        return None


class CrosswalkEntrySerializer(serializers.ModelSerializer):
    """Serializer for CrosswalkEntry model."""
    
    entity_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CrosswalkEntry
        fields = [
            'id', 'entity_type', 'entity_type_display',
            'source_id', 'source_natural_key', 'source_data',
            'target_id', 'target_natural_key',
            'academic_year_code', 'status', 'error_message',
            'processed_at', 'created_at'
        ]
    
    def get_entity_type_display(self, obj):
        return dict(EntityType.choices).get(obj.entity_type, obj.entity_type)


class MigrationErrorSerializer(serializers.ModelSerializer):
    """Serializer for MigrationError model."""
    
    phase_display = serializers.SerializerMethodField()
    entity_type_display = serializers.SerializerMethodField()
    resolved_by_email = serializers.SerializerMethodField()
    
    class Meta:
        model = MigrationError
        fields = [
            'id', 'phase', 'phase_display',
            'entity_type', 'entity_type_display',
            'source_id', 'source_row_number', 'source_file', 'source_data',
            'academic_year_code',
            'severity', 'error_type', 'error_code', 'error_message', 'error_details',
            'is_resolved', 'resolution_notes', 'resolved_at',
            'resolved_by', 'resolved_by_email',
            'created_at'
        ]
    
    def get_phase_display(self, obj):
        return dict(MigrationPhase.choices).get(obj.phase, obj.phase)
    
    def get_entity_type_display(self, obj):
        return dict(EntityType.choices).get(obj.entity_type, obj.entity_type)
    
    def get_resolved_by_email(self, obj):
        return obj.resolved_by.email if obj.resolved_by else None


class QuarantineRecordSerializer(serializers.ModelSerializer):
    """Serializer for QuarantineRecord model."""
    
    entity_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = QuarantineRecord
        fields = [
            'id', 'entity_type', 'entity_type_display',
            'source_id', 'source_file', 'source_row_number',
            'original_data', 'academic_year_code',
            'reason', 'validation_errors',
            'status', 'corrected_data', 'processed_at',
            'created_at'
        ]
    
    def get_entity_type_display(self, obj):
        return dict(EntityType.choices).get(obj.entity_type, obj.entity_type)


class QuarantineRecordUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating quarantine records."""
    
    class Meta:
        model = QuarantineRecord
        fields = ['corrected_data', 'status']


class ReconciliationReportSerializer(serializers.ModelSerializer):
    """Serializer for ReconciliationReport model."""
    
    report_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ReconciliationReport
        fields = [
            'id', 'report_type', 'report_type_display',
            'academic_year_code',
            'source_total', 'target_total', 'variance', 'variance_percentage',
            'breakdown', 'is_valid', 'validation_notes',
            'spot_check_samples', 'created_at'
        ]
    
    def get_report_type_display(self, obj):
        return dict(ReconciliationReport.REPORT_TYPE_CHOICES).get(
            obj.report_type, obj.report_type
        )


class AcademicYearBatchSerializer(serializers.ModelSerializer):
    """Serializer for AcademicYearBatch model."""
    
    progress_percentage = serializers.SerializerMethodField()
    academic_year_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AcademicYearBatch
        fields = [
            'id', 'academic_year_code', 'academic_year_name',
            'year_sequence', 'start_date', 'end_date',
            'status', 'total_records', 'processed_records',
            'successful_records', 'failed_records',
            'entity_progress', 'started_at', 'completed_at',
            'progress_percentage'
        ]
    
    def get_progress_percentage(self, obj):
        if obj.total_records == 0:
            return 0
        return round((obj.processed_records / obj.total_records) * 100, 2)
    
    def get_academic_year_name(self, obj):
        return obj.academic_year.name if obj.academic_year else obj.academic_year_code


class EntityScopeConfigSerializer(serializers.ModelSerializer):
    """Serializer for EntityScopeConfig model."""
    
    entity_type_display = serializers.SerializerMethodField()
    scope_display = serializers.SerializerMethodField()
    
    class Meta:
        model = EntityScopeConfig
        fields = [
            'id', 'entity_type', 'entity_type_display',
            'data_scope', 'scope_display',
            'model_path', 'natural_key_fields', 'unique_field',
            'depends_on', 'migration_order',
            'supports_rollback', 'supports_update', 'batch_size'
        ]
    
    def get_entity_type_display(self, obj):
        return dict(EntityType.choices).get(obj.entity_type, obj.entity_type)
    
    def get_scope_display(self, obj):
        return dict(DataScope.choices).get(obj.data_scope, obj.data_scope)


# =============================================================================
# NESTED SERIALIZERS FOR DETAILED VIEWS
# =============================================================================

class MigrationRunDetailSerializer(MigrationRunSerializer):
    """Detailed serializer for MigrationRun with related data."""
    
    phase_logs = MigrationPhaseLogSerializer(many=True, read_only=True)
    year_batches = AcademicYearBatchSerializer(many=True, read_only=True)
    error_count = serializers.SerializerMethodField()
    quarantine_count = serializers.SerializerMethodField()
    
    class Meta(MigrationRunSerializer.Meta):
        fields = MigrationRunSerializer.Meta.fields + [
            'phase_logs', 'year_batches', 'error_count', 'quarantine_count'
        ]
    
    def get_error_count(self, obj):
        return obj.errors.count()
    
    def get_quarantine_count(self, obj):
        return obj.quarantine_records.count()


class MigrationSummarySerializer(serializers.Serializer):
    """Summary serializer for migration dashboard."""
    
    total_runs = serializers.IntegerField()
    active_runs = serializers.IntegerField()
    completed_runs = serializers.IntegerField()
    failed_runs = serializers.IntegerField()
    total_records_migrated = serializers.IntegerField()
    total_errors = serializers.IntegerField()
    recent_runs = MigrationRunSerializer(many=True)


# =============================================================================
# INPUT SERIALIZERS FOR MIGRATION OPERATIONS
# =============================================================================

class MigrationSourceDataSerializer(serializers.Serializer):
    """Serializer for source data upload."""
    
    entity_type = serializers.ChoiceField(choices=EntityType.choices)
    academic_year = serializers.CharField(required=False, allow_blank=True)
    records = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        help_text="List of records to migrate"
    )


class PreflightRequestSerializer(serializers.Serializer):
    """Serializer for preflight analysis request."""
    
    source_data = serializers.DictField(
        help_text="Dictionary of entity_name -> list of records"
    )


class MigrationRunConfigSerializer(serializers.Serializer):
    """Serializer for migration run configuration."""
    
    batch_size = serializers.IntegerField(default=1000, min_value=100, max_value=10000)
    chunk_size = serializers.IntegerField(default=50000, min_value=1000)
    max_errors_per_entity = serializers.IntegerField(default=100, min_value=1)
    continue_on_error = serializers.BooleanField(default=True)
    validate_fk_references = serializers.BooleanField(default=True)
    create_parent_accounts = serializers.BooleanField(default=True)
    archive_old_years = serializers.BooleanField(default=False)
    dry_run = serializers.BooleanField(default=False)


class RollbackRequestSerializer(serializers.Serializer):
    """Serializer for rollback request."""
    
    academic_year_code = serializers.CharField(required=False, allow_blank=True)
    rollback_all = serializers.BooleanField(default=False)
    confirm = serializers.BooleanField(default=False)


class ErrorResolutionSerializer(serializers.Serializer):
    """Serializer for resolving migration errors."""
    
    resolution_notes = serializers.CharField(required=True)
    action = serializers.ChoiceField(choices=[
        ('RESOLVE', 'Mark as Resolved'),
        ('RETRY', 'Retry Import'),
        ('DISCARD', 'Discard Record'),
    ])
