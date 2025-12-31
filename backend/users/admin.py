"""
Django Admin configuration for Users app with password change functionality
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.utils.translation import gettext_lazy as _
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils.html import format_html
from config.admin import admin_site

from .models import (
    User, UserPreference, Role, Permission,
    RolePermission, UserRole, ImpersonationLog
)


@admin.register(User, site=admin_site)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model with password change functionality."""
    
    change_password_form = AdminPasswordChangeForm
    
    list_display = [
        'email', 'first_name', 'last_name', 'tenant',
        'is_active', 'is_platform_admin', 'password_change_link', 'date_joined'
    ]
    list_filter = [
        'is_active', 'is_platform_admin',
        'is_staff', 'tenant'
    ]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {
            'fields': ('first_name', 'last_name', 'phone_number', 'avatar_url')
        }),
        (_('Tenant'), {'fields': ('tenant',)}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_platform_admin'),
        }),
        (_('Security'), {
            'fields': ('is_2fa_enabled', 'last_login_ip'),
            'classes': ('collapse',)
        }),
        (_('Important dates'), {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'tenant'),
        }),
    )
    
    def password_change_link(self, obj):
        """Add a password change link in the list view"""
        url = reverse('admin:auth_user_password_change', args=[obj.pk])
        return format_html(
            '<a class="button" href="{}">Change Password</a>',
            url
        )
    password_change_link.short_description = 'Password'
    
    def get_urls(self):
        """Add custom URL for password change"""
        urls = super().get_urls()
        custom_urls = [
            path(
                '<id>/password/',
                self.admin_site.admin_view(self.user_change_password),
                name='auth_user_password_change',
            ),
        ]
        return custom_urls + urls
    
    def user_change_password(self, request, id, form_url=''):
        """Custom view for changing user password"""
        from django.http import Http404
        
        user = self.get_object(request, id)
        if user is None:
            raise Http404
        
        if request.method == 'POST':
            form = self.change_password_form(user, request.POST)
            if form.is_valid():
                form.save()
                change_message = self.construct_change_message(request, form, None)
                self.log_change(request, user, change_message)
                messages.success(
                    request,
                    f'Password changed successfully for {user.email}.'
                )
                return redirect('admin:users_user_changelist')
        else:
            form = self.change_password_form(user)
        
        fieldsets = [(None, {'fields': list(form.base_fields)})]
        adminForm = admin.helpers.AdminForm(form, fieldsets, {})
        
        context = {
            'title': f'Change password: {user.email}',
            'adminForm': adminForm,
            'form_url': form_url,
            'form': form,
            'is_popup': False,
            'add': False,
            'change': True,
            'has_delete_permission': False,
            'has_change_permission': True,
            'has_add_permission': False,  # Added missing key
            'has_view_permission': True,  # Added missing key
            'has_absolute_url': False,
            'has_file_field': False,  # Added missing key
            'has_editable_inline_admin_formsets': False,  # Added missing key
            'opts': self.model._meta,
            'original': user,
            'save_as': False,
            'show_save': True,
            'show_delete': False,  # Added missing key
            'show_save_and_continue': False,  # Added missing key
            'show_save_and_add_another': False,  # Added missing key
            'show_close': False,  # Added missing key
        }
        
        return render(
            request,
            'admin/auth/user/change_password.html',
            context
        )
    
    def get_queryset(self, request):
        """Platform admins see all users. Tenant admins see only their tenant's users."""
        qs = super().get_queryset(request)
        if request.user.is_platform_admin:
            return qs
        if hasattr(request.user, 'tenant') and request.user.tenant:
            return qs.filter(tenant=request.user.tenant)
        return qs.none()
    
    def has_delete_permission(self, request, obj=None):
        """Only platform admins can delete users"""
        return request.user.is_platform_admin


@admin.register(Role, site=admin_site)
class RoleAdmin(admin.ModelAdmin):
    """Admin interface for Role model."""
    
    list_display = ['name', 'code', 'tenant', 'is_active', 'created_at']
    list_filter = ['is_active', 'tenant']
    search_fields = ['name', 'code', 'description']
    
    fieldsets = (
        (None, {'fields': ('name', 'code', 'description', 'tenant')}),
        (_('Status'), {'fields': ('is_active',)}),
    )
    
    def get_queryset(self, request):
        """Filter by tenant"""
        qs = super().get_queryset(request)
        if request.user.is_platform_admin:
            return qs
        if hasattr(request.user, 'tenant') and request.user.tenant:
            return qs.filter(tenant=request.user.tenant)
        return qs.none()


# Don't register these (internal/technical models):
# - UserPreference
# - Permission
# - RolePermission
# - UserRole
# - ImpersonationLog
