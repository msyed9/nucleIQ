"""
Tests for monthly invoice generation: dry-run preview vs actual creation,
and class-wise scoping.
"""

from datetime import date

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from users.models import User
from students.models import Student, StudentEnrollment
from fees.models import FeeCategory, FeeStructure, FeeAllocation, FeeInvoice


def _make_tenant(subdomain='feegenschool'):
    return Tenant.objects.create(
        name='Fee Generation Test School',
        subdomain=subdomain,
        admin_email=f'{subdomain}@example.com'
    )


class GenerateMonthlyInvoicesTests(APITestCase):

    def setUp(self):
        self.tenant = _make_tenant()
        self.academic_year = AcademicYear.objects.create(
            tenant=self.tenant,
            name='2025-2026',
            start_date=date(2025, 6, 1),
            end_date=date(2026, 4, 30),
            is_active=True,
        )
        self.grade = GradeLevel.objects.create(tenant=self.tenant, name='Grade 1', short_name='1', display_order=1)
        self.section = Section.objects.create(tenant=self.tenant, name='A', grade_level=self.grade, capacity=40)

        self.category = FeeCategory.objects.create(tenant=self.tenant, name='Tuition', code='TUITION')
        self.structure = FeeStructure.objects.create(
            tenant=self.tenant,
            academic_year=self.academic_year,
            class_level='Grade 1',
            category=self.category,
            amount=1000,
            frequency='MONTHLY',
        )

        self.student = Student.objects.create(
            tenant=self.tenant,
            admission_number='ADM500',
            admission_date=date(2024, 1, 1),
            first_name='Alex',
            last_name='Doe',
            date_of_birth=date(2015, 1, 1),
            gender='M',
            is_active=True,
        )
        StudentEnrollment.objects.create(
            tenant=self.tenant,
            student=self.student,
            academic_year=self.academic_year,
            section=self.section,
            enrollment_date=date(2025, 6, 1),
            status='ACTIVE',
        )
        FeeAllocation.objects.create(
            tenant=self.tenant,
            student=self.student,
            fee_structure=self.structure,
            is_active=True,
        )

        self.admin = User.objects.create_user(
            email='admin@feegenschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def test_dry_run_previews_without_creating_invoices(self):
        response = self.client.post(
            '/api/v1/fees/invoices/generate_monthly/', {'dry_run': True}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data['dry_run'])
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['preview']), 1)
        self.assertEqual(response.data['preview'][0]['admission_number'], 'ADM500')
        self.assertEqual(FeeInvoice.objects.filter(tenant=self.tenant).count(), 0)

    def test_actual_generation_creates_invoice(self):
        response = self.client.post(
            '/api/v1/fees/invoices/generate_monthly/', {'dry_run': False}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data['dry_run'])
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(FeeInvoice.objects.filter(tenant=self.tenant, student=self.student).count(), 1)

    def test_class_wise_scoping_excludes_other_grades(self):
        other_grade = GradeLevel.objects.create(tenant=self.tenant, name='Grade 2', short_name='2', display_order=2)

        response = self.client.post(
            '/api/v1/fees/invoices/generate_monthly/',
            {'dry_run': True, 'grade_level_ids': [str(other_grade.id)]},
            format='json',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['count'], 0)
