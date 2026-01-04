"""
Certificates Admin Configuration
"""

from django.contrib import admin
from .models import CertificateTemplate, CertificateRequest, GeneratedCertificate


@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'content']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']
    
    fieldsets = (
        ('Template Information', {
            'fields': ('name', 'content', 'is_active')
        }),
        ('Images', {
            'fields': ('header_image', 'footer_image', 'signature_image')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CertificateRequest)
class CertificateRequestAdmin(admin.ModelAdmin):
    list_display = ['student', 'template', 'status', 'requested_at', 'approved_by']
    list_filter = ['status', 'requested_at', 'approved_at']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'reason']
    raw_id_fields = ['student', 'template', 'approved_by']
    readonly_fields = ['requested_at', 'approved_at', 'created_at', 'updated_at']
    ordering = ['-requested_at']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('student', 'template', 'reason')
        }),
        ('Status', {
            'fields': ('status', 'approved_by', 'approved_at')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(GeneratedCertificate)
class GeneratedCertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'get_student_name', 'get_template_name', 'issued_date', 'verified']
    list_filter = ['verified', 'issued_date', 'created_at']
    search_fields = ['certificate_number', 'request__student__user__first_name']
    raw_id_fields = ['request']
    readonly_fields = ['certificate_number', 'content_snapshot', 'created_at', 'updated_at']
    ordering = ['-issued_date']
    
    fieldsets = (
        ('Certificate Information', {
            'fields': ('request', 'certificate_number', 'issued_date', 'verified')
        }),
        ('Content', {
            'fields': ('content_snapshot', 'pdf_file')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_student_name(self, obj):
        return obj.request.student.get_full_name()
    get_student_name.short_description = 'Student'
    
    def get_template_name(self, obj):
        return obj.request.template.name
    get_template_name.short_description = 'Template'
