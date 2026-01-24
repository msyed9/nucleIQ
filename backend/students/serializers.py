"""
Serializers for Student 360° System
"""

from rest_framework import serializers
from .models import Student, StudentRemark, StudentDocument, StudentHealthRecord, StudentEnrollment, ParentUser
from .utils import generate_admission_number, validate_admission_number_unique
from core.utils import mask_aadhar
from core.permissions import check_permission


class StudentBasicSerializer(serializers.ModelSerializer):
    """Basic student information."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    age = serializers.IntegerField(source='get_age', read_only=True)
    current_class = serializers.CharField(source='get_current_enrollment.section.grade_level.name', read_only=True)
    # Alias for current_class - used by attendance module frontend
    class_name = serializers.CharField(source='get_current_enrollment.section.grade_level.name', read_only=True)
    section = serializers.CharField(source='get_current_enrollment.section.name', read_only=True)
    roll_number = serializers.CharField(source='get_current_enrollment.roll_number', read_only=True)
    fee_summary = serializers.SerializerMethodField()
    # Photo URL for frontend display
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'full_name', 'first_name', 'last_name',
            'current_class', 'class_name', 'section', 'roll_number', 'photo', 'photo_url', 'age',
            'date_of_birth', 'blood_group', 'is_active', 'email', 'phone',
            'fee_summary'
        ]
        read_only_fields = ['id', 'full_name', 'age', 'current_class', 'class_name', 'section', 'roll_number', 'photo_url', 'fee_summary']
    
    def get_photo_url(self, obj):
        """Return absolute URL for student photo."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_fee_summary(self, obj):
        """Get fee summary for the student including discount information."""
        try:
            from fees.models import FeeInvoice, FeeAllocation
            from django.db.models import Sum
            
            enrollment = obj.get_current_enrollment()
            if not enrollment:
                return None
            
            academic_year = enrollment.academic_year
            
            # Get fee allocations for discount info
            allocations = FeeAllocation.objects.filter(
                tenant=obj.tenant,
                student=obj,
                academic_year=academic_year,
                is_active=True
            )
            
            discount_amount = sum(
                allocation.amount - allocation.get_final_amount()
                for allocation in allocations
            ) if allocations.exists() else 0
            
            # Get invoices for payment info
            invoices = FeeInvoice.objects.filter(
                tenant=obj.tenant,
                student=obj,
                academic_year=academic_year
            )
            
            total_amount = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
            paid_amount = invoices.aggregate(paid=Sum('paid_amount'))['paid'] or 0
            pending_amount = float(total_amount - paid_amount)
            
            return {
                'total_fee': float(total_amount),
                'paid_amount': float(paid_amount),
                'pending_amount': pending_amount,
                'discount_amount': float(discount_amount)
            }
        except Exception:
            return None


