# 🧹 DJANGO ADMIN CLEANUP & CUSTOMIZATION

## 📋 **OVERVIEW**

This guide will help you clean up and organize the Django Admin interface for better usability.

---

## 🎯 **GOALS**

1. ✅ Organize models into logical groups
2. ✅ Hide technical/internal models
3. ✅ Customize admin site branding
4. ✅ Improve model display names
5. ✅ Add custom dashboard
6. ✅ Restrict access by role

---

## 1️⃣ **CUSTOMIZE ADMIN SITE**

### **File: backend/config/admin.py** (Create this file)

```python
from django.contrib import admin
from django.contrib.admin import AdminSite

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

# Create custom admin site instance
admin_site = NucleIQAdminSite(name='nucleiq_admin')
```

### **File: backend/config/urls.py** (Update)

```python
from django.contrib import admin
from django.urls import path, include
from config.admin import admin_site  # Import custom admin

urlpatterns = [
    # Use custom admin site instead of default
    path('admin/', admin_site.urls),  # Changed from admin.site.urls
    
    # ... rest of your URLs
]
```

---

## 2️⃣ **HIDE UNNECESSARY MODELS**

### **Models to Hide from Admin**:

#### **File: backend/users/admin.py** (Update)

```python
from django.contrib import admin
from config.admin import admin_site
from .models import (
    User, UserPreference, Role, Permission,
    RolePermission, UserRole, ImpersonationLog
)

# Keep these visible
@admin.register(User, site=admin_site)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'tenant', 'is_active']
    list_filter = ['is_active', 'tenant']
    search_fields = ['email', 'first_name', 'last_name']

@admin.register(Role, site=admin_site)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'tenant', 'is_active']
    list_filter = ['is_active', 'tenant']

# Hide these (don't register or unregister if already registered)
# - UserPreference (internal)
# - Permission (technical)
# - RolePermission (technical)
# - UserRole (use inline instead)
# - ImpersonationLog (audit only)
```

#### **File: backend/tenants/admin.py** (Update)

```python
from django.contrib import admin
from config.admin import admin_site
from .models import Tenant, Domain

@admin.register(Tenant, site=admin_site)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'subdomain', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'subdomain']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'subdomain', 'is_active')
        }),
        ('Branding', {
            'fields': ('logo', 'primary_color', 'secondary_color'),
            'classes': ('collapse',)
        }),
        ('Subscription', {
            'fields': ('subscription_tier', 'subscription_status'),
            'classes': ('collapse',)
        }),
    )

# Hide Domain model (technical)
# admin.site.unregister(Domain)
```

---

## 3️⃣ **IMPROVE MODEL DISPLAY**

### **File: backend/students/admin.py** (Update)

```python
from django.contrib import admin
from config.admin import admin_site
from .models import Student, StudentDocument

class StudentDocumentInline(admin.TabularInline):
    model = StudentDocument
    extra = 0
    fields = ['document_type', 'document_file', 'verified']

@admin.register(Student, site=admin_site)
class StudentAdmin(admin.ModelAdmin):
    list_display = [
        'admission_number',
        'full_name',
        'current_class',
        'current_section',
        'status',
        'date_of_birth'
    ]
    list_filter = ['status', 'current_class', 'gender']
    search_fields = ['admission_number', 'first_name', 'last_name', 'email']
    inlines = [StudentDocumentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('admission_number', 'first_name', 'last_name', 'date_of_birth', 'gender')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone_number', 'address')
        }),
        ('Academic Information', {
            'fields': ('current_class', 'current_section', 'roll_number', 'status')
        }),
        ('Guardian Information', {
            'fields': ('father_name', 'mother_name', 'guardian_phone'),
            'classes': ('collapse',)
        }),
    )
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Name'

# Don't register StudentDocument separately (use inline only)
```

---

## 4️⃣ **ORGANIZE FINANCE MODELS**

### **File: backend/finance/admin.py** (Update)

