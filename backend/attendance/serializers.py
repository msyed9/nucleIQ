"""
Attendance Serializers
"""

from rest_framework import serializers
from .models import AttendanceRecord, AttendanceConfiguration, AttendanceMonthlyAggregate, QRCodeToken


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for Attendance Records."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'tenant', 'record_type', 'student', 'student_name',
            'staff', 'staff_name', 'date', 'status', 'method',
            'academic_year', 'check_in_time', 'check_out_time',
            'latitude', 'longitude', 'is_event_day', 'event_name',
            'marked_by', 'remarks', 'device_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AttendanceConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for Attendance Configuration."""
    
    class Meta:
        model = AttendanceConfiguration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceMonthlyAggregateSerializer(serializers.ModelSerializer):
    """Serializer for Monthly Aggregates."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceMonthlyAggregate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class QRCodeTokenSerializer(serializers.ModelSerializer):
    """Serializer for QR Code Tokens."""
    
    class Meta:
        model = QRCodeToken
        fields = '__all__'
        read_only_fields = ['id', 'token', 'created_at']
