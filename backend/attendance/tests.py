"""
Tests for attendance marking via ID card QR scan (generated + manual/external QR).
"""

from datetime import date, timedelta

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear
from users.models import User
from students.models import Student
from staff.models import Staff
from attendance.models import AttendanceRecord
from idcards.utils import create_qr_code_record


def _make_tenant(subdomain='attqrschool'):
    return Tenant.objects.create(
        name='Attendance QR Test School',
        subdomain=subdomain,
        admin_email=f'{subdomain}@example.com'
    )


def _make_academic_year(tenant):
    return AcademicYear.objects.create(
        tenant=tenant,
        name='2025-2026',
        start_date=date(2025, 6, 1),
        end_date=date(2026, 4, 30),
        is_active=True,
    )


def _make_student(tenant, admission_number='ADM001', is_active=True, **extra):
    return Student.objects.create(
        tenant=tenant,
        admission_number=admission_number,
        admission_date=date(2024, 1, 1),
        first_name='Jane',
        last_name='Doe',
        date_of_birth=date(2012, 5, 1),
        gender='F',
        is_active=is_active,
        **extra
    )


class ScanIdCardAttendanceParityTests(APITestCase):
    """
    Scanning a manually assigned/external QR must mark attendance exactly like
    scanning the system-generated QR (or the legacy plain admission number).
    """

    def setUp(self):
        self.tenant = _make_tenant()
        self.academic_year = _make_academic_year(self.tenant)
        self.user = User.objects.create_user(
            email='scanner@attqrschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.user)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def _scan(self, qr_data):
        return self.client.post(
            '/api/v1/attendance/records/scan_idcard/',
            {'qr_data': qr_data},
            **self.headers
        )

    def test_scan_via_generated_qr_marks_attendance(self):
        student = _make_student(self.tenant, admission_number='ADM400')
        qr_code = create_qr_code_record(student, 'student', self.tenant)

        response = self._scan(qr_code.qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        record = AttendanceRecord.objects.get(tenant=self.tenant, student=student, date=date.today())
        self.assertEqual(record.method, 'QR_CODE')
        self.assertEqual(record.record_type, 'STUDENT')

    def test_scan_via_manual_qr_marks_same_attendance_shape(self):
        student = _make_student(self.tenant, admission_number='ADM401', manual_qr_code='EXT-ATT-1')

        response = self._scan('EXT-ATT-1')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['qr_source'], 'manual')

        record = AttendanceRecord.objects.get(tenant=self.tenant, student=student, date=date.today())
        self.assertEqual(record.method, 'QR_CODE')
        self.assertEqual(record.record_type, 'STUDENT')
        self.assertEqual(record.status, response.data['attendance']['status'])

    def test_scan_via_legacy_admission_number_still_works(self):
        student = _make_student(self.tenant, admission_number='ADM402')

        response = self.client.post(
            '/api/v1/attendance/records/scan_idcard/',
            {'admission_number': 'ADM402'},
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        AttendanceRecord.objects.get(tenant=self.tenant, student=student, date=date.today())

    def test_scan_unknown_qr_returns_404(self):
        response = self._scan('totally-unknown-code')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_scan_manual_qr_for_inactive_student_rejected(self):
        _make_student(
            self.tenant, admission_number='ADM403',
            manual_qr_code='EXT-ATT-2', is_active=False
        )
        response = self._scan('EXT-ATT-2')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

