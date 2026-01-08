"""
Attendance Serializers
"""

from rest_framework import serializers
from .models import AttendanceRecord, AttendanceConfiguration, AttendanceMonthlyAggregate, QRCodeToken


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for Attendance Records."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    student_class = serializers.SerializerMethodField()
    student_section = serializers.SerializerMethodField()
    student_photo = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'tenant', 'record_type', 'student', 'student_name',
            'student_admission_number', 'student_class', 'student_section', 'student_photo',
            'staff', 'staff_name', 'date', 'status', 'method',
            'academic_year', 'check_in_time', 'check_out_time',
            'latitude', 'longitude', 'is_event_day', 'event_name',
            'marked_by', 'remarks', 'device_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_student_class(self, obj):
        """Get student's current class name."""
        if obj.student:
            enrollment = obj.student.enrollments.filter(status='ACTIVE').first()
            if enrollment and enrollment.section and enrollment.section.grade_level:
                return enrollment.section.grade_level.name
        return None
    
    def get_student_section(self, obj):
        """Get student's current section name."""
        if obj.student:
            enrollment = obj.student.enrollments.filter(status='ACTIVE').first()
            if enrollment and enrollment.section:
                return enrollment.section.name
        return None
    
    def get_student_photo(self, obj):
        """Get student's photo URL."""
        if obj.student and obj.student.photo:
            return obj.student.photo.url
        return None


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


class StudentFaceEncodingSerializer(serializers.ModelSerializer):
    """Serializer for Student Face Encodings."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    student_photo = serializers.SerializerMethodField()
    encoded_by_name = serializers.CharField(source='encoded_by.get_full_name', read_only=True)
    
    class Meta:
        from .models import StudentFaceEncoding
        model = StudentFaceEncoding
        fields = [
            'id', 'student', 'student_name', 'student_admission_number', 'student_photo',
            'reference_image', 'encoded_at', 'encoded_by', 'encoded_by_name',
            'confidence_score', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'encoded_at', 'created_at', 'confidence_score']
    
    def get_student_photo(self, obj):
        """Get student's main photo URL."""
        if obj.student and obj.student.photo:
            return obj.student.photo.url
        return None


class FaceEnrollmentInputSerializer(serializers.Serializer):
    """Serializer for face enrollment input."""
    
    student_id = serializers.UUIDField(required=True)
    image = serializers.CharField(required=False, help_text='Base64 encoded image')
    image_file = serializers.ImageField(required=False, help_text='Image file upload')
    
    def validate(self, data):
        if not data.get('image') and not data.get('image_file'):
            raise serializers.ValidationError("Either 'image' (base64) or 'image_file' must be provided")
        return data


class StudentFaceEnrollmentStatusSerializer(serializers.Serializer):
    """Serializer for student face enrollment status list."""
    
    id = serializers.UUIDField()
    admission_number = serializers.CharField()
    full_name = serializers.CharField()
    photo = serializers.CharField(allow_null=True)
    class_name = serializers.CharField(allow_null=True)
    section_name = serializers.CharField(allow_null=True)
    has_face_encoding = serializers.BooleanField()
    face_encoding_date = serializers.DateTimeField(allow_null=True)

