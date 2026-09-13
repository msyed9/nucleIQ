"""
Tests for the unified QR resolution service (idcards.qr_resolution) and the
manual/external QR scanning API.
"""

from datetime import date, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant
from users.models import User
from students.models import Student
from staff.models import Staff

from idcards.qr_resolution import (
    resolve_qr_identity,
    validate_manual_qr_uniqueness,
    normalize_manual_qr_value,
    QRResolutionError,
    SOURCE_GENERATED,
    SOURCE_MANUAL,
    SOURCE_LEGACY_ID,
)
from idcards.utils import create_qr_code_record


def _make_tenant(subdomain='qrschool'):
    return Tenant.objects.create(
        name='QR Test School',
        subdomain=subdomain,
        admin_email=f'{subdomain}@example.com'
    )


def _make_student(tenant, admission_number='ADM001', **extra):
    return Student.objects.create(
        tenant=tenant,
        admission_number=admission_number,
        admission_date=date(2024, 1, 1),
        first_name='Jane',
        last_name='Doe',
        date_of_birth=date(2012, 5, 1),
        gender='F',
        is_active=True,
        **extra
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


class ManualQRModelTests(TestCase):
    """Field-level normalization and uniqueness rules."""

    def setUp(self):
        self.tenant = _make_tenant()

    def test_normalize_strips_whitespace_and_blanks_become_none(self):
        self.assertEqual(normalize_manual_qr_value('  ABC123  '), 'ABC123')
        self.assertIsNone(normalize_manual_qr_value('   '))
        self.assertIsNone(normalize_manual_qr_value(None))

    def test_duplicate_manual_qr_rejected_student_vs_student(self):
        _make_student(self.tenant, admission_number='S1', manual_qr_code='EXT-1')
        with self.assertRaises(ValidationError):
            validate_manual_qr_uniqueness('EXT-1', self.tenant)

    def test_duplicate_manual_qr_rejected_student_vs_staff(self):
        _make_student(self.tenant, admission_number='S1', manual_qr_code='EXT-1')
        with self.assertRaises(ValidationError):
            validate_manual_qr_uniqueness('EXT-1', self.tenant, exclude_staff_id=None)

    def test_no_conflict_when_excluding_self(self):
        student = _make_student(self.tenant, admission_number='S1', manual_qr_code='EXT-1')
        # Should not raise when excluding the record that already owns the value
        validate_manual_qr_uniqueness('EXT-1', self.tenant, exclude_student_id=student.id)

    def test_model_level_unique_constraint(self):
        _make_student(self.tenant, admission_number='S1', manual_qr_code='EXT-1')
        with self.assertRaises(Exception):
            _make_student(self.tenant, admission_number='S2', manual_qr_code='EXT-1')


class QRResolutionServiceTests(TestCase):
    """Unit tests for resolve_qr_identity covering all three resolution paths."""

    def setUp(self):
        self.tenant = _make_tenant()
        self.student = _make_student(self.tenant, admission_number='ADM100')
        self.staff = _make_staff(self.tenant, employee_id='EMP100')

    def test_resolves_generated_student_qr(self):
        qr_code = create_qr_code_record(self.student, 'student', self.tenant)
        identity = resolve_qr_identity(self.tenant, qr_code.qr_data)
        self.assertEqual(identity.entity_type, 'student')
        self.assertEqual(identity.entity.id, self.student.id)
        self.assertEqual(identity.source, SOURCE_GENERATED)

    def test_resolves_generated_staff_qr(self):
        qr_code = create_qr_code_record(self.staff, 'staff', self.tenant)
        identity = resolve_qr_identity(self.tenant, qr_code.qr_data)
        self.assertEqual(identity.entity_type, 'staff')
        self.assertEqual(identity.entity.id, self.staff.id)
        self.assertEqual(identity.source, SOURCE_GENERATED)

    def test_resolves_manual_qr_for_student(self):
        self.student.manual_qr_code = 'EXTERNAL-STUDENT-1'
        self.student.save(update_fields=['manual_qr_code'])

        identity = resolve_qr_identity(self.tenant, 'EXTERNAL-STUDENT-1')
        self.assertEqual(identity.entity_type, 'student')
        self.assertEqual(identity.entity.id, self.student.id)
        self.assertEqual(identity.source, SOURCE_MANUAL)
        self.assertIsNone(identity.qr_code)

    def test_resolves_manual_qr_for_staff(self):
        self.staff.manual_qr_code = 'EXTERNAL-STAFF-1'
        self.staff.save(update_fields=['manual_qr_code'])

        identity = resolve_qr_identity(self.tenant, 'EXTERNAL-STAFF-1')
        self.assertEqual(identity.entity_type, 'staff')
        self.assertEqual(identity.entity.id, self.staff.id)
        self.assertEqual(identity.source, SOURCE_MANUAL)

    def test_legacy_fallback_admission_number(self):
        identity = resolve_qr_identity(self.tenant, self.student.admission_number)
        self.assertEqual(identity.entity_type, 'student')
        self.assertEqual(identity.source, SOURCE_LEGACY_ID)

    def test_legacy_fallback_employee_id(self):
        identity = resolve_qr_identity(self.tenant, self.staff.employee_id)
        self.assertEqual(identity.entity_type, 'staff')
        self.assertEqual(identity.source, SOURCE_LEGACY_ID)

    def test_unknown_qr_raises(self):
        with self.assertRaises(QRResolutionError):
            resolve_qr_identity(self.tenant, 'no-such-code')

    def test_empty_qr_raises(self):
        with self.assertRaises(QRResolutionError):
            resolve_qr_identity(self.tenant, '   ')

    def test_manual_qr_on_inactive_student_not_resolved(self):
        self.student.manual_qr_code = 'INACTIVE-1'
        self.student.is_active = False
        self.student.save(update_fields=['manual_qr_code', 'is_active'])

        with self.assertRaises(QRResolutionError):
            resolve_qr_identity(self.tenant, 'INACTIVE-1')

    def test_manual_qr_on_inactive_staff_not_resolved(self):
        self.staff.manual_qr_code = 'INACTIVE-2'
        self.staff.status = 'RESIGNED'
        self.staff.save(update_fields=['manual_qr_code', 'status'])

        with self.assertRaises(QRResolutionError):
            resolve_qr_identity(self.tenant, 'INACTIVE-2')


class QRScanAPITests(APITestCase):
    """Integration tests for the /idcards/scan/ endpoint using manual QR."""

    def setUp(self):
        self.tenant = _make_tenant(subdomain='qrscanschool')
        self.student = _make_student(self.tenant, admission_number='ADM200', manual_qr_code='EXT-SCAN-1')
        self.user = User.objects.create_user(
            email='scanner@qrscanschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.user)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def test_scan_manual_qr_marks_attendance(self):
        response = self.client.post(
            '/api/v1/idcards/scan/',
            {'qr_data': 'EXT-SCAN-1'},
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['qr_source'], SOURCE_MANUAL)
        self.assertEqual(response.data['student']['admission_no'], 'ADM200')

    def test_scan_unknown_qr_returns_400(self):
        response = self.client.post(
            '/api/v1/idcards/scan/',
            {'qr_data': 'does-not-exist'},
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
