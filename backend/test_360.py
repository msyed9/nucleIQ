import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from students.models import Student
from students.services import Student360Service

s = Student.objects.first()
if s:
    service = Student360Service(s)
    profile = service.get_360_profile()
    print("Fee Details:", profile.get('fee_details'))
    print("Financial Summary:", profile.get('financial_summary'))
    print("Academic Summary:", profile.get('academic_summary'))
else:
    print("No students found.")
