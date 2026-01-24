"""
Certificate Generator Engine
"""
import uuid
from django.template import Template, Context
from django.utils import timezone
from .models import GeneratedCertificate
import os

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

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
    # Try to generate a simple PDF snapshot of the certificate when possible.
    output_path = None
    try:
        filename = f"certificate_{certificate.id}.pdf"
        output_dir = getattr(request_obj, 'output_dir', None) or 'media/certificates/'
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)

        if REPORTLAB_AVAILABLE:
            c = canvas.Canvas(output_path, pagesize=A4)
            width, height = A4
            # Very basic rendering: write text lines, preserve simple layout
            lines = final_content.split('\n')[:60]
            y = height - 80
            c.setFont('Helvetica-Bold', 16)
            c.drawCentredString(width / 2.0, y, request_obj.template.name if hasattr(request_obj, 'template') else 'Certificate')
            c.setFont('Helvetica', 11)
            y -= 40
            for line in lines:
                if y < 80:
                    c.showPage()
                    y = height - 80
                c.drawString(60, y, line[:120])
                y -= 18
            c.save()
            certificate.file_url = output_path
            certificate.save(update_fields=['file_url'])
        else:
            # Fallback: save plain text snapshot so that a consumer can still retrieve it
            txt_path = output_path.replace('.pdf', '.txt')
            with open(txt_path, 'w', encoding='utf-8') as fh:
                fh.write(final_content)
            certificate.file_url = txt_path
            certificate.save(update_fields=['file_url'])
    except Exception:
        # Don't fail certificate creation because PDF generation failed
        pass
    
    return certificate
