"""
Group Headquarters Views

Cross-tenant aggregation and administration for the platform's "Group of
Schools" super-admin dashboard. Only usable by platform staff/superusers -
all queries here intentionally span every tenant.
"""
from decimal import Decimal

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q

from .models import Tenant


class HeadquartersViewSet(viewsets.ViewSet):
    """
    Super Admin / Group Dashboard
    """
    permission_classes = [permissions.IsAdminUser]  # Only Superuser/platform staff

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Aggregated cross-tenant stats for the group of schools.
        """
        from fees.models import FeeTransaction, FeeInvoice

        tenants = Tenant.objects.annotate(
            student_count=Count('students', distinct=True),
            staff_count=Count('staff_members', distinct=True)
        ).select_related('branding')

        total_students = 0
        total_staff = 0
        total_revenue = Decimal('0.00')
        total_pending = Decimal('0.00')
        schools_breakdown = []

        for tenant in tenants:
            collected = FeeTransaction.objects.filter(tenant=tenant).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            pending = FeeInvoice.objects.filter(
                tenant=tenant, status__in=['PENDING', 'PARTIAL']
            ).aggregate(total=Sum('balance_amount'))['total'] or Decimal('0.00')

            billed = collected + pending
            collection_rate = float(collected / billed * 100) if billed > 0 else None

            branding = getattr(tenant, 'branding', None)
            location = (branding.school_address.strip() if branding and branding.school_address else '') or None

            total_students += tenant.student_count
            total_staff += tenant.staff_count
            total_revenue += collected
            total_pending += pending

            schools_breakdown.append({
                'id': tenant.id,
                'name': tenant.name,
                'subdomain': tenant.subdomain,
                'is_active': tenant.is_active,
                'location': location,
                'student_count': tenant.student_count,
                'staff_count': tenant.staff_count,
                'revenue_collected': float(collected),
                'revenue_pending': float(pending),
                'collection_rate': collection_rate,
            })

        return Response({
            'overview': {
                'schools': tenants.count(),
                'students': total_students,
                'staff': total_staff,
                'total_revenue': float(total_revenue),
                'total_pending': float(total_pending),
            },
            'schools_breakdown': schools_breakdown
        })

    @action(detail=False, methods=['post'])
    def push_curriculum(self, request):
        """
        Push a standard set of subjects to some or all tenants.

        Body:
        {
            "subjects": [{"name": "Mathematics", "code": "MATH", "subject_type": "THEORY"}, ...],
            "tenant_ids": ["<uuid>", ...]  // optional - defaults to all active tenants
        }
        """
        from tenants.models import Subject

        subjects_payload = request.data.get('subjects') or []
        tenant_ids = request.data.get('tenant_ids')

        if not subjects_payload:
            return Response(
                {'error': 'subjects is required (list of {name, code})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tenants_qs = Tenant.objects.filter(is_active=True)
        if tenant_ids:
            tenants_qs = tenants_qs.filter(id__in=tenant_ids)

        created_count = 0
        skipped = []

        for tenant in tenants_qs:
            for subject_data in subjects_payload:
                name = (subject_data.get('name') or '').strip()
                code = (subject_data.get('code') or '').strip().upper()
                if not name or not code:
                    continue

                # Avoid creating a duplicate under either the name or code constraint
                if Subject.objects.filter(tenant=tenant).filter(Q(name=name) | Q(code=code)).exists():
                    continue

                Subject.objects.create(
                    tenant=tenant,
                    name=name,
                    code=code,
                    subject_type=subject_data.get('subject_type', 'THEORY')
                )
                created_count += 1

        return Response({
            'status': 'success',
            'schools_affected': tenants_qs.count(),
            'subjects_created': created_count,
        })
