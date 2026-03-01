import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from students.models import Student
from students.services import Student360Service
from fees.models import FeeInvoice

# Find a student that has a FeeInvoice
invoice = FeeInvoice.objects.filter(total_amount__gt=0).first()
if getattr(invoice, 'student', None):
    print("Found student with invoice:", invoice.student.id)
    s = invoice.student
    service = Student360Service(s)
    
    print("Fee Balance from KPI method:", service._get_fee_balance())
    
    enrollment = s.get_current_enrollment()
    print("Enrollment:", enrollment, "Academic year:", enrollment.academic_year if enrollment else None)
    
    finance_tab = service._get_financial_summary()
    print("Finance Summary:", finance_tab)
    
    fee_details = service._get_fee_details()
    print("Fee details:", fee_details)
else:
    print("No invoices found")
