"""
Certificate Management Serializers
"""

from rest_framework import serializers
from .models import CertificateTemplate, CertificateRequest, GeneratedCertificate


class CertificateTemplateSerializer(serializers.ModelSerializer):
    """Serializer for CertificateTemplate."""
    
    class Meta:
        model = CertificateTemplate
        fields = [
            'id', 'name', 'content', 'header_image', 'footer_image',
            'signature_image', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CertificateRequestSerializer(serializers.ModelSerializer):
    """Serializer for CertificateRequest."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    has_certificate = serializers.SerializerMethodField()
    
    class Meta:
        model = CertificateRequest
        fields = [
            'id', 'student', 'student_name', 'student_roll_number',
            'template', 'template_name', 'reason', 'status',
            'requested_at', 'approved_by', 'approved_by_name',
            'approved_at', 'has_certificate', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'requested_at', 'approved_by', 'approved_at',
            'created_at', 'updated_at'
        ]
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None
    
    def get_has_certificate(self, obj):
        return hasattr(obj, 'generated_certificate')


class CertificateRequestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing certificate requests."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = CertificateRequest
        fields = [
            'id', 'student_name', 'template_name', 'status',
            'requested_at', 'approved_at'
        ]


class GeneratedCertificateSerializer(serializers.ModelSerializer):
    """Serializer for GeneratedCertificate."""
    
    student_name = serializers.CharField(source='request.student.get_full_name', read_only=True)
    template_name = serializers.CharField(source='request.template.name', read_only=True)
    request_details = CertificateRequestSerializer(source='request', read_only=True)
    
    class Meta:
        model = GeneratedCertificate
        fields = [
            'id', 'request', 'request_details', 'certificate_number',
            'issued_date', 'content_snapshot', 'pdf_file', 'verified',
            'student_name', 'template_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'certificate_number', 'content_snapshot',
            'created_at', 'updated_at'
        ]


class CreateCertificateRequestSerializer(serializers.Serializer):
    """Serializer for creating a certificate request."""
    
    student_id = serializers.UUIDField()
    template_id = serializers.UUIDField()
    reason = serializers.CharField(required=False, allow_blank=True)


class ApproveCertificateRequestSerializer(serializers.Serializer):
    """Serializer for approving a certificate request."""
    
    request_id = serializers.UUIDField()
    auto_generate = serializers.BooleanField(default=True)


class GenerateCertificateSerializer(serializers.Serializer):
    """Serializer for generating a certificate."""
    
    request_id = serializers.UUIDField()
    issue_date = serializers.DateField(required=False)
