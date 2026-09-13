"""
Tests for the Group Headquarters cross-tenant dashboard and curriculum push.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, Subject
from fees.models import FeeCategory, FeeTransaction, FeeInvoice, FeeStructure
from tenants.models import AcademicYear
from students.models import Student
from datetime import date

User = get_user_model()


class HeadquartersDashboardTests(APITestCase):

    def setUp(self):
        self.tenant_a = Tenant.objects.create(
            name='HQ School A', subdomain='hqschoola', admin_email='a@hq.example.com'
        )
        self.tenant_b = Tenant.objects.create(
            name='HQ School B', subdomain='hqschoolb', admin_email='b@hq.example.com'
        )

        Student.objects.create(
            tenant=self.tenant_a, admission_number='HQA1', admission_date=date(2024, 1, 1),
            first_name='A', last_name='One', date_of_birth=date(2015, 1, 1), gender='M', is_active=True
        )

        self.academic_year = AcademicYear.objects.create(
            tenant=self.tenant_a, name='2025-2026',
            start_date=date(2025, 6, 1), end_date=date(2026, 4, 30), is_active=True
        )
        invoice = FeeInvoice.objects.create(
            tenant=self.tenant_a,
            student=Student.objects.filter(tenant=self.tenant_a).first(),
            invoice_number='INV0001',
            academic_year=self.academic_year,
            invoice_date=date(2025, 6, 1),
            due_date=date(2025, 6, 6),
            total_amount=Decimal('1000.00'),
            balance_amount=Decimal('400.00'),
            paid_amount=Decimal('600.00'),
            status='PARTIAL',
        )
        FeeTransaction.objects.create(
            tenant=self.tenant_a,
            invoice=invoice,
            transaction_number='TXN0001',
            amount=Decimal('600.00'),
            payment_mode='CASH',
            payment_reference='REF1',
            receipt_number='REC0001',
        )

        self.superuser = User.objects.create_superuser(
            email='super@hq.example.com', password='testpass123'
        )
        self.client.force_authenticate(user=self.superuser)

    def test_dashboard_aggregates_across_tenants(self):
        response = self.client.get('/api/v1/tenants/hq/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertGreaterEqual(response.data['overview']['schools'], 2)
        self.assertEqual(response.data['overview']['total_revenue'], 600.0)
        self.assertEqual(response.data['overview']['total_pending'], 400.0)

        school_a = next(s for s in response.data['schools_breakdown'] if s['name'] == 'HQ School A')
        self.assertEqual(school_a['revenue_collected'], 600.0)
        self.assertEqual(school_a['revenue_pending'], 400.0)
        self.assertEqual(school_a['collection_rate'], 60.0)

    def test_push_curriculum_creates_subjects_for_all_tenants(self):
        response = self.client.post('/api/v1/tenants/hq/push_curriculum/', {
            'subjects': [{'name': 'Mathematics', 'code': 'MATH'}]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['subjects_created'], 2)
        self.assertTrue(Subject.objects.filter(tenant=self.tenant_a, code='MATH').exists())
        self.assertTrue(Subject.objects.filter(tenant=self.tenant_b, code='MATH').exists())

    def test_push_curriculum_skips_existing_subject(self):
        Subject.objects.create(tenant=self.tenant_a, name='Mathematics', code='MATH')

        response = self.client.post('/api/v1/tenants/hq/push_curriculum/', {
            'subjects': [{'name': 'Mathematics', 'code': 'MATH'}]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        # Only tenant_b should get a new subject; tenant_a already has it
        self.assertEqual(response.data['subjects_created'], 1)

    def test_non_admin_forbidden(self):
        regular_user = User.objects.create_user(
            email='teacher@hq.example.com', password='testpass123', tenant=self.tenant_a
        )
        self.client.force_authenticate(user=regular_user)
        response = self.client.get('/api/v1/tenants/hq/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
