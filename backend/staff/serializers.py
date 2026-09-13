"""
Staff Serializers
"""

from rest_framework import serializers
from .models import (
    Staff, StaffDocument, StaffAttendance, StaffLeave,
    StaffHealthProfile, StaffMedicalHistory, StaffMedicalCheckup,
    StaffVaccination, StaffInjuryReport,
    TrainingProgram, TrainingEnrollment, TrainingFeedback,
    AppraisalCycle, StaffAppraisal, StaffGoal
)
from idcards.qr_resolution import normalize_manual_qr_value, validate_manual_qr_uniqueness


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
            'manual_qr_code',
            'user_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'age', 'tenure_years']

    def validate_manual_qr_code(self, value):
        """Normalize and enforce uniqueness of the manually assigned/external QR code."""
        normalized = normalize_manual_qr_value(value)
        if not normalized:
            return None

        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        if tenant:
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                validate_manual_qr_uniqueness(
                    normalized, tenant,
                    exclude_staff_id=self.instance.id if self.instance else None
                )
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.message if hasattr(e, 'message') else str(e))

        return normalized


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
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = StaffDocument
        fields = [
            'id', 'tenant', 'staff', 'staff_name',
            'category', 'document_type', 'title', 'description',
            'document_number', 'issue_date', 'expiry_date', 'issuing_authority',
            'file', 'uploaded_by', 'uploaded_by_name',
            'status', 'verified_by', 'verified_by_name',
            'verification_date', 'verification_notes',
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
            'is_late', 'is_early_going', 'overtime_hours',
            'remarks', 'marked_by',
            'biometric_punch_in', 'biometric_punch_out', 'biometric_device_id',
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


class StaffHealthProfileSerializer(serializers.ModelSerializer):
    """Serializer for Staff Health Profile."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffHealthProfile
        fields = '__all__'
        read_only_fields = ['id', 'bmi', 'created_at', 'updated_at']


class StaffMedicalHistorySerializer(serializers.ModelSerializer):
    """Serializer for Staff Medical History."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffMedicalHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffMedicalCheckupSerializer(serializers.ModelSerializer):
    """Serializer for Staff Medical Checkup."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffMedicalCheckup
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffVaccinationSerializer(serializers.ModelSerializer):
    """Serializer for Staff Vaccination."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffVaccination
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffInjuryReportSerializer(serializers.ModelSerializer):
    """Serializer for Staff Injury Report."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffInjuryReport
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrainingProgramSerializer(serializers.ModelSerializer):
    """Serializer for Training Program."""
    
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingProgram
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status='ENROLLED').count()


class TrainingEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Training Enrollment."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    program_name = serializers.CharField(source='training_program.program_name', read_only=True)
    
    class Meta:
        model = TrainingEnrollment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrainingFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for Training Feedback."""
    
    staff_name = serializers.CharField(source='enrollment.staff.get_full_name', read_only=True)
    program_name = serializers.CharField(source='enrollment.training_program.program_name', read_only=True)
    
    class Meta:
        model = TrainingFeedback
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AppraisalCycleSerializer(serializers.ModelSerializer):
    """Serializer for Appraisal Cycle."""
    
    class Meta:
        model = AppraisalCycle
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffAppraisalSerializer(serializers.ModelSerializer):
    """Serializer for Staff Appraisal."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    cycle_name = serializers.CharField(source='appraisal_cycle.name', read_only=True)
    
    class Meta:
        model = StaffAppraisal
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffGoalSerializer(serializers.ModelSerializer):
    """Serializer for Staff Goal."""
    
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffGoal
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