class StudentDetailSerializer(serializers.ModelSerializer):
    """Detailed student information."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    age = serializers.IntegerField(source='get_age', read_only=True)
    siblings_count = serializers.SerializerMethodField()
    aadhar_number_masked = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = '__all__'
        # Tenant is set from the request in the view's `perform_create`.
        # Mark it read-only so serializer validation does not require it in input.
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'age', 'tenant']
        extra_kwargs = {
            'aadhar_number': {'write_only': True}  # Hide in GET responses by default
        }
    
    def get_siblings_count(self, obj):
        return obj.get_siblings().count()
    
    def get_aadhar_number_masked(self, obj):
        """Return masked Aadhar unless user has view_full_aadhar permission."""
        request = self.context.get('request')
        
        # Check if user has permission to view full Aadhar
        if request and request.user:
            if (request.user.is_platform_admin or 
                request.user.is_superuser or 
                check_permission(request.user, 'student_module', 'view_full_aadhar')):
                # Return full Aadhar (already decrypted by EncryptedCharField)
                return obj.aadhar_number
        
        # Return masked Aadhar
        return mask_aadhar(obj.aadhar_number)
    
    def validate_admission_number(self, value):
        """Validate admission number for uniqueness and requirements."""
        request = self.context.get('request')
        if not request:
            return value
        
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return value
        
        try:
            settings = tenant.settings
        except:
            # If settings don't exist, proceed with value as-is
            return value
        
        # If auto-generation is enabled and no value provided, that's OK (will be generated in create)
        if settings.auto_generate_admission_number and not value:
            return value
        
        # If value is provided, check for duplicates
        if value:
            instance_id = self.instance.id if self.instance else None
            is_valid, error_msg = validate_admission_number_unique(
                value, tenant, instance_id
            )
            if not is_valid:
                raise serializers.ValidationError(error_msg)
        
        # If auto-generation is disabled, admission number is required
        if not settings.auto_generate_admission_number and not value:
            raise serializers.ValidationError(
                "Admission number is required. Auto-generation is disabled in settings."
            )
        
        return value
    
    def create(self, validated_data):
        """Auto-generate admission number if enabled and not provided."""
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None) if request else None
        
        if tenant:
            try:
                settings = tenant.settings
                
                # Auto-generate if enabled and not provided
                if settings.auto_generate_admission_number and not validated_data.get('admission_number'):
                    # Get academic year if it's in the data
                    academic_year = validated_data.get('academic_year')
                    generated_number = generate_admission_number(tenant, academic_year)
                    
                    if generated_number:
                        validated_data['admission_number'] = generated_number
            except Exception as e:
                # Log error but don't fail the creation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to auto-generate admission number: {str(e)}")
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """Override to add masked aadhar to output."""
        data = super().to_representation(instance)
        # Remove the write_only aadhar_number and use only masked version
        if 'aadhar_number' in data:
            del data['aadhar_number']
        return data


class StudentRemarkSerializer(serializers.ModelSerializer):
    """Student remark serializer."""
    created_by_name = serializers.SerializerMethodField()
    color_class = serializers.CharField(source='get_color_class', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = StudentRemark
        fields = [
            'id', 'student', 'student_name', 'academic_year', 'academic_year_name', 'remark_type', 'category', 
            'title', 'description', 'created_by_staff', 'created_by_name',
            'visible_to_parent', 'visible_to_student', 'is_important',
            'is_system_generated', 'source_module', 'source_reference',
            'requires_action', 'action_taken', 'action_notes',
            'parent_acknowledged', 'parent_acknowledged_at',
            'attachment', 'created_at', 'updated_at', 'color_class'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'color_class', 'student_name', 'academic_year_name']
    
    def get_created_by_name(self, obj):
        if obj.created_by_staff:
            return obj.created_by_staff.get_full_name()
        return 'System'


class CreateRemarkSerializer(serializers.ModelSerializer):
    """Serializer for creating remarks."""
    
    class Meta:
        model = StudentRemark
        fields = [
            'student', 'academic_year', 'remark_type', 'category', 'title', 'description',
            'visible_to_parent', 'visible_to_student', 'is_important',
            'requires_action', 'attachment'
        ]
    
    def create(self, validated_data):
        # Set created_by_staff from request user
        validated_data['created_by_staff'] = self.context['request'].user
        if not validated_data.get('academic_year'):
            student = validated_data.get('student')
            enrollment = student.get_current_enrollment() if student else None
            if enrollment and enrollment.academic_year:
                validated_data['academic_year'] = enrollment.academic_year
            else:
                request = self.context.get('request')
                tenant = getattr(request, 'tenant', None) if request else None
                if tenant:
                    from tenants.models import AcademicYear
                    active_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                    if active_year:
                        validated_data['academic_year'] = active_year
        return super().create(validated_data)


class StudentDocumentSerializer(serializers.ModelSerializer):
    """Student document serializer."""
    uploaded_by_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = StudentDocument
        fields = [
            'id', 'student', 'academic_year', 'academic_year_name', 'document_type', 'title', 'description',
            'file', 'uploaded_by', 'uploaded_by_name', 'is_verified',
            'verified_by', 'verified_by_name', 'verified_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'verified_by', 'verified_at', 'created_at', 'updated_at', 'academic_year_name']
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None
    
    def get_verified_by_name(self, obj):
        return obj.verified_by.get_full_name() if obj.verified_by else None


class StudentHealthRecordSerializer(serializers.ModelSerializer):
    """Student health record serializer."""
    bmi = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = StudentHealthRecord
        fields = [
            'id', 'student', 'academic_year', 'academic_year_name', 'date', 'height_cm', 'weight_kg', 'bmi',
            'diagnosis', 'treatment', 'prescription', 'allergies',
            'vaccination_name', 'vaccination_date', 'notes',
            'examined_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'bmi', 'created_at', 'updated_at', 'academic_year_name']
    
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
    attendance_details = serializers.DictField(required=False, allow_null=True)
    fee_details = serializers.DictField(required=False, allow_null=True)


class SiblingSerializer(serializers.ModelSerializer):
    """Sibling information serializer."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'admission_number', 'full_name', 'current_class', 'photo']
        read_only_fields = fields


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """Student enrollment serializer."""
    student_full_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    grade_level_name = serializers.CharField(source='section.grade_level.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'tenant', 'student', 'student_full_name', 'student_admission_number',
            'academic_year', 'academic_year_name', 'section', 'section_name', 
            'grade_level_name', 'roll_number', 'status', 'enrollment_date', 
            'exit_date', 'exit_reason', 'total_days', 'present_days', 'absent_days',
            'final_percentage', 'final_grade', 'notes', 'created_at', 'updated_at'
        ]
        # Tenant is set in the view's `perform_create`; make it read-only to avoid
        # validation errors when it's not provided by the client.
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant', 'student_full_name', 
                          'student_admission_number', 'section_name', 'grade_level_name', 
                          'academic_year_name']


