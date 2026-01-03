"""
Django Admin for Staff
"""

from django.contrib import admin
from .models import (
    Staff, StaffDocument, StaffAttendance, StaffLeave,
    StaffHealthProfile, StaffMedicalHistory, StaffMedicalCheckup,
    StaffVaccination, StaffInjuryReport,
    TrainingProgram, TrainingEnrollment, TrainingFeedback,
    AppraisalCycle, StaffAppraisal, StaffGoal
)


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    """Admin interface for Staff."""
    
    list_display = [
        'employee_id', 'get_full_name', 'designation',
        'department', 'status', 'joining_date', 'phone'
    ]
    list_filter = ['designation', 'department', 'employment_type', 'status', 'gender']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'user', 'employee_id', 'first_name', 'middle_name', 'last_name',
                      'date_of_birth', 'gender', 'photo')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'alternate_phone', 'address', 'city', 'state',
                      'postal_code', 'country')
        }),
        ('Employment Details', {
            'fields': ('designation', 'department', 'employment_type', 'joining_date',
                      'leaving_date', 'status')
        }),
        ('Qualifications & Experience', {
            'fields': ('qualifications', 'experience_years', 'previous_experience', 'subjects_taught')
        }),
        ('Salary & Banking', {
            'fields': ('salary', 'bank_account_number', 'bank_name', 'bank_ifsc'),
            'classes': ('collapse',)
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('blood_group', 'aadhar_number', 'pan_number', 'remarks'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['subjects_taught']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Name'


@admin.register(StaffDocument)
class StaffDocumentAdmin(admin.ModelAdmin):
    """Admin interface for Staff Documents."""
    
    list_display = ['staff', 'category', 'document_type', 'title', 'status', 'expiry_date', 'uploaded_by', 'created_at']
    list_filter = ['category', 'document_type', 'status', 'created_at']
    search_fields = ['staff__first_name', 'staff__last_name', 'title', 'document_number']
    readonly_fields = ['created_at', 'updated_at', 'verification_date']
    
    fieldsets = (
        ('Document Information', {
            'fields': ('tenant', 'staff', 'category', 'document_type', 'title', 'description', 'file')
        }),
        ('Document Details', {
            'fields': ('document_number', 'issue_date', 'expiry_date', 'issuing_authority')
        }),
        ('Verification', {
            'fields': ('status', 'verified_by', 'verification_date', 'verification_notes')
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(StaffAttendance)
class StaffAttendanceAdmin(admin.ModelAdmin):
    """Admin interface for Staff Attendance."""
    
    list_display = ['staff', 'date', 'status', 'check_in_time', 'check_out_time', 'is_late', 'overtime_hours', 'marked_by']
    list_filter = ['status', 'date', 'is_late', 'is_early_going']
    search_fields = ['staff__first_name', 'staff__last_name', 'staff__employee_id']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Attendance Information', {
            'fields': ('tenant', 'staff', 'date', 'status', 'check_in_time', 'check_out_time', 
                      'is_late', 'is_early_going', 'overtime_hours', 'remarks')
        }),
        ('Biometric Data', {
            'fields': ('biometric_punch_in', 'biometric_punch_out', 'biometric_device_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('marked_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(StaffLeave)
class StaffLeaveAdmin(admin.ModelAdmin):
    """Admin interface for Staff Leave."""
    
    list_display = ['staff', 'leave_type', 'from_date', 'to_date', 'total_days', 'status']
    list_filter = ['leave_type', 'status', 'from_date']
    search_fields = ['staff__first_name', 'staff__last_name']
    readonly_fields = ['total_days', 'created_at', 'updated_at']
    date_hierarchy = 'from_date'
    
    fieldsets = (
        ('Leave Information', {
            'fields': ('tenant', 'staff', 'leave_type', 'from_date', 'to_date', 'total_days', 'reason')
        }),
        ('Approval', {
            'fields': ('status', 'approved_by', 'approval_date', 'approval_remarks')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['approve_leaves', 'reject_leaves']
    
    def approve_leaves(self, request, queryset):
        """Approve selected leave applications."""
        from django.utils import timezone
        
        count = queryset.filter(status='PENDING').update(
            status='APPROVED',
            approved_by=request.user,
            approval_date=timezone.now()
        )
        self.message_user(request, f'{count} leave(s) approved.')
    approve_leaves.short_description = 'Approve selected leaves'
    
    def reject_leaves(self, request, queryset):
        """Reject selected leave applications."""
        from django.utils import timezone
        
        count = queryset.filter(status='PENDING').update(
            status='REJECTED',
            approved_by=request.user,
            approval_date=timezone.now()
        )
        self.message_user(request, f'{count} leave(s) rejected.')
    reject_leaves.short_description = 'Reject selected leaves'


@admin.register(StaffHealthProfile)
class StaffHealthProfileAdmin(admin.ModelAdmin):
    """Admin interface for Staff Health Profile."""
    
    list_display = ['staff', 'height', 'weight', 'bmi', 'health_insurance_provider']
    search_fields = ['staff__first_name', 'staff__last_name']
    readonly_fields = ['bmi', 'created_at', 'updated_at']


@admin.register(StaffMedicalHistory)
class StaffMedicalHistoryAdmin(admin.ModelAdmin):
    """Admin interface for Staff Medical History."""
    
    list_display = ['staff', 'date', 'condition_illness', 'doctor_hospital']
    list_filter = ['date']
    search_fields = ['staff__first_name', 'staff__last_name', 'condition_illness']
    date_hierarchy = 'date'


@admin.register(StaffMedicalCheckup)
class StaffMedicalCheckupAdmin(admin.ModelAdmin):
    """Admin interface for Staff Medical Checkup."""
    
    list_display = ['staff', 'checkup_date', 'checkup_type', 'fit_status']
    list_filter = ['checkup_type', 'fit_status', 'checkup_date']
    search_fields = ['staff__first_name', 'staff__last_name']
    date_hierarchy = 'checkup_date'


@admin.register(StaffVaccination)
class StaffVaccinationAdmin(admin.ModelAdmin):
    """Admin interface for Staff Vaccination."""
    
    list_display = ['staff', 'vaccine_name', 'date_administered', 'next_due_date']
    list_filter = ['date_administered']
    search_fields = ['staff__first_name', 'staff__last_name', 'vaccine_name']
    date_hierarchy = 'date_administered'


@admin.register(StaffInjuryReport)
class StaffInjuryReportAdmin(admin.ModelAdmin):
    """Admin interface for Staff Injury Report."""
    
    list_display = ['staff', 'date', 'time', 'location', 'severity']
    list_filter = ['severity', 'date', 'compensation_claim']
    search_fields = ['staff__first_name', 'staff__last_name', 'location']
    date_hierarchy = 'date'


@admin.register(TrainingProgram)
class TrainingProgramAdmin(admin.ModelAdmin):
    """Admin interface for Training Program."""
    
    list_display = ['program_name', 'category', 'start_date', 'end_date', 'mode', 'status']
    list_filter = ['category', 'mode', 'status', 'is_mandatory']
    search_fields = ['program_name', 'trainer_name']
    date_hierarchy = 'start_date'


@admin.register(TrainingEnrollment)
class TrainingEnrollmentAdmin(admin.ModelAdmin):
    """Admin interface for Training Enrollment."""
    
    list_display = ['staff', 'training_program', 'status', 'attendance_percentage', 'certificate_issued']
    list_filter = ['status', 'certificate_issued']
    search_fields = ['staff__first_name', 'staff__last_name', 'training_program__program_name']


@admin.register(TrainingFeedback)
class TrainingFeedbackAdmin(admin.ModelAdmin):
    """Admin interface for Training Feedback."""
    
    list_display = ['enrollment', 'content_quality_rating', 'trainer_effectiveness_rating', 'would_recommend']
    list_filter = ['would_recommend']


@admin.register(AppraisalCycle)
class AppraisalCycleAdmin(admin.ModelAdmin):
    """Admin interface for Appraisal Cycle."""
    
    list_display = ['name', 'start_date', 'end_date', 'submission_deadline', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    date_hierarchy = 'start_date'


@admin.register(StaffAppraisal)
class StaffAppraisalAdmin(admin.ModelAdmin):
    """Admin interface for Staff Appraisal."""
    
    list_display = ['staff', 'appraisal_cycle', 'manager', 'status', 'final_rating']
    list_filter = ['status', 'appraisal_cycle']
    search_fields = ['staff__first_name', 'staff__last_name']


@admin.register(StaffGoal)
class StaffGoalAdmin(admin.ModelAdmin):
    """Admin interface for Staff Goal."""
    
    list_display = ['staff', 'target_date', 'status', 'progress_percentage']
    list_filter = ['status']
    search_fields = ['staff__first_name', 'staff__last_name', 'goal_description']
    date_hierarchy = 'target_date'
