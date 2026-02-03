"""
Tenant admin configuration for NucleiQ
"""

from django import forms
from django.contrib import admin
from config.admin import admin_site
from users.models import User
from django.conf import settings
from .models import Tenant, TenantBranding, Domain, AcademicYear, TenantSettings

print("DEBUG: Tenants Admin loading...")

class TenantBrandingInline(admin.StackedInline):
    """Inline admin for tenant branding."""
    model = TenantBranding
    extra = 0
    can_delete = False


class DomainInline(admin.TabularInline):
    """Inline admin for tenant domains."""
    model = Domain
    extra = 1


class AcademicYearInline(admin.TabularInline):
    """Inline admin for academic years."""
    model = AcademicYear
    extra = 1
    fields = ('name', 'start_date', 'end_date', 'is_active', 'is_locked')


class TenantUserInlineForm(forms.ModelForm):
    """Custom form for inline user creation with password field."""
    
    password1 = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        required=False,
        help_text='Leave blank for existing users. Required for new users.'
    )
    password2 = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        required=False,
    )
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'is_active', 'is_staff']
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        
        # For new users, password is required
        if not self.instance.pk:
            if password1 and password2:
                if password1 != password2:
                    raise forms.ValidationError("Passwords don't match.")
            elif cleaned_data.get('email'):
                # If email is provided but no password, set unusable password
                pass
        
        return cleaned_data
    
    def save(self, commit=True):
        user = super().save(commit=False)
        password1 = self.cleaned_data.get('password1')
        
        if password1:
            user.set_password(password1)
        elif not user.pk:
            # New user without password - set unusable password
            user.set_unusable_password()
        
        if commit:
            user.save()
        return user


