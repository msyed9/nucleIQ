"""
Staff Serializers
"""

from rest_framework import serializers
from .models import Staff, StaffDocument, StaffAttendance, StaffLeave


class StaffSerializer(serializers.ModelSerializer):
    """Serializer for Staff model."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    age = serializers.IntegerField(source='get_age', read_only=True)
    tenure_years = serializers.IntegerField(source='get_tenure_years', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Staff
        fields = [
            'id', 'tenant', 'user', 'employee_id',
            'first_name', 'middle_name', 'last_name', 'full_name',
            'date_of_birth', 'age', 'gender',
            'email', 'phone', 'alternate_phone',
            'address', 'city', 'state', 'postal_code', 'country',
            'designation', 'department', 'department_name',
            'employment_type', 'joining_date', 'leaving_date',
            'status', 'tenure_years',
            'qualifications', 'experience_years', 'previous_experience',
            'salary', 'bank_account_number', 'bank_name', 'bank_ifsc',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'blood_group', 'photo',
            'aadhar_number', 'pan_number',
            'subjects_taught', 'remarks',
            'user_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'age', 'tenure_years']


class StaffListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for staff list."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Staff
        fields = [
            'id', 'employee_id', 'full_name', 'designation',
            'department_name', 'email', 'phone', 'status',
            'photo', 'joining_date'
        ]


class StaffDocumentSerializer(serializers.ModelSerializer):
    """Serializer for Staff Documents."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = StaffDocument
        fields = [
            'id', 'tenant', 'staff', 'staff_name',
            'document_type', 'title', 'description',
            'file', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Staff Attendance."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    staff_employee_id = serializers.CharField(source='staff.employee_id', read_only=True)
    
    class Meta:
        model = StaffAttendance
        fields = [
            'id', 'tenant', 'staff', 'staff_name', 'staff_employee_id',
            'date', 'status', 'check_in_time', 'check_out_time',
            'remarks', 'marked_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffLeaveSerializer(serializers.ModelSerializer):
    """Serializer for Staff Leave."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = StaffLeave
        fields = [
            'id', 'tenant', 'staff', 'staff_name',
            'leave_type', 'from_date', 'to_date', 'total_days',
            'reason', 'status',
            'approved_by', 'approved_by_name',
            'approval_date', 'approval_remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_days', 'created_at', 'updated_at']
