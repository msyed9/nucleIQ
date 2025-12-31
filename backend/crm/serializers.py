"""
CRM Serializers
"""

from rest_framework import serializers
from .models import Lead, LeadInteraction, LeadDocument, Visitor, AdmissionPortalAccess


class LeadSerializer(serializers.ModelSerializer):
    """Serializer for Lead."""
    
    assigned_to_name = serializers.SerializerMethodField()
    grade_name = serializers.CharField(source='grade_applying_for.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    interaction_count = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = [
            'id', 'lead_number', 'source', 'status', 'priority',
            'student_name', 'date_of_birth', 'gender', 'current_school',
            'grade_applying_for', 'grade_name', 'academic_year', 'academic_year_name',
            'parent_name', 'parent_email', 'parent_phone', 'parent_alternate_phone',
            'address', 'city', 'state', 'postal_code',
            'assigned_to', 'assigned_to_name', 'next_follow_up', 'follow_up_notes',
            'application_fee_paid', 'application_fee_amount', 'application_fee_payment_id',
            'documents_submitted', 'converted_to_student', 'student',
            'converted_at', 'lost_reason', 'lost_at', 'remarks',
            'interaction_count', 'document_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'lead_number', 'converted_at', 'lost_at', 'created_at', 'updated_at']
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
    
    def get_interaction_count(self, obj):
        return obj.interactions.filter(is_deleted=False).count()
    
    def get_document_count(self, obj):
        return obj.documents.filter(is_deleted=False).count()


class LeadInteractionSerializer(serializers.ModelSerializer):
    """Serializer for LeadInteraction."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    lead_number = serializers.CharField(source='lead.lead_number', read_only=True)
    
    class Meta:
        model = LeadInteraction
        fields = [
            'id', 'lead', 'lead_number', 'interaction_type', 'interaction_date',
            'staff', 'staff_name', 'subject', 'notes', 'outcome',
            'next_action', 'next_action_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeadDocumentSerializer(serializers.ModelSerializer):
    """Serializer for LeadDocument."""
    
    verified_by_name = serializers.SerializerMethodField()
    lead_number = serializers.CharField(source='lead.lead_number', read_only=True)
    
    class Meta:
        model = LeadDocument
        fields = [
            'id', 'lead', 'lead_number', 'document_type', 'title', 'file',
            'uploaded_by', 'verified', 'verified_by', 'verified_by_name',
            'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'verified_at', 'created_at']
    
    def get_verified_by_name(self, obj):
        return obj.verified_by.get_full_name() if obj.verified_by else None


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer for Visitor."""
    
    meeting_with_name = serializers.SerializerMethodField()
    lead_number = serializers.CharField(source='lead.lead_number', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'visitor_number', 'name', 'phone', 'email', 'organization',
            'purpose', 'lead', 'lead_number', 'meeting_with', 'meeting_with_name',
            'check_in_time', 'check_out_time', 'duration', 'photo',
            'badge_number', 'badge_printed', 'notes', 'feedback',
            'created_at'
        ]
        read_only_fields = ['id', 'visitor_number', 'created_at']
    
    def get_meeting_with_name(self, obj):
        return obj.meeting_with.get_full_name() if obj.meeting_with else None
    
    def get_duration(self, obj):
        if obj.check_out_time:
            delta = obj.check_out_time - obj.check_in_time
            return int(delta.total_seconds() / 60)  # minutes
        return None


class AdmissionPortalAccessSerializer(serializers.ModelSerializer):
    """Serializer for AdmissionPortalAccess."""
    
    lead_number = serializers.CharField(source='lead.lead_number', read_only=True)
    student_name = serializers.CharField(source='lead.student_name', read_only=True)
    
    class Meta:
        model = AdmissionPortalAccess
        fields = [
            'id', 'lead', 'lead_number', 'student_name',
            'access_code', 'is_active', 'last_login',
            'created_at'
        ]
        read_only_fields = ['id', 'access_code', 'last_login', 'created_at']
        extra_kwargs = {
            'password_hash': {'write_only': True}
        }


class LeadStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating lead status."""
    
    status = serializers.ChoiceField(choices=Lead.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class LeadBulkImportSerializer(serializers.Serializer):
    """Serializer for bulk import."""
    
    file = serializers.FileField()


class LeadConversionSerializer(serializers.Serializer):
    """Serializer for converting lead to student."""
    
    admission_number = serializers.CharField(required=False)
    section_id = serializers.UUIDField(required=False)
