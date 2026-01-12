"""
ID Cards Serializers
"""

from rest_framework import serializers
from .models import (
    IDCardTemplate,
    IDCardQRCode,
    IDCardRecord,
    IDCardGenerationJob,
    QRAttendance
)
from students.models import Student
from staff.models import Staff


class IDCardTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ID Card Templates"""
    
    usage_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IDCardTemplate
        fields = [
            'id', 'tenant', 'name', 'description', 'entity_type', 'orientation',
            'width', 'height', 'config', 'background_type', 'background_value',
            'is_default', 'is_system', 'is_active', 'version', 'parent_template',
            'created_at', 'updated_at', 'usage_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']
    
    def get_usage_count(self, obj):
        return obj.generated_cards.count()
    
    def validate(self, data):
        # Validate config structure if provided
        if 'config' in data:
            config = data['config']
            if not isinstance(config, dict):
                raise serializers.ValidationError({
                    'config': 'Config must be a valid JSON object'
                })
            
            # Validate required config keys
            if 'elements' not in config:
                config['elements'] = []
            
        return data


class IDCardTemplateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing templates (but includes config for designer)"""
    
    class Meta:
        model = IDCardTemplate
        fields = [
            'id', 'name', 'description', 'entity_type', 'orientation', 
            'width', 'height', 'config', 'background_type', 'background_value',
            'is_default', 'is_system', 'is_active', 'created_at'
        ]


class IDCardQRCodeSerializer(serializers.ModelSerializer):
    """Serializer for QR Codes"""
    
    entity_name = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = IDCardQRCode
        fields = [
            'id', 'tenant', 'entity_type', 'entity_id', 'qr_data', 'qr_hash',
            'issued_date', 'valid_until', 'is_active', 'last_scanned',
            'scan_count', 'id_card', 'entity_name', 'is_expired'
        ]
        read_only_fields = ['id', 'qr_hash', 'issued_date', 'tenant']
    
    def get_entity_name(self, obj):
        try:
            if obj.entity_type == 'student':
                student = Student.objects.get(id=obj.entity_id)
                return student.get_full_name()
            elif obj.entity_type == 'staff':
                staff = Staff.objects.get(id=obj.entity_id)
                return staff.get_full_name()
        except:
            return None
        return None
    
    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.valid_until < timezone.now()


