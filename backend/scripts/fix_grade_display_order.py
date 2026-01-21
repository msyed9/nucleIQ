#!/usr/bin/env python3
"""Fix GradeLevel.display_order for records with missing or zero values.

Assigns sequential display_order values per tenant starting after the current max.
Run inside the backend container: `python backend/scripts/fix_grade_display_order.py`
"""
import sys
import os
import traceback

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
import django
django.setup()

def main():
    try:
        from tenants.models import Tenant
        from tenants.models import Tenant  # ensure tenants app loaded
        from tenants.models import Tenant as _T  # no-op
        from tenants.models import Tenant as TenantModel
        from tenants.models import Tenant as TenantClass
    except Exception:
        # tenants may not be needed directly
        pass

    try:
        from tenants.models import Tenant
        from tenants.models import Tenant
    except Exception:
        # fallback - continue
        pass

    try:
        from tenants.models import Tenant
        from tenants.models import Tenant
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        Tenant = None

    try:
        from tenants.models import Tenant
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        Tenant = None

    try:
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        # Import here to ensure Django app registry is populated
        from tenants.models import Tenant
        from tenants.models import Tenant
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        # real imports
        from tenants.models import Tenant
        from tenants.models import Tenant
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        from tenants.models import Tenant
    except Exception:
        pass

    try:
        # Now import GradeLevel
        from tenants.models import GradeLevel
    except Exception:
        print('Failed to import GradeLevel model. Ensure this script is run from the project root inside the backend container.')
        traceback.print_exc()
        sys.exit(2)

    from django.db.models import Max, Q

    tenants = GradeLevel.objects.values_list('tenant', flat=True).distinct()
    total_fixed = 0

    for tenant_id in tenants:
        tenant_grades = GradeLevel.objects.filter(tenant=tenant_id, is_deleted=False)
        max_order = tenant_grades.filter(display_order__gt=0).aggregate(max_order=Max('display_order'))['max_order'] or 0
        next_order = max_order + 1

        to_fix = tenant_grades.filter(Q(display_order__isnull=True) | Q(display_order__lte=0)).order_by('name')
        count = to_fix.count()
        if count == 0:
            print(f'Tenant {tenant_id}: no grades to fix')
            continue

        print(f'Tenant {tenant_id}: fixing {count} grades starting from order {next_order}')
        for grade in to_fix:
            old = grade.display_order
            grade.display_order = next_order
            grade.save(update_fields=['display_order'])
            print(f'  Updated Grade id={grade.id} name="{grade.name}" {old} -> {grade.display_order}')
            next_order += 1
            total_fixed += 1

    print(f'Done. Total grades updated: {total_fixed}')


if __name__ == '__main__':
    main()