class StudentHistorySerializer(serializers.Serializer):
    """Serializer for student change history."""
    history_id = serializers.IntegerField(source='history_id')
    history_date = serializers.DateTimeField()
    history_change_reason = serializers.CharField(allow_null=True)
    history_type = serializers.CharField()
    history_user = serializers.CharField(source='history_user.username', allow_null=True)
    
    # Key student fields at the time of this history record
    admission_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField(allow_null=True)
    phone = serializers.CharField(allow_null=True)
    is_active = serializers.BooleanField()
    
    class Meta:
        fields = [
            'history_id', 'history_date', 'history_change_reason', 
            'history_type', 'history_user', 'admission_number',
            'first_name', 'last_name', 'email', 'phone', 'is_active'
        ]


class ParentCredentialsSerializer(serializers.ModelSerializer):
    """Admin-facing parent credential info (no passwords)."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    students_count = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()
    occupation = serializers.CharField(allow_blank=True, allow_null=True, read_only=True)
    preferred_language = serializers.CharField(read_only=True)

    class Meta:
        model = ParentUser
        fields = [
            'id', 'relation_type', 'portal_access_enabled', 'last_login_at',
            'user_email', 'user_phone', 'user_name', 'students_count', 'students',
            'occupation', 'preferred_language'
        ]
        read_only_fields = fields

    def get_students_count(self, obj):
        return obj.students.filter(is_active=True).count()

    def get_students(self, obj):
        students_data = []
        for student in obj.students.filter(is_active=True):
            enrollment = student.get_current_enrollment()
            students_data.append({
                'id': str(student.id),
                'admission_number': student.admission_number,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'grade_level_name': enrollment.section.grade_level.name if enrollment and enrollment.section else None,
                'section_name': enrollment.section.name if enrollment and enrollment.section else None,
                'photo_url': student.photo.url if student.photo else None
            })
        return students_data

