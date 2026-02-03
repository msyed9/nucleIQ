from rest_framework import serializers
from django.conf import settings
from .models import AcademicYear, GradeLevel, Section, Department, Holiday, TenantSettings, TenantBranding, Subject, ClassSubject

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

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassSubject
        fields = [
            'id', 'tenant',
            'academic_year', 'academic_year_name',
            'grade_level', 'grade_level_name',
            'subject', 'subject_name', 'subject_code',
            'is_mandatory', 'is_elective',
            'teacher', 'teacher_name',
            'weekly_periods', 'total_marks', 'passing_marks',
            'display_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at', 'academic_year_name', 'grade_level_name', 'subject_name', 'subject_code', 'teacher_name']

    def get_teacher_name(self, obj):
        teacher = getattr(obj, 'teacher', None)
        if not teacher:
            return None
        first_name = getattr(teacher, 'first_name', '') or ''
        last_name = getattr(teacher, 'last_name', '') or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name or getattr(teacher, 'username', None) or getattr(teacher, 'email', None)

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
            # API Versioning Settings
            'api_default_version', 'api_module_versions',
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

    def validate_api_default_version(self, value):
        allowed_versions = settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS', [])
        if allowed_versions and value not in allowed_versions:
            raise serializers.ValidationError(
                f"Invalid version '{value}'. Allowed: {allowed_versions}"
            )
        return value

    def validate_api_module_versions(self, value):
        if value is None:
            return {}

        if not isinstance(value, dict):
            raise serializers.ValidationError("api_module_versions must be a JSON object")

        allowed_versions = settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS', [])
        allowed_modules = getattr(settings, 'API_VERSION_ALLOWED_MODULES', [])

        invalid_modules = []
        invalid_versions = []

        for module_key, version in value.items():
            if allowed_modules and module_key not in allowed_modules:
                invalid_modules.append(module_key)
            if allowed_versions and version not in allowed_versions:
                invalid_versions.append({module_key: version})

        if invalid_modules:
            raise serializers.ValidationError(
                f"Invalid module keys: {sorted(invalid_modules)}"
            )

        if invalid_versions:
            raise serializers.ValidationError(
                f"Invalid module versions: {invalid_versions}. Allowed: {allowed_versions}"
            )

        return value


class TenantBrandingSerializer(serializers.ModelSerializer):
    """
    Serializer for TenantBranding model.
    Allows tenants to customize their branding.
    Includes enabled_modules from the parent Tenant model for frontend access control.
    Handles multipart file uploads and returns absolute URLs for images.
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    enabled_modules = serializers.SerializerMethodField()
    
    # Computed URL fields for uploaded images (with fallback to legacy URL fields)
    small_logo_url = serializers.SerializerMethodField()
    large_logo_url = serializers.SerializerMethodField()
    square_logo_url = serializers.SerializerMethodField()
    login_banner_url = serializers.SerializerMethodField()
    dashboard_banner_url = serializers.SerializerMethodField()
    report_header_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantBranding
        fields = [
            'id', 'tenant', 'tenant_name',
            # School Information
            'school_name', 'school_address', 'school_phone', 'school_email',
            # New Image Fields (file uploads)
            'small_logo', 'large_logo', 'square_logo',
            'login_banner', 'dashboard_banner', 'report_header',
            # Computed URL fields (with fallback logic)
            'small_logo_url', 'large_logo_url', 'square_logo_url',
            'login_banner_url', 'dashboard_banner_url', 'report_header_url',
            # Legacy URL Fields
            'logo_url', 'favicon_url', 'login_background_url', 'email_header_image',
            # Colors
            'primary_color', 'secondary_color', 'sidebar_color',
            # Typography
            'font_family',
            # Icon/UI Theme
            'icon_theme', 'icon_set',
            # Gallery
            'gallery_images',
            # Receipt Configuration
            'receipt_copies', 'receipt_footer_text',
            # Custom CSS
            'custom_css',
            # Module Access Control
            'enabled_modules',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at', 'enabled_modules',
                           'small_logo_url', 'large_logo_url', 'square_logo_url',
                           'login_banner_url', 'dashboard_banner_url', 'report_header_url']
    
    def _get_absolute_url(self, image_field):
        """Helper to get absolute URL for an ImageField."""
        if not image_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(image_field.url)
        # Fallback: return relative URL
        return image_field.url
    
    def get_enabled_modules(self, obj):
        """Get enabled modules from the tenant."""
        if obj.tenant:
            return obj.tenant.get_all_enabled_modules()
        return ['dashboard', 'settings', 'users', 'students']  # Default basic modules
    
    def get_small_logo_url(self, obj):
        """
        Get small logo URL with fallback chain:
        1. Uploaded small_logo
        2. Legacy logo_url
        3. None
        """
        if obj.small_logo:
            return self._get_absolute_url(obj.small_logo)
        if obj.logo_url:
            return obj.logo_url
        return None
    
    def get_large_logo_url(self, obj):
        """
        Get large logo URL with fallback chain:
        1. Uploaded large_logo
        2. Uploaded small_logo
        3. Legacy logo_url
        4. None
        """
        if obj.large_logo:
            return self._get_absolute_url(obj.large_logo)
        if obj.small_logo:
            return self._get_absolute_url(obj.small_logo)
        if obj.logo_url:
            return obj.logo_url
        return None
    
    def get_square_logo_url(self, obj):
        """
        Get square logo URL with fallback chain:
        1. Uploaded square_logo
        2. Legacy favicon_url
        3. None
        """
        if obj.square_logo:
            return self._get_absolute_url(obj.square_logo)
        if obj.favicon_url:
            return obj.favicon_url
        return None
    
    def get_login_banner_url(self, obj):
        """
        Get login banner URL with fallback chain:
        1. Uploaded login_banner
        2. Legacy login_background_url
        3. None
        """
        if obj.login_banner:
            return self._get_absolute_url(obj.login_banner)
        if obj.login_background_url:
            return obj.login_background_url
        return None
    
    def get_dashboard_banner_url(self, obj):
        """Get dashboard banner URL."""
        if obj.dashboard_banner:
            return self._get_absolute_url(obj.dashboard_banner)
        return None
    
    def get_report_header_url(self, obj):
        """
        Get report header URL with fallback chain:
        1. Uploaded report_header
        2. Uploaded large_logo
        3. Legacy logo_url
        4. None
        """
        if obj.report_header:
            return self._get_absolute_url(obj.report_header)
        if obj.large_logo:
            return self._get_absolute_url(obj.large_logo)
        if obj.logo_url:
            return obj.logo_url
        return None


