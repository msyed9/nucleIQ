"""
CRM Admin Configuration
"""

from django.contrib import admin
from .models import Lead, LeadInteraction, LeadDocument, Visitor, AdmissionPortalAccess


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['lead_number', 'student_name', 'parent_name', 'source', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter = ['source', 'status', 'priority', 'converted_to_student']
    search_fields = ['lead_number', 'student_name', 'parent_name', 'parent_email', 'parent_phone']
    readonly_fields = ['lead_number', 'converted_at', 'lost_at']
    ordering = ['-created_at']
    raw_id_fields = ['grade_applying_for', 'academic_year', 'assigned_to', 'student']
    
    fieldsets = (
        ('Lead Information', {
            'fields': ('lead_number', 'source', 'status', 'priority', 'assigned_to')
        }),
        ('Student Information', {
            'fields': ('student_name', 'date_of_birth', 'gender', 'current_school', 'grade_applying_for', 'academic_year')
        }),
        ('Parent Information', {
            'fields': ('parent_name', 'parent_email', 'parent_phone', 'parent_alternate_phone', 'address', 'city', 'state', 'postal_code')
        }),
        ('Follow-up', {
            'fields': ('next_follow_up', 'follow_up_notes')
        }),
        ('Application', {
            'fields': ('application_fee_paid', 'application_fee_amount', 'application_fee_payment_id', 'documents_submitted')
        }),
        ('Conversion', {
            'fields': ('converted_to_student', 'student', 'converted_at', 'lost_reason', 'lost_at')
        }),
        ('Additional', {
            'fields': ('remarks',)
        }),
    )


@admin.register(LeadInteraction)
class LeadInteractionAdmin(admin.ModelAdmin):
    list_display = ['lead', 'interaction_type', 'interaction_date', 'staff', 'subject']
    list_filter = ['interaction_type', 'interaction_date']
    search_fields = ['lead__lead_number', 'subject', 'notes']
    ordering = ['-interaction_date']
    raw_id_fields = ['lead', 'staff']


@admin.register(LeadDocument)
class LeadDocumentAdmin(admin.ModelAdmin):
    list_display = ['lead', 'document_type', 'title', 'verified', 'verified_by', 'created_at']
    list_filter = ['document_type', 'verified']
    search_fields = ['lead__lead_number', 'title']
    readonly_fields = ['verified_at']
    ordering = ['-created_at']
    raw_id_fields = ['lead', 'verified_by']


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ['visitor_number', 'name', 'purpose', 'check_in_time', 'check_out_time', 'meeting_with']
    list_filter = ['purpose', 'check_in_time']
    search_fields = ['visitor_number', 'name', 'phone', 'organization']
    readonly_fields = ['visitor_number']
    ordering = ['-check_in_time']
    raw_id_fields = ['lead', 'meeting_with']


@admin.register(AdmissionPortalAccess)
class AdmissionPortalAccessAdmin(admin.ModelAdmin):
    list_display = ['access_code', 'lead', 'is_active', 'last_login']
    list_filter = ['is_active']
    search_fields = ['access_code', 'lead__lead_number']
    readonly_fields = ['access_code', 'last_login']
    raw_id_fields = ['lead']
