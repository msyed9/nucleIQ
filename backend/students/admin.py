"""
Django Admin configuration for Students app
"""

from django.contrib import admin
from .models import Student, StudentEnrollment, StudentRemark, StudentDocument, StudentHealthRecord


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    """Admin interface for students."""
    
    list_display = [
        'admission_number', 'get_full_name', 'date_of_birth',
        'father_phone', 'is_active', 'admission_date'
    ]
    list_filter = ['gender', 'is_active', 'admission_date']
    search_fields = [
        'admission_number', 'first_name', 'last_name', 'email',
        'father_name', 'mother_name', 'father_phone'
    ]
    ordering = ['admission_number']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'admission_number', 'admission_date', 'first_name', 'last_name', 'date_of_birth', 'gender', 'blood_group', 'photo')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'address')
        }),
        ('Father Details', {
            'fields': ('father_name', 'father_phone', 'father_email', 'father_occupation')
        }),
        ('Mother Details', {
            'fields': ('mother_name', 'mother_phone', 'mother_email', 'mother_occupation')
        }),
        ('Guardian Details', {
            'fields': ('guardian_name', 'guardian_phone', 'guardian_relation'),
            'classes': ('collapse',)
        }),
        ('Family', {
            'fields': ('family_id',)
        }),
        ('Status', {
            'fields': ('is_active', 'notes')
        }),
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Name'


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    """Admin interface for student enrollments."""
    
    list_display = [
        'student', 'academic_year', 'section', 'roll_number',
        'status', 'enrollment_date'
    ]
    list_filter = ['academic_year', 'status', 'section__grade_level']
    search_fields = [
        'student__admission_number', 'student__first_name', 'student__last_name',
        'roll_number'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Enrollment', {
            'fields': ('tenant', 'student', 'academic_year', 'section', 'roll_number')
        }),
        ('Status', {
            'fields': ('status', 'enrollment_date', 'exit_date', 'exit_reason')
        }),
        ('Attendance Summary', {
            'fields': ('total_days', 'present_days', 'absent_days')
        }),
        ('Academic Performance', {
            'fields': ('final_percentage', 'final_grade')
        }),
        ('Promotion', {
            'fields': ('promoted_to_section',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(StudentRemark)
class StudentRemarkAdmin(admin.ModelAdmin):
    """Admin interface for student remarks."""
    
    list_display = [
        'student', 'remark_type', 'category', 'title',
        'created_by_staff', 'visible_to_parent', 'is_important',
        'created_at'
    ]
    list_filter = [
        'remark_type', 'category', 'visible_to_parent',
        'is_important', 'is_system_generated', 'requires_action'
    ]
    search_fields = ['student__first_name', 'student__last_name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'parent_acknowledged_at']
    
    fieldsets = (
        ('Student & Type', {
            'fields': ('student', 'remark_type', 'category')
        }),
        ('Content', {
            'fields': ('title', 'description', 'attachment')
        }),
        ('Created By', {
            'fields': ('created_by_staff', 'is_system_generated', 'source_module', 'source_reference')
        }),
        ('Visibility', {
            'fields': ('visible_to_parent', 'visible_to_student', 'is_important')
        }),
        ('Action', {
            'fields': ('requires_action', 'action_taken', 'action_notes')
        }),
        ('Parent Acknowledgment', {
            'fields': ('parent_acknowledged', 'parent_acknowledged_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    """Admin interface for student documents."""
    
    list_display = [
        'student', 'document_type', 'title', 'is_verified',
        'uploaded_by', 'created_at'
    ]
    list_filter = ['document_type', 'is_verified']
    search_fields = ['student__first_name', 'student__last_name', 'title']
    readonly_fields = ['uploaded_by', 'verified_by', 'verified_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Document', {
            'fields': ('student', 'document_type', 'title', 'description', 'file')
        }),
        ('Upload Info', {
            'fields': ('uploaded_by', 'created_at')
        }),
        ('Verification', {
            'fields': ('is_verified', 'verified_by', 'verified_at')
        }),
    )


@admin.register(StudentHealthRecord)
class StudentHealthRecordAdmin(admin.ModelAdmin):
    """Admin interface for health records."""
    
    list_display = [
        'student', 'date', 'height_cm', 'weight_kg',
        'get_bmi_display', 'examined_by'
    ]
    list_filter = ['date']
    search_fields = ['student__first_name', 'student__last_name', 'diagnosis']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic', {
            'fields': ('student', 'date', 'examined_by')
        }),
        ('Vitals', {
            'fields': ('height_cm', 'weight_kg')
        }),
        ('Medical', {
            'fields': ('diagnosis', 'treatment', 'prescription', 'allergies')
        }),
        ('Vaccination', {
            'fields': ('vaccination_name', 'vaccination_date')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )
    
    def get_bmi_display(self, obj):
        bmi = obj.get_bmi()
        return f"{bmi:.2f}" if bmi else '-'
    get_bmi_display.short_description = 'BMI'
