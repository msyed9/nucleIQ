"""
NucleiQ Custom Admin Site Configuration
A modern, enhanced admin interface with improved UX and organization
"""

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.models import Group
from django.db import models
from django.urls import path
from django.utils.translation import gettext_lazy as _


# App display configuration with icons and descriptions
APP_CONFIG = {
    'analytics': {
        'name': '📊 Analytics',
        'order': 1,
        'description': 'Platform analytics and reports'
    },
    'tenants': {
        'name': '🏫 Tenants & Schools',
        'order': 2,
        'description': 'Manage schools and institutions'
    },
    'users': {
        'name': '👥 Users & Accounts',
        'order': 3,
        'description': 'User management and authentication'
    },
    'data_management': {
        'name': '📁 Data Management',
        'order': 4,
        'description': '10-Year migration and data import/export'
    },
    'billing': {
        'name': '💳 Billing & Subscriptions',
        'order': 5,
        'description': 'Subscription plans and payments'
    },
    'students': {
        'name': '🎓 Students',
        'order': 6,
        'description': 'Student records and enrollment'
    },
    'staff': {
        'name': '👨‍🏫 Staff',
        'order': 7,
        'description': 'Teachers and staff management'
    },
    'attendance': {
        'name': '📋 Attendance',
        'order': 8,
        'description': 'Daily attendance tracking'
    },
    'fees': {
        'name': '💰 Fees',
        'order': 9,
        'description': 'Fee structure and collection'
    },
    'finance': {
        'name': '📈 Finance',
        'order': 10,
        'description': 'Financial reports and ledger'
    },
    'academics': {
        'name': '📚 Academics',
        'order': 11,
        'description': 'Curriculum and subjects'
    },
    'exams': {
        'name': '📝 Examinations',
        'order': 12,
        'description': 'Exams and grading'
    },
    'timetable': {
        'name': '🗓️ Timetable',
        'order': 13,
        'description': 'Class schedules'
    },
    'idcards': {
        'name': '🪪 ID Cards',
        'order': 14,
        'description': 'Student and staff ID cards'
    },
    'communication': {
        'name': '📢 Communication',
        'order': 15,
        'description': 'Messages and notifications'
    },
    'transport': {
        'name': '🚌 Transport',
        'order': 16,
        'description': 'Bus routes and tracking'
    },
    'library': {
        'name': '📖 Library',
        'order': 17,
        'description': 'Book inventory and loans'
    },
    'hostel': {
        'name': '🏠 Hostel',
        'order': 18,
        'description': 'Hostel room management'
    },
    'inventory': {
        'name': '📦 Inventory',
        'order': 19,
        'description': 'Assets and supplies'
    },
    'hr': {
        'name': '👔 Human Resources',
        'order': 20,
        'description': 'HR and employee management'
    },
    'payroll': {
        'name': '💵 Payroll',
        'order': 21,
        'description': 'Salary processing'
    },
    'certificates': {
        'name': '📜 Certificates',
        'order': 22,
        'description': 'Certificate generation'
    },
    'reports': {
        'name': '📑 Reports',
        'order': 23,
        'description': 'Custom report builder'
    },
    'dashboard': {
        'name': '📊 Dashboard',
        'order': 24,
        'description': 'Dashboard widgets'
    },
    'security': {
        'name': '🔒 Security',
        'order': 25,
        'description': 'Access control and logs'
    },
    'helpdesk': {
        'name': '🎧 Helpdesk',
        'order': 26,
        'description': 'Support tickets'
    },
    'crm': {
        'name': '🤝 CRM',
        'order': 27,
        'description': 'Admissions and leads'
    },
    'cms': {
        'name': '🌐 CMS',
        'order': 28,
        'description': 'Website content'
    },
    'lms': {
        'name': '💻 LMS',
        'order': 29,
        'description': 'Learning management'
    },
    'placement': {
        'name': '🎯 Placement',
        'order': 30,
        'description': 'Career placement'
    },
    'salah_tracker': {
        'name': '🕌 Salah Tracker',
        'order': 31,
        'description': 'Prayer time tracking'
    },
    'habit_tracker': {
        'name': '✅ Habit Tracker',
        'order': 32,
        'description': 'Habit building'
    },
    'auth': {
        'name': '🔐 Authentication',
        'order': 99,
        'description': 'Django auth system'
    },
    'simple_history': {
        'name': '📜 Audit History',
        'order': 100,
        'description': 'Change history tracking'
    },
    'django_celery_beat': {
        'name': '⏰ Scheduled Tasks',
        'order': 101,
        'description': 'Celery periodic tasks'
    },
    'django_celery_results': {
        'name': '📋 Task Results',
        'order': 102,
        'description': 'Celery task results'
    },
    'token_blacklist': {
        'name': '🚫 Token Blacklist',
        'order': 103,
        'description': 'JWT token management'
    },
}