class TenantUserInline(admin.TabularInline):
    """Inline admin to add and view users for the tenant."""
    model = User
    form = TenantUserInlineForm
    fk_name = 'tenant'
    extra = 1  # Show 1 empty form for adding new user
    can_delete = True
    show_change_link = True
    fields = (
        'email', 'first_name', 'last_name', 'phone_number',
        'is_active', 'is_staff', 'password1', 'password2'
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make fields read-only only for existing users, not for new ones."""
        # For existing tenant with users, we show date_joined as info
        return []
    
    def get_queryset(self, request):
        """Return users for this tenant."""
        qs = super().get_queryset(request)
        return qs.filter(is_deleted=False)


class TenantSettingsAdminForm(forms.ModelForm):
    """Custom form for TenantSettings with API version validation."""

    api_module_versions = forms.JSONField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 6, 'cols': 80}),
        help_text=(
            "JSON object of per-module overrides, e.g. {\"students\": \"v2\", \"fees\": \"v1\"}."
        )
    )

    class Meta:
        model = TenantSettings
        fields = '__all__'

    def clean_api_default_version(self):
        value = self.cleaned_data.get('api_default_version')
        allowed_versions = settings.REST_FRAMEWORK.get('ALLOWED_VERSIONS', [])
        if allowed_versions and value not in allowed_versions:
            raise forms.ValidationError(
                f"Invalid version '{value}'. Allowed: {allowed_versions}"
            )
        return value

    def clean_api_module_versions(self):
        value = self.cleaned_data.get('api_module_versions')
        if value in (None, ''):
            return {}

        if not isinstance(value, dict):
            raise forms.ValidationError("api_module_versions must be a JSON object")

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
            raise forms.ValidationError(
                f"Invalid module keys: {sorted(invalid_modules)}"
            )

        if invalid_versions:
            raise forms.ValidationError(
                f"Invalid module versions: {invalid_versions}. Allowed: {allowed_versions}"
            )

        return value




class TenantAdminForm(forms.ModelForm):
    """Custom form for Tenant admin with checkbox selection for modules."""
    
    # Selection field for modules
    module_selection = forms.MultipleChoiceField(
        choices=Tenant.AVAILABLE_MODULES,
        widget=forms.CheckboxSelectMultiple(attrs={
            'class': 'module-checkbox-list'
        }),
        required=False,
        label="Module Access Control",
        help_text="Select modules for this tenant. Basic modules are always included."
    )
    
    class Meta:
        model = Tenant
        fields = ['name', 'subdomain', 'plan', 'is_active', 'admin_email', 'admin_phone', 
                 'max_students', 'max_staff', 'trial_ends_at', 'subscription_starts_at', 
                 'subscription_ends_at', 'session_timeout_minutes', 'refresh_timeout_days', 
                 'admin_session_timeout_minutes', 'metadata']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-select the enabled modules
        if self.instance and self.instance.pk:
            self.initial['module_selection'] = self.instance.get_all_enabled_modules()
        else:
            self.initial['module_selection'] = Tenant.BASIC_MODULES
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.enabled_modules = self.cleaned_data.get('module_selection', [])
        if commit:
            instance.save()
        return instance


@admin.register(Tenant, site=admin_site)
class TenantAdmin(admin.ModelAdmin):
    """Admin interface for Tenant model."""
    
    form = TenantAdminForm
    change_form_template = 'admin/tenants/tenant/change_form.html'
    
    list_display = (
        'name', 'subdomain', 'plan', 'is_active', 
        'admin_email', 'module_count', 'created_at'
    )
    list_filter = ('plan', 'is_active', 'created_at')
    search_fields = ('name', 'subdomain', 'admin_email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'subdomain', 'is_active', 'module_selection')
        }),
        ('Contact Information', {
            'fields': ('admin_email', 'admin_phone')
        }),
        ('Subscription & Limits', {
            'fields': (
                'plan', 'trial_ends_at', 
                'subscription_starts_at', 'subscription_ends_at',
                'max_students', 'max_staff'
            )
        }),
        ('Advanced Configuration', {
            'fields': (
                'session_timeout_minutes',
                'refresh_timeout_days',
                'admin_session_timeout_minutes',
                'metadata'
            ),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [DomainInline]

    def _is_edit_mode(self, request):
        return request.GET.get('edit') == '1'

    def has_change_permission(self, request, obj=None):
        perm = super().has_change_permission(request, obj=obj)
        if not perm:
            return False

        # Allow view access always; restrict POST to edit mode.
        if request.method in ('POST', 'PUT', 'PATCH'):
            return self._is_edit_mode(request)
        return True

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj=obj))

        # View-only mode: make all fields read-only.
        if obj and not self._is_edit_mode(request):
            # Include form fields and explicit extras
            form_fields = list(getattr(self.form, '_meta', {}).fields or [])
            readonly.extend(form_fields)
            readonly.append('module_selection')

        # De-duplicate while preserving order
        seen = set()
        deduped = []
        for field in readonly:
            if field not in seen:
                deduped.append(field)
                seen.add(field)
        return deduped

    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        is_edit_mode = self._is_edit_mode(request)

        if not is_edit_mode:
            extra_context.update({
                'show_save': False,
                'show_save_and_continue': False,
                'show_save_and_add_another': False,
                'show_delete': False,
                'is_view_mode': True,
            })
        else:
            extra_context['is_view_mode'] = False

        if is_edit_mode and not form_url:
            form_url = '?edit=1'

        return super().change_view(request, object_id, form_url=form_url, extra_context=extra_context)
    
    def module_count(self, obj):
        """Display count of enabled modules."""
        modules = obj.get_all_enabled_modules()
        return f"{len(modules)} / {len(Tenant.AVAILABLE_MODULES)}"
    module_count.short_description = 'Modules'

    def module_selection(self, obj):
        """Display enabled modules in view-only mode."""
        if not obj:
            return "—"
        modules = obj.get_all_enabled_modules()
        return ", ".join(modules) if modules else "—"
    module_selection.short_description = 'Module Access Control'
    
    def response_add(self, request, obj, post_url_continue=None):
        """
        Override response after adding a new tenant.
        If a user was auto-created via signal, redirect to set their password.
        """
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        from django.contrib import messages
        
        # Check if signal created an admin user
        created_user_id = getattr(obj, '_created_admin_user_id', None)
        
        if created_user_id:
            # Inform admin about the auto-created user
            messages.success(
                request,
                f"Tenant '{obj.name}' created successfully! "
                f"An admin user was auto-created with email '{obj.admin_email}'. "
                f"Please set a password for this user now."
            )
            
            # Redirect to password change form for the new user
            try:
                password_change_url = reverse('admin:users_user_password_change', args=[created_user_id])
                return HttpResponseRedirect(password_change_url)
            except Exception:
                # Fallback: redirect to user edit page
                try:
                    user_change_url = reverse('admin:users_user_change', args=[created_user_id])
                    return HttpResponseRedirect(user_change_url)
                except Exception:
                    pass
        
        # Default behavior
        return super().response_add(request, obj, post_url_continue)
    
    class Media:
        css = {
            'all': ('admin/css/module_access.css',)
        }


@admin.register(TenantBranding, site=admin_site)
class TenantBrandingAdmin(admin.ModelAdmin):
    """Admin interface for TenantBranding model."""
    
    list_display = ('tenant', 'school_name', 'primary_color', 'created_at')
    search_fields = ('tenant__name', 'school_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Tenant Link', {
            'fields': ('tenant',)
        }),
        ('School Identity', {
            'fields': ('school_name', 'school_address', 'school_phone', 'school_email')
        }),
        ('Visual Branding', {
            'fields': (
                'logo_url', 'favicon_url', 
                'login_background_url', 'email_header_image',
                'primary_color', 'secondary_color', 'sidebar_color',
                'font_family'
            )
        }),
        ('Icons & Themes', {
            'fields': ('icon_theme', 'icon_set')
        }),
        ('Documents', {
            'fields': ('receipt_copies', 'receipt_footer_text')
        }),
        ('Advanced', {
            'fields': ('gallery_images', 'custom_css'),
            'classes': ('collapse',)
        }),
    )


# Do not register on default admin.site to avoid conflicts
# The custom NucleiQ admin site already handles registration via decoarators.

admin_site.register(Domain)
admin_site.register(AcademicYear)


@admin.register(TenantSettings, site=admin_site)
class TenantSettingsAdmin(admin.ModelAdmin):
    """Admin interface for TenantSettings (platform admin)."""

    form = TenantSettingsAdminForm
    list_display = ('tenant', 'api_default_version', 'updated_at')
    search_fields = ('tenant__name', 'tenant__subdomain')
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        ('Tenant', {'fields': ('tenant',)}),
        ('API Versioning', {
            'fields': ('api_default_version', 'api_module_versions')
        }),
        ('Academic Settings', {
            'fields': ('academic_year_format', 'term_system', 'grading_system')
        }),
        ('Fee Settings', {
            'fields': (
                'fee_currency', 'fee_currency_symbol', 'late_fee_enabled',
                'late_fee_amount', 'late_fee_percentage', 'grace_period_days'
            )
        }),
        ('Attendance Settings', {
            'fields': (
                'attendance_marking_time', 'attendance_lock_days',
                'minimum_attendance_percentage', 'late_arrival_threshold_minutes'
            )
        }),
        ('Exam Settings', {
            'fields': ('result_publish_delay_days', 'allow_online_exams', 'exam_proctoring_enabled')
        }),
        ('Student Admission Settings', {
            'fields': (
                'auto_generate_admission_number', 'admission_number_format',
                'admission_number_prefix', 'admission_number_sequence'
            )
        }),
        ('Email Configuration', {
            'fields': ('email_enabled', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_use_tls', 'from_email')
        }),
        ('SMS Configuration', {
            'fields': ('sms_enabled', 'sms_provider', 'sms_sender_id')
        }),
        ('WhatsApp Configuration', {
            'fields': ('whatsapp_enabled',)
        }),
        ('Security Settings', {
            'fields': (
                'password_min_length', 'password_require_uppercase', 'password_require_lowercase',
                'password_require_numbers', 'password_require_special', 'session_timeout_minutes',
                'max_login_attempts', 'lockout_duration_minutes', 'two_factor_auth_required'
            )
        }),
        ('Backup Settings', {
            'fields': ('auto_backup_enabled', 'backup_frequency_days', 'backup_retention_days')
        }),
        ('Maintenance Mode', {
            'fields': ('maintenance_mode', 'maintenance_message')
        }),
        ('Additional Settings', {
            'fields': ('custom_settings',)
        }),
    )
