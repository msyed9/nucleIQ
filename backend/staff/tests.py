"""
Tests for the manual/external QR code assignment API on the Staff model.
"""

from datetime import date

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant
from users.models import User
from staff.models import Staff


def _make_tenant(subdomain='staffqrschool'):
    return Tenant.objects.create(
        name='Staff QR Test School',
        subdomain=subdomain,
        admin_email=f'{subdomain}@example.com'
    )


def _make_staff(tenant, employee_id='EMP001', **extra):
    return Staff.objects.create(
        tenant=tenant,
        employee_id=employee_id,
        first_name='John',
        last_name='Smith',
        designation='TEACHER',
        joining_date=date(2020, 1, 1),
        status='ACTIVE',
        **extra
    )


class StaffManualQRAPITests(APITestCase):

    def setUp(self):
        self.tenant = _make_tenant()
        self.staff = _make_staff(self.tenant, employee_id='EMP300')
        self.other_staff = _make_staff(self.tenant, employee_id='EMP301')

        self.admin = User.objects.create_user(
            email='admin@staffqrschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def _url(self, staff):
        return f'/api/v1/staff/staff/{staff.id}/manual-qr/'

    def test_set_manual_qr_code(self):
        response = self.client.put(
            self._url(self.staff), {'qr_text': 'staff-ext-001'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['manual_qr_code'], 'staff-ext-001')

    def test_duplicate_manual_qr_rejected(self):
        self.staff.manual_qr_code = 'shared-staff-code'
        self.staff.save(update_fields=['manual_qr_code'])

        response = self.client.put(
            self._url(self.other_staff), {'qr_text': 'shared-staff-code'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_clear_manual_qr_code(self):
        self.staff.manual_qr_code = 'to-be-removed'
        self.staff.save(update_fields=['manual_qr_code'])

        response = self.client.delete(self._url(self.staff), **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['manual_qr_code'])

        self.staff.refresh_from_db()
        self.assertIsNone(self.staff.manual_qr_code)

