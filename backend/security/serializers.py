"""
Security & Visitor Management Serializers
"""

from rest_framework import serializers
from .models import GatePass, GateLog, CampusVisitor, CampusVisitorLog


class GatePassSerializer(serializers.ModelSerializer):
    """Serializer for GatePass."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GatePass
        fields = [
            'id', 'pass_type', 'student', 'student_name', 'student_roll_number',
            'visitor_name', 'reason', 'valid_from', 'valid_until', 'status',
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            'token', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'token', 'created_at', 'updated_at']
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None


class GateLogSerializer(serializers.ModelSerializer):
    """Serializer for GateLog."""
    
    gate_pass_details = GatePassSerializer(source='gate_pass', read_only=True)
    guard_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GateLog
        fields = [
            'id', 'gate_pass', 'gate_pass_details', 'guard', 'guard_name',
            'scanned_at', 'action', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'scanned_at', 'created_at']
    
    def get_guard_name(self, obj):
        return obj.guard.get_full_name() if obj.guard else None


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer for Visitor."""
    
    person_to_meet_name = serializers.SerializerMethodField()
    checked_in_by_name = serializers.SerializerMethodField()
    checked_out_by_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    is_overstayed = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = CampusVisitor
        fields = [
            'id', 'name', 'phone', 'email', 'visitor_type', 'organization',
            'id_proof_type', 'id_proof_number', 'purpose', 'person_to_meet',
            'person_to_meet_name', 'department_to_visit', 'check_in_time',
            'expected_checkout_time', 'check_out_time', 'status',
            'checked_in_by', 'checked_in_by_name', 'checked_out_by',
            'checked_out_by_name', 'vehicle_number', 'items_carried',
            'photo', 'signature', 'badge_number', 'badge_returned',
            'notes', 'duration_minutes', 'is_overstayed', 'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'check_in_time', 'status', 'duration_minutes',
            'is_overstayed', 'created_at', 'updated_at'
        ]
    
    def get_person_to_meet_name(self, obj):
        return obj.person_to_meet.get_full_name() if obj.person_to_meet else None
    
    def get_checked_in_by_name(self, obj):
        return obj.checked_in_by.get_full_name() if obj.checked_in_by else None
    
    def get_checked_out_by_name(self, obj):
        return obj.checked_out_by.get_full_name() if obj.checked_out_by else None
    
    def get_duration_minutes(self, obj):
        duration = obj.duration
        return int(duration.total_seconds() / 60) if duration else 0


class VisitorListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing visitors."""
    
    person_to_meet_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CampusVisitor
        fields = [
            'id', 'name', 'phone', 'visitor_type', 'person_to_meet_name',
            'check_in_time', 'check_out_time', 'status'
        ]
    
    def get_person_to_meet_name(self, obj):
        return obj.person_to_meet.get_full_name() if obj.person_to_meet else None


class VisitorLogSerializer(serializers.ModelSerializer):
    """Serializer for VisitorLog."""
    
    visitor_name = serializers.CharField(source='visitor.name', read_only=True)
    logged_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CampusVisitorLog
        fields = [
            'id', 'visitor', 'visitor_name', 'timestamp', 'location',
            'action', 'logged_by', 'logged_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'timestamp', 'created_at']
    
    def get_logged_by_name(self, obj):
        return obj.logged_by.get_full_name() if obj.logged_by else None


class CheckoutVisitorSerializer(serializers.Serializer):
    """Serializer for checking out a visitor."""
    
    visitor_id = serializers.UUIDField()
    badge_returned = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class ApproveGatePassSerializer(serializers.Serializer):
    """Serializer for approving/rejecting gate pass."""
    
    gate_pass_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class ScanGatePassSerializer(serializers.Serializer):
    """Serializer for scanning gate pass."""
    
    token = serializers.CharField()
    action = serializers.ChoiceField(choices=['IN', 'OUT'], default='OUT')
    notes = serializers.CharField(required=False, allow_blank=True)