class IDCardRecordSerializer(serializers.ModelSerializer):
    """Serializer for ID Card Records"""
    
    entity_name = serializers.SerializerMethodField()
    entity_details = serializers.SerializerMethodField()
    template_name = serializers.CharField(source='template.name', read_only=True)
    qr_codes_data = IDCardQRCodeSerializer(source='qr_codes', many=True, read_only=True)
    
    class Meta:
        model = IDCardRecord
        fields = [
            'id', 'tenant', 'entity_type', 'entity_id', 'template', 'template_name',
            'file_url', 'file_format', 'status', 'issued_date', 'valid_until',
            'bulk_job', 'printed_count', 'last_printed', 'entity_name',
            'entity_details', 'qr_codes_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'issued_date', 'tenant']
    
    def get_entity_name(self, obj):
        try:
            if obj.entity_type == 'student':
                student = Student.objects.get(id=obj.entity_id)
                return student.get_full_name()
            elif obj.entity_type == 'staff':
                staff = Staff.objects.get(id=obj.entity_id)
                return staff.get_full_name()
        except:
            return None
        return None
    
    def get_entity_details(self, obj):
        try:
            if obj.entity_type == 'student':
                # Select related grade_level to avoid extra queries and handle missing attributes safely
                student = Student.objects.select_related('current_enrollment__section__grade_level').get(id=obj.entity_id)
                enrollment = student.get_current_enrollment()

                class_name = None
                section_name = None
                if enrollment and enrollment.section:
                    section = enrollment.section
                    section_name = getattr(section, 'name', None)
                    grade_level = getattr(section, 'grade_level', None)
                    class_name = getattr(grade_level, 'name', None) if grade_level else None

                return {
                    'name': student.get_full_name(),
                    'admission_number': student.admission_number,
                    'dob': student.date_of_birth,
                    'class': class_name,
                    'section': section_name,
                    'photo_url': student.photo.url if student.photo else None,
                }
            elif obj.entity_type == 'staff':
                staff = Staff.objects.get(id=obj.entity_id)
                return {
                    'name': staff.get_full_name(),
                    'employee_id': staff.employee_id,
                    'designation': staff.get_designation_display(),
                    'department': staff.department,
                    'photo_url': staff.photo.url if staff.photo else None,
                }
        except:
            return None
        return None


class IDCardGenerationJobSerializer(serializers.ModelSerializer):
    """Serializer for Bulk Generation Jobs"""
    
    template_name = serializers.CharField(source='template.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    estimated_completion = serializers.SerializerMethodField()
    
    class Meta:
        model = IDCardGenerationJob
        fields = [
            'id', 'tenant', 'entity_type', 'filters', 'template', 'template_name',
            'output_format', 'layout', 'include_qr', 'status', 'progress',
            'total_cards', 'completed_cards', 'failed_cards', 'download_url',
            'individual_files', 'started_at', 'completed_at', 'error_message',
            'created_by', 'created_by_name', 'created_at', 'estimated_completion'
        ]
        read_only_fields = [
            'id', 'status', 'progress', 'total_cards', 'completed_cards',
            'failed_cards', 'download_url', 'individual_files', 'started_at',
            'completed_at', 'error_message', 'tenant', 'created_at'
        ]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None
    
    def get_estimated_completion(self, obj):
        if obj.status == 'processing' and obj.total_cards > 0:
            # Estimate 2 seconds per card
            remaining_cards = obj.total_cards - obj.completed_cards
            from datetime import timedelta
            from django.utils import timezone
            estimated = timezone.now() + timedelta(seconds=remaining_cards * 2)
            return estimated
        return None


class IDCardGenerationJobCreateSerializer(serializers.Serializer):
    """Serializer for creating bulk generation jobs"""
    
    entity_type = serializers.ChoiceField(choices=['student', 'staff'])
    filters = serializers.JSONField(required=False, default=dict)
    template_id = serializers.UUIDField(required=False, allow_null=True)
    include_qr = serializers.BooleanField(default=True)
    output_format = serializers.ChoiceField(
        choices=['pdf', 'png', 'jpg'],
        default='pdf'
    )
    layout = serializers.ChoiceField(
        choices=['individual', 'grid', 'sheet'],
        default='individual'
    )


class SingleIDCardGenerationSerializer(serializers.Serializer):
    """Serializer for single ID card generation"""
    
    entity_type = serializers.ChoiceField(choices=['student', 'staff'])
    entity_id = serializers.UUIDField()
    template_id = serializers.UUIDField(required=False, allow_null=True)
    include_qr = serializers.BooleanField(default=True)


class QRAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for QR Attendance Records"""
    
    entity_name = serializers.SerializerMethodField()
    entity_photo = serializers.SerializerMethodField()
    
    class Meta:
        model = QRAttendance
        fields = [
            'id', 'tenant', 'qr_code', 'student', 'staff', 'scan_timestamp',
            'scan_location', 'scan_device', 'scan_type', 'attendance_status',
            'linked_attendance', 'is_duplicate', 'is_valid_scan',
            'validation_notes', 'entity_name', 'entity_photo', 'created_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at']
    
    def get_entity_name(self, obj):
        if obj.student:
            return obj.student.get_full_name()
        elif obj.staff:
            return obj.staff.get_full_name()
        return None
    
    def get_entity_photo(self, obj):
        try:
            if obj.student and obj.student.photo:
                return obj.student.photo.url
            elif obj.staff and obj.staff.photo:
                return obj.staff.photo.url
        except:
            return None
        return None


class QRScanSerializer(serializers.Serializer):
    """Serializer for QR code scanning"""
    
    qr_data = serializers.CharField(required=True)
    scan_location = serializers.CharField(required=False, allow_blank=True)
    scan_device = serializers.CharField(required=False, allow_blank=True)
    scan_type = serializers.ChoiceField(
        choices=['entry', 'exit'],
        default='entry'
    )
    timestamp = serializers.DateTimeField(required=False)
