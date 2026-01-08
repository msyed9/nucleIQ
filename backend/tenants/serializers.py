from rest_framework import serializers
from .models import AcademicYear, GradeLevel, Section, Department, Holiday, TenantSettings, TenantBranding

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class GradeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeLevel
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    
    class Meta:
        model = Section
        fields = '__all__'

class HolidaySerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Holiday
        fields = [
            'id', 'name', 'holiday_type', 'start_date', 'end_date',
            'description', 'is_attendance_blocked', 'applies_to_students',
            'applies_to_staff', 'color', 'academic_year', 'academic_year_name',
            'duration_days', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_duration_days(self, obj):
        return obj.get_duration_days()


class TenantSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for TenantSettings model.
    Handles all tenant-level configuration settings.
    """
    password_policy = serializers.SerializerMethodField()
    notification_config = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantSettings
        fields = [
            'id', 'tenant',
            # Academic Settings
            'academic_year_format', 'term_system', 'grading_system',
            # Fee Settings
            'fee_currency', 'fee_currency_symbol', 'late_fee_enabled',
            'late_fee_amount', 'late_fee_percentage', 'grace_period_days',
            # Attendance Settings
            'attendance_marking_time', 'attendance_lock_days',
            'minimum_attendance_percentage', 'late_arrival_threshold_minutes',
            # Exam Settings
            'result_publish_delay_days', 'allow_online_exams', 'exam_proctoring_enabled',
            # Student Admission Settings
            'auto_generate_admission_number', 'admission_number_format',
            'admission_number_prefix', 'admission_number_sequence',
            # Email Configuration
            'email_enabled', 'smtp_host', 'smtp_port', 'smtp_username',
            'smtp_use_tls', 'from_email',
            # SMS Configuration
            'sms_enabled', 'sms_provider', 'sms_sender_id',
            # WhatsApp Configuration
            'whatsapp_enabled',
            # Security Settings
            'password_min_length', 'password_require_uppercase',
            'password_require_lowercase', 'password_require_numbers',
            'password_require_special', 'session_timeout_minutes',
            'max_login_attempts', 'lockout_duration_minutes',
            'two_factor_auth_required',
            # Backup Settings
            'auto_backup_enabled', 'backup_frequency_days', 'backup_retention_days',
            # Maintenance Mode
            'maintenance_mode', 'maintenance_message',
            # Additional
            'custom_settings',
            # Computed fields
            'password_policy', 'notification_config',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'sms_api_key': {'write_only': True},
            'whatsapp_api_key': {'write_only': True},
        }
    
    def get_password_policy(self, obj):
        """Get password policy as a dictionary."""
        return obj.get_password_policy()
    
    def get_notification_config(self, obj):
        """Get notification configuration."""
        return obj.get_notification_config()


class TenantBrandingSerializer(serializers.ModelSerializer):
    """
    Serializer for TenantBranding model.
    Allows tenants to customize their branding.
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TenantBranding
        fields = [
            'id', 'tenant', 'tenant_name',
            # School Information
            'school_name', 'school_address', 'school_phone', 'school_email',
            # Visual Assets
            'logo_url', 'favicon_url', 'login_background_url', 'email_header_image',
            # Colors
            'primary_color', 'secondary_color', 'sidebar_color',
            # Typography
            'font_family',
            # Gallery
            'gallery_images',
            # Receipt Configuration
            'receipt_copies', 'receipt_footer_text',
            # Custom CSS
            'custom_css',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']


