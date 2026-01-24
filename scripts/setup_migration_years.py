
import os
import django
import sys

# Set up Django environment
sys.path.append(r'c:\ECOLAB-ETS\RnD\nucleIQ\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tenants.models import Tenant, AcademicYear
from django.utils import timezone
from datetime import date

def create_academic_years():
    # Get the first tenant (assuming they want it for the first one, or all)
    tenants = Tenant.objects.all()
    if not tenants:
        print("No tenants found.")
        return

    years = [
        ('2023-24', date(2023, 4, 1), date(2024, 3, 31), False),
        ('2024-25', date(2024, 4, 1), date(2025, 3, 31), True),
        ('2025-26', date(2025, 4, 1), date(2026, 3, 31), False),
    ]

    for tenant in tenants:
        print(f"Creating academic years for tenant: {tenant.name}")
        for name, start, end, active in years:
            ay, created = AcademicYear.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'start_date': start,
                    'end_date': end,
                    'is_active': active,
                    'description': f'Academic Year {name}'
                }
            )
            if created:
                print(f"  - Created {name}")
            else:
                print(f"  - {name} already exists")

if __name__ == "__main__":
    create_academic_years()
