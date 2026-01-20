"""
Test the students API endpoint directly to see the error
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

try:
    from students.models import Student
    from students.serializers import StudentBasicSerializer
    from tenants.models import Tenant
    
    # Get a tenant
    tenant = Tenant.objects.first()
    print(f"Testing with tenant: {tenant}")
    
    # Get students
    students = Student.objects.filter(tenant=tenant, is_active=True)[:5]
    print(f"Found {students.count()} students")
    
    # Try to serialize
    for s in students:
        print(f"  - {s.admission_number}: {s.first_name} {s.last_name}")
        try:
            # Test the serializer
            serializer = StudentBasicSerializer(s)
            data = serializer.data
            print(f"    Serialized OK: {data.get('full_name', 'N/A')}")
        except Exception as e:
            print(f"    Serializer ERROR: {e}")
            import traceback
            traceback.print_exc()
            
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
