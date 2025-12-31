"""
CRM Models - Lead Management, Admissions, Visitor Tracking
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from decimal import Decimal
from core.models import TenantAwareModel


class Lead(TenantAwareModel):
    """
    Lead/Enquiry for admission
    """
    
    SOURCE_CHOICES = [
        ('WALK_IN', 'Walk-in'),
        ('WEBSITE', 'Website Form'),
        ('REFERRAL', 'Referral'),
        ('SOCIAL_MEDIA', 'Social Media'),
        ('EDUCATION_FAIR', 'Education Fair'),
        ('PHONE_CALL', 'Phone Call'),
        ('EMAIL', 'Email'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('CAMPUS_VISIT', 'Campus Visit Scheduled'),
        ('VISITED', 'Visited Campus'),
        ('APPLICATION_RECEIVED', 'Application Received'),
        ('SHORTLISTED', 'Shortlisted'),
        ('ADMITTED', 'Admitted'),
        ('LOST', 'Lost'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    # Lead Information
    lead_number = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Unique lead number')
    )
    
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        help_text=_('Lead source')
    )
    
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='NEW',
        help_text=_('Lead status')
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        help_text=_('Lead priority')
    )
    
    # Student Information
    student_name = models.CharField(
        max_length=200,
        help_text=_('Prospective student name')
    )
    
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text=_('Student date of birth')
    )
    
    gender = models.CharField(
        max_length=10,
        choices=[
            ('MALE', 'Male'),
            ('FEMALE', 'Female'),
            ('OTHER', 'Other'),
        ],
        blank=True
    )
    
    current_school = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Current school (if any)')
    )
    
    # Admission Details
    grade_applying_for = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads',
        help_text=_('Grade applying for')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads',
        help_text=_('Academic year')
    )
    
    # Parent/Guardian Information
    parent_name = models.CharField(
        max_length=200,
        help_text=_('Parent/Guardian name')
    )
    
    parent_email = models.EmailField(
        help_text=_('Parent email')
    )
    
    parent_phone = models.CharField(
        max_length=20,
        help_text=_('Parent phone')
    )
    
    parent_alternate_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Alternate phone')
    )
    
    address = models.TextField(
        blank=True,
        help_text=_('Address')
    )
    
    city = models.CharField(
        max_length=100,
        blank=True
    )
    
    state = models.CharField(
        max_length=100,
        blank=True
    )
    
    postal_code = models.CharField(
        max_length=20,
        blank=True
    )
    
    # Assignment
    assigned_to = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads',
        help_text=_('Staff assigned to this lead')
    )
    
    # Follow-up
    next_follow_up = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Next follow-up date/time')
    )
    
    follow_up_notes = models.TextField(
        blank=True,
        help_text=_('Follow-up notes')
    )
    
    # Application
    application_fee_paid = models.BooleanField(
        default=False,
        help_text=_('Whether application fee is paid')
    )
    
    application_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Application fee amount')
    )
    
    application_fee_payment_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Payment gateway transaction ID')
    )
    
    # Documents
    documents_submitted = models.BooleanField(
        default=False,
        help_text=_('Whether documents are submitted')
    )
    
    # Conversion
    converted_to_student = models.BooleanField(
        default=False,
        help_text=_('Whether converted to student')
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead_source',
        help_text=_('Converted student record')
    )
    
    converted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When converted to student')
    )
    
    # Loss reason
    lost_reason = models.TextField(
        blank=True,
        help_text=_('Reason for losing the lead')
    )
    
    lost_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When lead was lost')
    )
    
    # Additional
    remarks = models.TextField(
        blank=True,
        help_text=_('Additional remarks')
    )
    
    class Meta:
        db_table = 'leads'
        verbose_name = _('Lead')
        verbose_name_plural = _('Leads')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['source']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['next_follow_up']),
        ]
    
    def __str__(self):
        return f"{self.lead_number} - {self.student_name}"
    
    def save(self, *args, **kwargs):
        if not self.lead_number:
            # Auto-generate lead number
            from datetime import datetime
            prefix = f"LEAD{datetime.now().year}"
            last_lead = Lead.objects.filter(
                tenant=self.tenant,
                lead_number__startswith=prefix
            ).order_by('-lead_number').first()
            
            if last_lead:
                last_num = int(last_lead.lead_number[len(prefix):])
                self.lead_number = f"{prefix}{last_num + 1:05d}"
            else:
                self.lead_number = f"{prefix}00001"
        
        super().save(*args, **kwargs)


class LeadInteraction(TenantAwareModel):
    """
    Track all interactions with a lead
    """
    
    INTERACTION_TYPE_CHOICES = [
        ('CALL', 'Phone Call'),
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('MEETING', 'Meeting'),
        ('CAMPUS_VISIT', 'Campus Visit'),
        ('NOTE', 'Note'),
        ('OTHER', 'Other'),
    ]
    
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='interactions',
        help_text=_('Related lead')
    )
    
    interaction_type = models.CharField(
        max_length=50,
        choices=INTERACTION_TYPE_CHOICES,
        help_text=_('Type of interaction')
    )
    
    interaction_date = models.DateTimeField(
        default=timezone.now,
        help_text=_('When interaction occurred')
    )
    
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='lead_interactions',
        help_text=_('Staff who had the interaction')
    )
    
    subject = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Interaction subject')
    )
    
    notes = models.TextField(
        help_text=_('Interaction notes/details')
    )
    
    outcome = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Outcome of interaction')
    )
    
    next_action = models.TextField(
        blank=True,
        help_text=_('Next action to take')
    )
    
    next_action_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When to take next action')
    )
    
    class Meta:
        db_table = 'lead_interactions'
        verbose_name = _('Lead Interaction')
        verbose_name_plural = _('Lead Interactions')
        ordering = ['-interaction_date']
        indexes = [
            models.Index(fields=['tenant', 'lead']),
            models.Index(fields=['interaction_date']),
        ]
    
    def __str__(self):
        return f"{self.lead.lead_number} - {self.get_interaction_type_display()}"


class LeadDocument(TenantAwareModel):
    """
    Documents uploaded by leads/applicants
    """
    
    DOCUMENT_TYPE_CHOICES = [
        ('BIRTH_CERTIFICATE', 'Birth Certificate'),
        ('PREVIOUS_MARKSHEET', 'Previous Marksheet'),
        ('TRANSFER_CERTIFICATE', 'Transfer Certificate'),
        ('PHOTO', 'Photograph'),
        ('ID_PROOF', 'ID Proof'),
        ('ADDRESS_PROOF', 'Address Proof'),
        ('OTHER', 'Other'),
    ]
    
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='documents',
        help_text=_('Related lead')
    )
    
    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPE_CHOICES,
        help_text=_('Type of document')
    )
    
    title = models.CharField(
        max_length=200,
        help_text=_('Document title')
    )
    
    file = models.FileField(
        upload_to='crm/documents/%Y/%m/',
        help_text=_('Document file')
    )
    
    uploaded_by = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Who uploaded (parent/staff)')
    )
    
    verified = models.BooleanField(
        default=False,
        help_text=_('Whether document is verified')
    )
    
    verified_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents',
        help_text=_('Staff who verified')
    )
    
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When verified')
    )
    
    class Meta:
        db_table = 'lead_documents'
        verbose_name = _('Lead Document')
        verbose_name_plural = _('Lead Documents')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.lead.lead_number} - {self.title}"


class Visitor(TenantAwareModel):
    """
    Visitor log for campus visits
    """
    
    PURPOSE_CHOICES = [
        ('ENQUIRY', 'Enquiry'),
        ('ADMISSION', 'Admission'),
        ('PARENT_MEETING', 'Parent Meeting'),
        ('VENDOR', 'Vendor'),
        ('GUEST', 'Guest'),
        ('INTERVIEW', 'Interview'),
        ('OTHER', 'Other'),
    ]
    
    visitor_number = models.CharField(
        max_length=50,
        help_text=_('Unique visitor number')
    )
    
    # Visitor Information
    name = models.CharField(
        max_length=200,
        help_text=_('Visitor name')
    )
    
    phone = models.CharField(
        max_length=20,
        help_text=_('Visitor phone')
    )
    
    email = models.EmailField(
        blank=True,
        help_text=_('Visitor email')
    )
    
    organization = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Organization/Company')
    )
    
    purpose = models.CharField(
        max_length=50,
        choices=PURPOSE_CHOICES,
        help_text=_('Purpose of visit')
    )
    
    # Related Lead
    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits',
        help_text=_('Related lead (if any)')
    )
    
    # Meeting with
    meeting_with = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitor_meetings',
        help_text=_('Staff to meet')
    )
    
    # Check-in/out
    check_in_time = models.DateTimeField(
        default=timezone.now,
        help_text=_('Check-in time')
    )
    
    check_out_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Check-out time')
    )
    
    # Photo
    photo = models.ImageField(
        upload_to='crm/visitors/%Y/%m/',
        null=True,
        blank=True,
        help_text=_('Visitor photo (webcam capture)')
    )
    
    # Badge
    badge_number = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Visitor badge number')
    )
    
    badge_printed = models.BooleanField(
        default=False,
        help_text=_('Whether badge was printed')
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text=_('Visit notes')
    )
    
    feedback = models.TextField(
        blank=True,
        help_text=_('Visitor feedback')
    )
    
    class Meta:
        db_table = 'visitors'
        verbose_name = _('Visitor')
        verbose_name_plural = _('Visitors')
        ordering = ['-check_in_time']
        indexes = [
            models.Index(fields=['tenant', 'check_in_time']),
            models.Index(fields=['purpose']),
        ]
    
    def __str__(self):
        return f"{self.visitor_number} - {self.name}"
    
    def save(self, *args, **kwargs):
        if not self.visitor_number:
            # Auto-generate visitor number
            from datetime import datetime
            prefix = f"VIS{datetime.now().strftime('%Y%m%d')}"
            last_visitor = Visitor.objects.filter(
                tenant=self.tenant,
                visitor_number__startswith=prefix
            ).order_by('-visitor_number').first()
            
            if last_visitor:
                last_num = int(last_visitor.visitor_number[len(prefix):])
                self.visitor_number = f"{prefix}{last_num + 1:03d}"
            else:
                self.visitor_number = f"{prefix}001"
        
        super().save(*args, **kwargs)


class AdmissionPortalAccess(TenantAwareModel):
    """
    Access credentials for parents to track admission status
    """
    
    lead = models.OneToOneField(
        Lead,
        on_delete=models.CASCADE,
        related_name='portal_access',
        help_text=_('Related lead')
    )
    
    access_code = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Unique access code for parent')
    )
    
    password_hash = models.CharField(
        max_length=255,
        help_text=_('Hashed password')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether access is active')
    )
    
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Last login time')
    )
    
    class Meta:
        db_table = 'admission_portal_access'
        verbose_name = _('Admission Portal Access')
        verbose_name_plural = _('Admission Portal Access')
    
    def __str__(self):
        return f"{self.lead.lead_number} - {self.access_code}"
