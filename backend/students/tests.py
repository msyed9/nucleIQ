"""
Tests for the manual/external QR code assignment API on the Student model
and for the Student Analytics endpoints (by-gender / by-class / by-age /
drill-down).
"""

from datetime import date

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from users.models import User
from students.models import Student, StudentEnrollment


def _make_tenant(subdomain='studentqrschool'):
    return Tenant.objects.create(
        name='Student QR Test School',
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


class StudentManualQRAPITests(APITestCase):

    def setUp(self):
        self.tenant = _make_tenant()
        self.student = _make_student(self.tenant, admission_number='ADM300')
        self.other_student = _make_student(self.tenant, admission_number='ADM301')

        self.admin = User.objects.create_user(
            email='admin@studentqrschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def _url(self, student):
        return f'/api/v1/students/students/{student.id}/manual-qr/'

    def test_set_manual_qr_code(self):
        response = self.client.put(
            self._url(self.student), {'qr_text': '  ext-code-001  '}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['manual_qr_code'], 'ext-code-001')

        self.student.refresh_from_db()
        self.assertEqual(self.student.manual_qr_code, 'ext-code-001')

    def test_duplicate_manual_qr_rejected(self):
        self.student.manual_qr_code = 'shared-code'
        self.student.save(update_fields=['manual_qr_code'])

        response = self.client.put(
            self._url(self.other_student), {'qr_text': 'shared-code'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_clear_manual_qr_code(self):
        self.student.manual_qr_code = 'to-be-removed'
        self.student.save(update_fields=['manual_qr_code'])

        response = self.client.delete(self._url(self.student), **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['manual_qr_code'])

        self.student.refresh_from_db()
        self.assertIsNone(self.student.manual_qr_code)

    def test_empty_value_rejected(self):
        response = self.client.put(self._url(self.student), {'qr_text': '   '}, **self.headers)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_forbidden(self):
        regular_user = User.objects.create_user(
            email='teacher@studentqrschool.example.com',
            password='testpass123',
            tenant=self.tenant,
        )
        self.client.force_authenticate(user=regular_user)

        response = self.client.put(
            self._url(self.student), {'qr_text': 'x'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class StudentAnalyticsAPITests(APITestCase):
    """Covers /students/students/analytics/{by-gender,by-class,by-age,students}/."""

    BASE = '/api/v1/students/students/analytics'

    def setUp(self):
        self.tenant = _make_tenant(subdomain='analyticsschool')
        self.academic_year = AcademicYear.objects.create(
            tenant=self.tenant,
            name='2025-2026',
            start_date=date(2025, 6, 1),
            end_date=date(2026, 4, 30),
            is_active=True,
        )
        self.grade1 = GradeLevel.objects.create(
            tenant=self.tenant, name='Grade 1', short_name='1', display_order=1
        )
        self.grade2 = GradeLevel.objects.create(
            tenant=self.tenant, name='Grade 2', short_name='2', display_order=2
        )
        self.section_a = Section.objects.create(
            tenant=self.tenant, name='A', grade_level=self.grade1, capacity=40
        )
        self.section_b = Section.objects.create(
            tenant=self.tenant, name='B', grade_level=self.grade2, capacity=40
        )

        # Two Grade-1 boys (age 11 -> 11-13), one Grade-2 girl (age 8 -> 8-10).
        # Ages are relative to the current year, so derive DOBs from today.
        this_year = date.today().year
        self.s1 = self._student('AN001', 'M', date(this_year - 11, 1, 1), date(2024, 6, 1), self.section_a)
        self.s2 = self._student('AN002', 'M', date(this_year - 11, 1, 1), date(2023, 1, 1), self.section_a)
        self.s3 = self._student('AN003', 'F', date(this_year - 8, 1, 1), date(2025, 6, 1), self.section_b)

        self.admin = User.objects.create_user(
            email='admin@analyticsschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def _student(self, admission_number, gender, dob, admission_date, section):
        student = Student.objects.create(
            tenant=self.tenant,
            admission_number=admission_number,
            admission_date=admission_date,
            first_name='Test',
            last_name=admission_number,
            date_of_birth=dob,
            gender=gender,
            is_active=True,
        )
        StudentEnrollment.objects.create(
            tenant=self.tenant,
            student=student,
            academic_year=self.academic_year,
            section=section,
            enrollment_date=admission_date,
            status='ACTIVE',
        )
        return student

    def test_by_gender(self):
        response = self.client.get(f'{self.BASE}/by-gender/', **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data.get('M'), 2)
        self.assertEqual(response.data.get('F'), 1)

    def test_by_class(self):
        response = self.client.get(f'{self.BASE}/by-class/', **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        counts = {row['class_name']: row['count'] for row in response.data}
        self.assertEqual(counts.get('Grade 1'), 2)
        self.assertEqual(counts.get('Grade 2'), 1)

    def test_by_age(self):
        response = self.client.get(f'{self.BASE}/by-age/', **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        ranges = {row['age_range']: row['count'] for row in response.data}
        self.assertEqual(ranges.get('11-13'), 2)
        self.assertEqual(ranges.get('8-10'), 1)

    def test_drilldown_by_gender(self):
        response = self.client.get(
            f'{self.BASE}/students/', {'dimension': 'gender', 'value': 'M'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        admission_numbers = {s['admission_number'] for s in response.data}
        self.assertEqual(admission_numbers, {'AN001', 'AN002'})

    def test_drilldown_by_class(self):
        response = self.client.get(
            f'{self.BASE}/students/', {'dimension': 'class', 'value': 'Grade 2'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual([s['admission_number'] for s in response.data], ['AN003'])

    def test_drilldown_requires_dimension_and_value(self):
        response = self.client.get(f'{self.BASE}/students/', {'dimension': 'gender'}, **self.headers)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_date_filter_scopes_by_admission_date(self):
        # Only s1 (2024-06-01) and s3 (2025-06-01) were admitted on/after 2024-01-01; s2 (2023) is excluded.
        response = self.client.get(
            f'{self.BASE}/by-gender/', {'date_from': '2024-01-01'}, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data.get('M'), 1)
        self.assertEqual(response.data.get('F'), 1)
