from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.models import Group
from django.db import models

class NucleIQAdminSite(AdminSite):
    site_header = 'NucleIQ Administration'
    site_title = 'NucleIQ Admin'
    index_title = 'School Management Dashboard'
    
    def get_app_list(self, request):
        """
        Return a sorted list of all the installed apps that have been
        registered in this site.
        """
        app_dict = self._build_app_dict(request)
        
        # Define custom ordering
        app_order = [
            'tenants',
            'users',
            'students',
            'staff',
            'attendance',
            'fees',
            'finance',
            'dashboard',
            'idcards',
            'billing',
            'auth',
        ]
        
        # Sort apps according to custom order
        app_list = sorted(app_dict.values(), key=lambda x: (
            app_order.index(x['app_label']) if x['app_label'] in app_order else 999,
            x['name'].lower()
        ))
        
        return app_list
    
    def index(self, request, extra_context=None):
        """
        Custom admin index with statistics
        """
        from students.models import Student
        from staff.models import Staff
        from fees.models import FeeTransaction
        from tenants.models import Tenant
        
        extra_context = extra_context or {}
        
        try:
            extra_context['total_students'] = Student.objects.filter(is_deleted=False).count()
        except:
            extra_context['total_students'] = 0
            
        try:
            extra_context['total_staff'] = Staff.objects.filter(is_deleted=False).count()
        except:
            extra_context['total_staff'] = 0
            
        try:
            pending_fees = FeeTransaction.objects.filter(
                status='pending'
            ).aggregate(total=models.Sum('amount'))['total']
            extra_context['pending_fees'] = pending_fees or 0
        except:
            extra_context['pending_fees'] = 0
            
        try:
            extra_context['active_tenants'] = Tenant.objects.filter(is_active=True).count()
        except:
            extra_context['active_tenants'] = 0
        
        return super().index(request, extra_context)

# Create custom admin site instance
admin_site = NucleIQAdminSite(name='nucleiq_admin')

# Hide unwanted models
try:
    admin.site.unregister(Group)
except:
    pass
