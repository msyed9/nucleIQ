"""
Serializers for Parent Portal API

Provides read-only access to student data for parents.
"""

from rest_framework import serializers
from .models import (
    Student, StudentEnrollment, ParentUser, StudentRemark,
    StudentDocument, StudentHealthRecord
)


class ParentStudentListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing students accessible to parent.
    Lightweight version with essential fields only.
    """
    
    current_class = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name', 
            'photo_url', 'current_class', 'date_of_birth',
            'blood_group', 'gender'
        ]
        read_only_fields = fields
    
    def get_current_class(self, obj):
        """Get current class and section."""
        enrollment = obj.get_current_enrollment()
        if enrollment and enrollment.section and enrollment.section.grade:
            return f"{enrollment.section.grade.name} - {enrollment.section.name}"
        return "Not Enrolled"
    
    def get_photo_url(self, obj):
        """Get photo URL or None."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class ParentStudentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for student information.
    Includes more fields but excludes sensitive data.
    """
    
    current_class = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    current_enrollment_details = serializers.SerializerMethodField()
    
    # Parent contact info (only relevant parent's details)
    parent_contact = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name',
            'photo_url', 'date_of_birth', 'gender', 'blood_group', 'religion',
            'category', 'nationality', 'mother_tongue',
            'current_class', 'current_enrollment_details', 'parent_contact',
            'emergency_contact_name', 'emergency_contact_phone',
            'medical_conditions', 'allergies', 'current_medications'
        ]
        read_only_fields = fields
    
    def get_current_class(self, obj):
        """Get current class and section."""
        enrollment = obj.get_current_enrollment()
        if enrollment and enrollment.section and enrollment.section.grade:
            return f"{enrollment.section.grade.name} - {enrollment.section.name}"
        return "Not Enrolled"
    
    def get_photo_url(self, obj):
        """Get photo URL or None."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_current_enrollment_details(self, obj):
        """Get current enrollment details."""
        enrollment = obj.get_current_enrollment()
        if enrollment:
            return {
                'academic_year': enrollment.academic_year.name,
                'grade': enrollment.section.grade.name,
                'section': enrollment.section.name,
                'roll_number': enrollment.roll_number,
                'enrollment_date': enrollment.enrollment_date,
                'status': enrollment.status
            }
        return None
    
    def get_parent_contact(self, obj):
        """Get parent contact info based on logged-in parent."""
        user = self.context.get('request').user
        
        try:
            parent_profile = ParentUser.objects.get(user=user)
            relation = parent_profile.relation_type
            
            # Return contact info based on relation type
            if relation == 'FATHER':
                return {
                    'name': obj.father_name,
                    'phone': obj.father_phone,
                    'email': obj.father_email,
                    'occupation': obj.father_occupation,
                    'relation': 'Father'
                }
            elif relation == 'MOTHER':
                return {
                    'name': obj.mother_name,
                    'phone': obj.mother_phone,
                    'email': obj.mother_email,
                    'occupation': obj.mother_occupation,
                    'relation': 'Mother'
                }
            else:  # GUARDIAN
                return {
                    'name': obj.guardian_name,
                    'phone': obj.guardian_phone,
                    'email': obj.guardian_email,
                    'relation': 'Guardian'
                }
        except ParentUser.DoesNotExist:
            return None


class ParentStudentRemarkSerializer(serializers.ModelSerializer):
    """
    Serializer for student remarks visible to parents.
    """
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = StudentRemark
        fields = [
            'id', 'student', 'student_name', 'remark_type',
            'remark', 'created_by_name', 'created_at'
        ]
        read_only_fields = fields


class ParentStudentDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for student documents.
    Parents can only view, not upload/delete.
    """
    
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = StudentDocument
        fields = [
            'id', 'document_type', 'document_name', 'file_url',
            'uploaded_at', 'uploaded_by_name', 'verification_status',
            'remarks'
        ]
        read_only_fields = fields
    
    def get_file_url(self, obj):
        """Get file URL."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ParentStudentHealthRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for student health records.
    """
    
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = StudentHealthRecord
        fields = [
            'id', 'record_type', 'record_date', 'height', 'weight',
            'bmi', 'blood_pressure', 'temperature', 'symptoms',
            'diagnosis', 'treatment', 'prescription', 'follow_up_date',
            'remarks', 'recorded_by_name'
        ]
        read_only_fields = fields


class ParentStudent360Serializer(serializers.Serializer):
    """
    Serializer for comprehensive 360° student view.
    Combines student info, attendance, fees, and exams.
    """
    
    student = serializers.DictField()
    attendance = serializers.DictField()
    fees = serializers.DictField()
    exams = serializers.DictField()
    
    class Meta:
        fields = ['student', 'attendance', 'fees', 'exams']


class ParentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for parent user profile.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ParentUser
        fields = [
            'id', 'user_email', 'user_name', 'relation_type',
            'occupation', 'office_address', 'preferred_language',
            'email_notifications', 'sms_notifications', 'push_notifications',
            'portal_access_enabled', 'last_login_at', 'students_count'
        ]
        read_only_fields = ['id', 'user_email', 'user_name', 'last_login_at', 'students_count']
    
    def get_students_count(self, obj):
        """Get count of linked students."""
        return obj.students.filter(is_active=True).count()