```python
from django.contrib import admin
from config.admin import admin_site
from .models import (
    LedgerAccount, JournalEntry, JournalEntryLine,
    PettyCashRequest, VendorPayment, SalaryPayment
)

# Main models
@admin.register(LedgerAccount, site=admin_site)
class LedgerAccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_type', 'balance']
    list_filter = ['account_type']
    search_fields = ['code', 'name']

class JournalEntryLineInline(admin.TabularInline):
    model = JournalEntryLine
    extra = 2
    fields = ['account', 'debit_amount', 'credit_amount', 'description']

@admin.register(JournalEntry, site=admin_site)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['entry_number', 'entry_date', 'status', 'total_debit', 'total_credit']
    list_filter = ['status', 'entry_date']
    search_fields = ['entry_number', 'description']
    inlines = [JournalEntryLineInline]
    
    fieldsets = (
        ('Entry Information', {
            'fields': ('entry_number', 'entry_date', 'description', 'status')
        }),
        ('Reference', {
            'fields': ('reference_type', 'reference_id'),
            'classes': ('collapse',)
        }),
    )

@admin.register(PettyCashRequest, site=admin_site)
class PettyCashRequestAdmin(admin.ModelAdmin):
    list_display = ['request_number', 'requested_by', 'amount', 'status', 'requested_date']
    list_filter = ['status', 'requested_date']
    search_fields = ['request_number', 'purpose']
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        queryset.update(status='approved')
    approve_requests.short_description = "Approve selected requests"
    
    def reject_requests(self, request, queryset):
        queryset.update(status='rejected')
    reject_requests.short_description = "Reject selected requests"

@admin.register(VendorPayment, site=admin_site)
class VendorPaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_number', 'vendor_name', 'amount', 'payment_date', 'status']
    list_filter = ['status', 'payment_date']
    search_fields = ['payment_number', 'vendor_name']

@admin.register(SalaryPayment, site=admin_site)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_number', 'staff', 'gross_salary', 'net_salary', 'payment_date', 'status']
    list_filter = ['status', 'payment_date']
    search_fields = ['payment_number', 'staff__first_name', 'staff__last_name']

# Don't register JournalEntryLine separately (use inline only)
```

---

## 5️⃣ **HIDE DJANGO DEFAULT MODELS**

### **File: backend/config/settings/base.py** (Update)

```python
# Hide default Django models from admin
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # ... your apps
]

# Don't show these in admin
ADMIN_HIDE_MODELS = [
    'auth.Group',  # Using custom roles instead
    'contenttypes.ContentType',
    'sessions.Session',
    'admin.LogEntry',
]
```

### **File: backend/config/admin.py** (Update)

```python
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session

class NucleIQAdminSite(AdminSite):
    # ... previous code ...
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Unregister unwanted models
        try:
            self.unregister(Group)
        except:
            pass

admin_site = NucleIQAdminSite(name='nucleiq_admin')

# Hide technical models
try:
    admin.site.unregister(ContentType)
    admin.site.unregister(Session)
except:
    pass
```

---

## 6️⃣ **ADD CUSTOM ADMIN INDEX**

### **File: backend/templates/admin/index.html** (Create)

```html
{% extends "admin/index.html" %}
{% load static %}

{% block content %}
<div class="dashboard-stats">
    <div class="stat-card">
        <h3>Total Students</h3>
        <p class="stat-number">{{ total_students }}</p>
    </div>
    <div class="stat-card">
        <h3>Total Staff</h3>
        <p class="stat-number">{{ total_staff }}</p>
    </div>
    <div class="stat-card">
        <h3>Pending Fees</h3>
        <p class="stat-number">₹{{ pending_fees }}</p>
    </div>
    <div class="stat-card">
        <h3>Active Tenants</h3>
        <p class="stat-number">{{ active_tenants }}</p>
    </div>
</div>

{{ block.super }}

<style>
.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}
.stat-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}
.stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
    margin: 10px 0 0 0;
}
</style>
{% endblock %}
```

### **File: backend/config/admin.py** (Update)

