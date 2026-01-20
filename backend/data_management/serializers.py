"""
Data Migration Serializers
For API response formatting
"""

from rest_framework import serializers
from .models import ImportJob, ImportFieldMapping


class ImportJobSerializer(serializers.ModelSerializer):
    """Serializer for ImportJob model"""
    
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = ImportJob
        fields = [
            'id', 'module', 'status', 'original_filename', 'file_type',
            'total_rows', 'processed_rows', 'successful_rows', 'failed_rows',
            'duplicate_rows', 'validation_errors', 'skip_duplicates',
            'update_existing', 'created_by_email', 'created_at', 'completed_at'
        ]
        read_only_fields = fields


class ImportJobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for job list"""
    
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = ImportJob
        fields = [
            'id', 'module', 'status', 'original_filename',
            'total_rows', 'successful_rows', 'failed_rows',
            'created_by_email', 'created_at'
        ]


class ImportFieldMappingSerializer(serializers.ModelSerializer):
    """Serializer for ImportFieldMapping"""
    
    class Meta:
        model = ImportFieldMapping
        fields = ['id', 'module', 'source_column', 'target_field', 'is_active']


class ValidationResultSerializer(serializers.Serializer):
    """Serializer for validation results"""
    
    valid = serializers.BooleanField()
    total_rows = serializers.IntegerField()
    error_count = serializers.IntegerField()
    duplicate_count = serializers.IntegerField()
    warning_count = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    duplicates = serializers.ListField(child=serializers.DictField())
    preview = serializers.ListField(child=serializers.DictField())


class ImportResultSerializer(serializers.Serializer):
    """Serializer for import results"""
    
    success = serializers.IntegerField()
    failed = serializers.IntegerField()
    updated = serializers.IntegerField()
    duplicates_skipped = serializers.IntegerField()
    total = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField())
    job_id = serializers.UUIDField()


class ModuleInfoSerializer(serializers.Serializer):
    """Serializer for module information"""
    
    name = serializers.CharField()
    display_name = serializers.CharField()
    description = serializers.CharField()
    unique_field = serializers.CharField(allow_null=True)
    supported_formats = serializers.ListField(child=serializers.CharField())
    required_field_count = serializers.IntegerField()
    optional_field_count = serializers.IntegerField()


class FieldSpecSerializer(serializers.Serializer):
    """Serializer for field specifications"""
    
    name = serializers.CharField()
    display_name = serializers.CharField()
    type = serializers.CharField()
    required = serializers.BooleanField()
    max_length = serializers.IntegerField(allow_null=True)
    choices = serializers.ListField(child=serializers.CharField(), allow_null=True)
    description = serializers.CharField()
    sample_value = serializers.CharField()
    validation_hint = serializers.CharField()
