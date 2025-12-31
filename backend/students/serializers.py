"""
Serializers for Student 360° System
"""

from rest_framework import serializers
from .models import Student, StudentRemark, StudentDocument, StudentHealthRecord, StudentEnrollment


class StudentBasicSerializer(serializers.ModelSerializer):
    """Basic student information."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    age = serializers.IntegerField(source='get_age', read_only=True)
    current_class = serializers.CharField(source='get_current_enrollment.section.grade_level.name', read_only=True)
    section = serializers.CharField(source='get_current_enrollment.section.name', read_only=True)
    roll_number = serializers.CharField(source='get_current_enrollment.roll_number', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'full_name', 'first_name', 'last_name',
            'current_class', 'section', 'roll_number', 'photo', 'age',
            'date_of_birth', 'blood_group', 'is_active', 'email', 'phone'
        ]
        read_only_fields = ['id', 'full_name', 'age', 'current_class', 'section', 'roll_number']


class StudentDetailSerializer(serializers.ModelSerializer):
    """Detailed student information."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    age = serializers.IntegerField(source='get_age', read_only=True)
    siblings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'age']
    
    def get_siblings_count(self, obj):
        return obj.get_siblings().count()


class StudentRemarkSerializer(serializers.ModelSerializer):
    """Student remark serializer."""
    created_by_name = serializers.SerializerMethodField()
    color_class = serializers.CharField(source='get_color_class', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = StudentRemark
        fields = [
            'id', 'student', 'student_name', 'remark_type', 'category', 
            'title', 'description', 'created_by_staff', 'created_by_name',
            'visible_to_parent', 'visible_to_student', 'is_important',
            'is_system_generated', 'source_module', 'source_reference',
            'requires_action', 'action_taken', 'action_notes',
            'parent_acknowledged', 'parent_acknowledged_at',
            'attachment', 'created_at', 'updated_at', 'color_class'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'color_class', 'student_name']
    
    def get_created_by_name(self, obj):
        if obj.created_by_staff:
            return obj.created_by_staff.get_full_name()
        return 'System'


class CreateRemarkSerializer(serializers.ModelSerializer):
    """Serializer for creating remarks."""
    
    class Meta:
        model = StudentRemark
        fields = [
            'student', 'remark_type', 'category', 'title', 'description',
            'visible_to_parent', 'visible_to_student', 'is_important',
            'requires_action', 'attachment'
        ]
    
    def create(self, validated_data):
        # Set created_by_staff from request user
        validated_data['created_by_staff'] = self.context['request'].user
        return super().create(validated_data)


class StudentDocumentSerializer(serializers.ModelSerializer):
    """Student document serializer."""
    uploaded_by_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentDocument
        fields = [
            'id', 'student', 'document_type', 'title', 'description',
            'file', 'uploaded_by', 'uploaded_by_name', 'is_verified',
            'verified_by', 'verified_by_name', 'verified_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'verified_by', 'verified_at', 'created_at', 'updated_at']
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None
    
    def get_verified_by_name(self, obj):
        return obj.verified_by.get_full_name() if obj.verified_by else None


class StudentHealthRecordSerializer(serializers.ModelSerializer):
    """Student health record serializer."""
    bmi = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentHealthRecord
        fields = [
            'id', 'student', 'date', 'height_cm', 'weight_kg', 'bmi',
            'diagnosis', 'treatment', 'prescription', 'allergies',
            'vaccination_name', 'vaccination_date', 'notes',
            'examined_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'bmi', 'created_at', 'updated_at']
    
    def get_bmi(self, obj):
        return obj.get_bmi()


class Student360Serializer(serializers.Serializer):
    """Complete 360° profile serializer."""
    student = serializers.DictField()
    kpis = serializers.DictField()
    recent_activity = serializers.ListField()
    siblings = serializers.ListField()
    family_summary = serializers.DictField()
    academic_summary = serializers.DictField()
    financial_summary = serializers.DictField()
    health_summary = serializers.DictField()


class SiblingSerializer(serializers.ModelSerializer):
    """Sibling information serializer."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'admission_number', 'full_name', 'current_class', 'photo']
        read_only_fields = fields


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """Student enrollment serializer."""
    
    class Meta:
        model = StudentEnrollment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

