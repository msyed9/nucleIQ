"""
Certificate Management Models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TenantAwareModel
from django.utils import timezone

class CertificateTemplate(TenantAwareModel):
    """
    Template for certificates (Bonafide, Transfer, Conduct)
    """
    name = models.CharField(max_length=100, help_text="e.g., Bonafide Certificate")
    content = models.TextField(help_text="HTML/Text Content with placeholders like {student_name}, {admission_no}")
    
    header_image = models.ImageField(upload_to='certificates/headers/', null=True, blank=True)
    footer_image = models.ImageField(upload_to='certificates/footers/', null=True, blank=True)
    signature_image = models.ImageField(upload_to='certificates/signatures/', null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'certificate_templates'

    def __str__(self):
        return self.name

class CertificateRequest(TenantAwareModel):
    """
    Parent/Student request for a certificate
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('GENERATED', 'Generated'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='certificate_requests')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.PROTECT)
    
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'certificate_requests'

class GeneratedCertificate(TenantAwareModel):
    """
    The actual issued certificate record
    """
    request = models.OneToOneField(CertificateRequest, on_delete=models.CASCADE, related_name='generated_certificate')
    certificate_number = models.CharField(max_length=50, unique=True)
    
    issued_date = models.DateField(default=timezone.now)
    content_snapshot = models.TextField(help_text="Exact content at time of generation")
    
    pdf_file = models.FileField(upload_to='certificates/generated/', null=True, blank=True)
    verified = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'generated_certificates'
