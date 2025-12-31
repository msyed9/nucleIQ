"""
HR Serializers
"""

from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveApplication


class LeaveTypeSerializer(serializers.ModelSerializer):
    """Serializer for LeaveType."""
    
    class Meta:
        model = LeaveType
        fields = [
            'id', 'name', 'code', 'description', 'default_quota',
            'is_paid', 'requires_approval', 'max_consecutive_days',
            'carry_forward', 'max_carry_forward', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    """Serializer for LeaveBalance."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    available = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'staff', 'staff_name', 'leave_type', 'leave_type_name',
            'academic_year', 'academic_year_name', 'total_quota', 'used',
            'pending', 'carried_forward', 'available',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'used', 'pending', 'created_at', 'updated_at']


class LeaveApplicationSerializer(serializers.ModelSerializer):
    """Serializer for LeaveApplication."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveApplication
        fields = [
            'id', 'staff', 'staff_name', 'leave_type', 'leave_type_name',
            'start_date', 'end_date', 'total_days', 'reason', 'status',
            'applied_on', 'approved_by', 'approved_by_name', 'approved_on',
            'approval_remarks', 'attachment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_days', 'applied_on', 'approved_on', 'created_at', 'updated_at']
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None


class LeaveApplicationCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating leave applications."""
    
    class Meta:
        model = LeaveApplication
        fields = ['staff', 'leave_type', 'start_date', 'end_date', 'reason', 'attachment']


class LeaveApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting leave."""
    
    remarks = serializers.CharField(required=False, allow_blank=True)
