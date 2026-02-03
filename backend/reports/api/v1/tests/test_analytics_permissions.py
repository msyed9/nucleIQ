"""
Tests for analytics permissions and filters.
"""

from datetime import date

from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status

from tenants.models import Tenant
from users.models import User, Role


@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'
    }
})
class AnalyticsPermissionTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Test School',
            subdomain='test-school',
            admin_email='test@school.com'
        )

        self.client = APIClient()
        self.client.credentials(HTTP_X_TENANT_ID=str(self.tenant.id))

        self.user = User.objects.create_user(
            email='teacher@test.com',
            password='testpass123',
            tenant=self.tenant
        )

        self.finance_user = User.objects.create_user(
            email='accountant@test.com',
            password='testpass123',
            tenant=self.tenant
        )

        self.finance_role = Role.objects.create(
            tenant=self.tenant,
            name='Accountant',
            code='accountant'
        )
        self.finance_user.roles.add(self.finance_role)

    def test_fee_collection_trends_requires_finance_role(self):
        """Non-finance users should not access fee analytics."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/reports/analytics/fee_collection_trends/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_fee_collection_trends_allows_finance_role(self):
        """Finance users should access fee analytics."""
        self.client.force_authenticate(user=self.finance_user)
        response = self.client.get('/api/reports/analytics/fee_collection_trends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_attendance_trends_accepts_date_range(self):
        """Attendance trends should accept date filters."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            '/api/reports/analytics/attendance_trends/',
            {'start_date': date.today().isoformat(), 'end_date': date.today().isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)