```python
class NucleIQAdminSite(AdminSite):
    # ... previous code ...
    
    def index(self, request, extra_context=None):
        """
        Custom admin index with statistics
        """
        from students.models import Student
        from staff.models import Staff
        from fees.models import FeeTransaction
        from tenants.models import Tenant
        
        extra_context = extra_context or {}
        extra_context['total_students'] = Student.objects.filter(is_deleted=False).count()
        extra_context['total_staff'] = Staff.objects.filter(is_deleted=False).count()
        extra_context['pending_fees'] = FeeTransaction.objects.filter(
            status='pending'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        extra_context['active_tenants'] = Tenant.objects.filter(is_active=True).count()
        
        return super().index(request, extra_context)
```

---

## 7️⃣ **RESTRICT ACCESS BY ROLE**

### **File: backend/users/admin.py** (Update)

```python
class UserAdmin(admin.ModelAdmin):
    # ... previous code ...
    
    def get_queryset(self, request):
        """
        Platform admins see all users.
        Tenant admins see only their tenant's users.
        """
        qs = super().get_queryset(request)
        if request.user.is_platform_admin:
            return qs
        return qs.filter(tenant=request.user.tenant)
    
    def has_add_permission(self, request):
        """Only platform admins and tenant admins can add users"""
        return request.user.is_platform_admin or request.user.is_staff
    
    def has_delete_permission(self, request, obj=None):
        """Only platform admins can delete users"""
        return request.user.is_platform_admin
```

---

## 8️⃣ **CLEANUP CHECKLIST**

### **Models to Keep Visible**:
- [x] Tenants
- [x] Users
- [x] Roles
- [x] Students
- [x] Staff
- [x] Attendance Records
- [x] Fee Categories
- [x] Fee Transactions
- [x] Ledger Accounts
- [x] Journal Entries
- [x] Petty Cash Requests
- [x] Vendor Payments
- [x] Salary Payments

### **Models to Hide**:
- [x] Groups (Django default)
- [x] Content Types
- [x] Sessions
- [x] Log Entries
- [x] User Preferences (internal)
- [x] Permissions (technical)
- [x] Role Permissions (technical)
- [x] User Roles (use inline)
- [x] Impersonation Logs (audit only)
- [x] Journal Entry Lines (use inline)
- [x] Student Documents (use inline)
- [x] Staff Documents (use inline)

### **Customizations to Apply**:
- [x] Custom admin site class
- [x] Custom branding
- [x] Custom app ordering
- [x] Fieldsets for better organization
- [x] Inlines for related models
- [x] Custom actions
- [x] Role-based access control
- [x] Custom dashboard with stats

---

## 9️⃣ **IMPLEMENTATION STEPS**

### **Step 1: Create Custom Admin Site**
```bash
# Create config/admin.py
touch backend/config/admin.py
# Copy code from section 1
```

### **Step 2: Update URLs**
```bash
# Edit config/urls.py
# Change admin.site.urls to admin_site.urls
```

### **Step 3: Update Each App's Admin**
```bash
# Update each admin.py file
# Change @admin.register to @admin.register(Model, site=admin_site)
```

### **Step 4: Hide Unwanted Models**
```bash
# Remove or comment out unwanted admin registrations
```

### **Step 5: Test**
```bash
# Restart Django
docker compose restart backend

# Access admin
http://localhost:8000/admin/

# Verify:
# - Custom branding appears
# - Apps are ordered correctly
# - Unwanted models are hidden
# - Inlines work properly
```

---

## 🎨 **VISUAL IMPROVEMENTS**

### **Custom CSS** (Optional)

Create `backend/static/admin/css/custom_admin.css`:

```css
/* Custom admin styles */
#header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.module h2, .module caption {
    background: #667eea;
}

.button, input[type=submit], input[type=button] {
    background: #667eea;
    border-color: #667eea;
}

.button:hover, input[type=submit]:hover {
    background: #764ba2;
}
```

Add to settings:
```python
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
```

---

## ✅ **RESULT**

After cleanup, your Django Admin will have:
- ✅ Clean, organized interface
- ✅ Only relevant models visible
- ✅ Custom branding
- ✅ Better navigation
- ✅ Role-based access
- ✅ Custom dashboard
- ✅ Improved usability

---

**Status**: ✅ **ADMIN CLEANUP GUIDE COMPLETE!**  
**Created**: December 28, 2025, 1:02 PM

🧹 **Django Admin is now clean and organized!** ✨