class NucleiQAdminSite(AdminSite):
    """
    Custom admin site with enhanced UI/UX features:
    - Modern dark theme with glassmorphism
    - Reorganized app list with icons
    - Dashboard statistics
    - Quick action links
    """
    
    site_header = 'NucleiQ Platform Administration'
    site_title = 'NucleiQ Admin'
    index_title = 'Platform Management Dashboard'
    
    # Disable built-in nav sidebar since we have custom app list in index.html
    # This prevents duplicate menu display
    enable_nav_sidebar = False
    
    def get_urls(self):
        """Add custom URL patterns to admin"""
        from data_management.admin_views import (
            migration_wizard, download_template, upload_preview,
            execute_import, import_result, import_history,
            rollback_import, template_library, export_center
        )
        
        urls = super().get_urls()
        custom_urls = [
            # Platform Analytics
            path('analytics/platform-dashboard/', 
                 self.admin_view(self.platform_analytics_view),
                 name='platform_analytics_dashboard'),
            # Data Migration Wizard
            path('data-migration/', 
                 self.admin_view(migration_wizard),
                 name='migration_wizard'),
            path('data-migration/download-template/', 
                 self.admin_view(download_template),
                 name='download_template'),
            path('data-migration/upload-preview/', 
                 self.admin_view(upload_preview),
                 name='upload_preview'),
            path('data-migration/execute/', 
                 self.admin_view(execute_import),
                 name='execute_import'),
            path('data-migration/result/<uuid:job_id>/', 
                 self.admin_view(import_result),
                 name='import_result'),
            path('data-migration/history/', 
                 self.admin_view(import_history),
                 name='import_history'),
            path('data-migration/rollback/<uuid:job_id>/', 
                 self.admin_view(rollback_import),
                 name='rollback_import'),
            path('data-migration/templates/', 
                 self.admin_view(template_library),
                 name='template_library'),
              path('data-migration/export/',
                  self.admin_view(export_center),
                  name='export_center'),
        ]
        return custom_urls + urls
    
    def platform_analytics_view(self, request):
        """View for platform analytics dashboard"""
        from analytics.views import platform_analytics_dashboard
        return platform_analytics_dashboard(request)
    
    def get_app_list(self, request, app_label=None):
        """
        Return a sorted list of all the installed apps that have been
        registered in this site, with enhanced display names and icons.
        """
        app_dict = self._build_app_dict(request, app_label)
        # Remove backend data_management from the admin app list
        # (we want this functionality available via frontend / other views,
        #  but not shown as a top-level app in the custom Django admin)
        app_dict.pop('data_management', None)

        # Enhance app names with icons and sort by custom order
        for app_label_key, app_data in app_dict.items():
            config = APP_CONFIG.get(app_label_key, {})
            if config.get('name'):
                app_data['name'] = config['name']
        
        # Sort apps according to custom order
        app_list = sorted(app_dict.values(), key=lambda x: (
            APP_CONFIG.get(x['app_label'], {}).get('order', 999),
            x['name'].lower()
        ))
        
        return app_list
    
    def index(self, request, extra_context=None):
        """
        Custom admin index with statistics and dashboard cards.
        """
        from students.models import Student
        from staff.models import Staff
        from fees.models import FeeTransaction
        from tenants.models import Tenant
        
        extra_context = extra_context or {}
        
        # Add link to platform analytics dashboard
        extra_context['show_platform_analytics'] = request.user.is_superuser
        extra_context['show_changelinks'] = True
        
        # Fetch statistics with error handling
        try:
            extra_context['total_students'] = Student.objects.filter(is_deleted=False).count()
        except Exception:
            extra_context['total_students'] = 0
            
        try:
            extra_context['total_staff'] = Staff.objects.filter(is_deleted=False).count()
        except Exception:
            extra_context['total_staff'] = 0
            
        try:
            pending_fees = FeeTransaction.objects.filter(
                status='pending'
            ).aggregate(total=models.Sum('amount'))['total']
            extra_context['pending_fees'] = pending_fees or 0
        except Exception:
            extra_context['pending_fees'] = 0
            
        try:
            extra_context['active_tenants'] = Tenant.objects.filter(is_active=True).count()
        except Exception:
            extra_context['active_tenants'] = 0
        
        return super().index(request, extra_context)
    
    def each_context(self, request):
        """
        Add extra context that is available on every admin page.
        """
        context = super().each_context(request)
        # Add flag to show change links in the app list
        context['show_changelinks'] = True
        return context


# Create custom admin site instance
admin_site = NucleiQAdminSite(name='nucleiq_admin')


# Register Django's built-in admin site changes
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass

# Apply custom styling to default admin site as well
admin.site.site_header = 'NucleiQ Platform Administration'
admin.site.site_title = 'NucleiQ Admin'
admin.site.index_title = 'Platform Management Dashboard'
