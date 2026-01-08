"""
Certificate Generator Engine
"""
import uuid
from django.template import Template, Context
from django.utils import timezone
from .models import GeneratedCertificate

def generate_certificate(request_obj, issue_date=None):
    """
    Generates a certificate from a request.
    
    Args:
        request_obj: CertificateRequest instance
        issue_date: Optional date for certificate issuance (defaults to today)
    
    Returns:
        GeneratedCertificate instance
    """
    template = request_obj.template
    student = request_obj.student
    
    # Context for replacement
    context_data = {
        'student_name': student.get_full_name(),
        'admission_no': student.admission_number,
        'father_name': student.father_name,
        'dob': student.date_of_birth,
        'class': student.get_current_enrollment().section.grade_level.name if student.get_current_enrollment() else 'N/A',
        'academic_year': student.get_current_enrollment().academic_year.name if student.get_current_enrollment() else 'N/A',
        'issue_date': issue_date or timezone.now().date(),
    }
    
    # 1. Substitute Content
    # Using Django Template Engine for robustness
    django_template = Template(template.content)
    context = Context(context_data)
    final_content = django_template.render(context)
    
    # 2. Create Record (certificate_number will be auto-generated in model save)
    certificate = GeneratedCertificate.objects.create(
        tenant=request_obj.tenant,
        request=request_obj,
        content_snapshot=final_content,
        issued_date=issue_date or timezone.now().date()
    )
    
    # 3. (Partial) PDF Generation
    # In a real system, we would convert final_content (HTML) to PDF here.
    # For now, we assume the frontend sends a print command on the content.
    # TODO: Implement PDF generation using ReportLab or WeasyPrint
    
    return certificate
