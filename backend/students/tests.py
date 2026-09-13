"""
Tests for the manual/external QR code assignment API on the Student model
and for the Student Analytics endpoints (by-gender / by-class / by-age /
drill-down).
"""

from datetime import date
from unittest.mock import patch

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from users.models import User
from students.models import Student, StudentEnrollment
from students.services import SiblingLinkingService


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


class SiblingLinkingServiceTests(APITestCase):
    """
    Covers phone-number-based sibling linking:
    - SiblingLinkingService.link_new_student (single-student fallback, used
      by StudentViewSet.perform_create)
    - SiblingLinkingService.sync_tenant (mass sync, used by the
      sync_siblings_task Celery task and the manual sync_siblings endpoint)
    """

    def setUp(self):
        self.tenant = _make_tenant(subdomain='siblingschool')
        self.admin = User.objects.create_user(
            email='admin@siblingschool.example.com',
            password='testpass123',
            tenant=self.tenant,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

    def test_link_new_student_matches_by_father_phone_different_formats(self):
        first = _make_student(
            self.tenant, 'SIB001', father_phone='9876543210', mother_phone=''
        )
        SiblingLinkingService.link_new_student(first)
        first.refresh_from_db()
        self.assertTrue(first.family_id)

        second = _make_student(
            self.tenant, 'SIB002', father_phone='+91 98765-43210', mother_phone=''
        )
        result = SiblingLinkingService.link_new_student(second)
        second.refresh_from_db()

        self.assertTrue(result['linked'])
        self.assertEqual(second.family_id, first.family_id)

    def test_link_new_student_cross_field_match(self):
        """A father's number on one student may appear as the mother's number on a sibling."""
        first = _make_student(self.tenant, 'SIB010', father_phone='9123456780')
        SiblingLinkingService.link_new_student(first)
        first.refresh_from_db()

        second = _make_student(self.tenant, 'SIB011', mother_phone='9123456780', father_phone='')
        SiblingLinkingService.link_new_student(second)
        second.refresh_from_db()

        self.assertEqual(second.family_id, first.family_id)

    def test_link_new_student_no_match_gets_standalone_family_id(self):
        student = _make_student(self.tenant, 'SIB020', father_phone='9000000001')
        result = SiblingLinkingService.link_new_student(student)
        student.refresh_from_db()

        self.assertFalse(result['linked'])
        self.assertTrue(student.family_id)

    def test_link_new_student_merges_two_existing_family_groups(self):
        # Two students already (incorrectly) in separate families...
        a = _make_student(self.tenant, 'SIB030', father_phone='9111111111', family_id='FAM-OLD-A')
        b = _make_student(self.tenant, 'SIB031', father_phone='9222222222', family_id='FAM-OLD-B')

        # ...a new admission shares a phone with each of them, so all three should merge.
        c = _make_student(self.tenant, 'SIB032', father_phone='9111111111', mother_phone='9222222222')
        result = SiblingLinkingService.link_new_student(c)

        a.refresh_from_db()
        b.refresh_from_db()
        c.refresh_from_db()

        self.assertTrue(result['linked'])
        self.assertEqual(a.family_id, b.family_id)
        self.assertEqual(b.family_id, c.family_id)

    def test_sync_tenant_groups_transitively_and_is_idempotent(self):
        # A and B share father_phone; B and C share mother_phone. No family_id set on any yet.
        a = _make_student(self.tenant, 'SIB040', father_phone='9333333333')
        b = _make_student(
            self.tenant, 'SIB041', father_phone='9333333333', mother_phone='9444444444'
        )
        c = _make_student(self.tenant, 'SIB042', mother_phone='9444444444')
        standalone = _make_student(self.tenant, 'SIB043', father_phone='9555555555')

        stats = SiblingLinkingService.sync_tenant(self.tenant)

        a.refresh_from_db()
        b.refresh_from_db()
        c.refresh_from_db()
        standalone.refresh_from_db()

        self.assertEqual(a.family_id, b.family_id)
        self.assertEqual(b.family_id, c.family_id)
        self.assertTrue(standalone.family_id)
        self.assertNotEqual(standalone.family_id, a.family_id)
        self.assertEqual(stats['groups_found'], 1)
        self.assertEqual(stats['linked'], 3)
        self.assertEqual(stats['standalone_assigned'], 1)

        # Re-running should be a no-op: the group is already correctly linked.
        second_run_stats = SiblingLinkingService.sync_tenant(self.tenant)
        self.assertEqual(second_run_stats['linked'], 0)
        self.assertEqual(second_run_stats['skipped_already_linked'], 1)

    def test_sync_siblings_endpoint_requires_tenant_admin(self):
        regular_user = User.objects.create_user(
            email='teacher@siblingschool.example.com',
            password='testpass123',
            tenant=self.tenant,
        )
        self.client.force_authenticate(user=regular_user)

        response = self.client.post(
            '/api/v1/students/students/sync_siblings/', **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sync_siblings_endpoint_links_matching_students(self):
        a = _make_student(self.tenant, 'SIB050', father_phone='9666666666')
        b = _make_student(self.tenant, 'SIB051', father_phone='9666666666')

        response = self.client.post(
            '/api/v1/students/students/sync_siblings/', **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['linked'], 2)

        a.refresh_from_db()
        b.refresh_from_db()
        self.assertEqual(a.family_id, b.family_id)

    def test_sync_siblings_endpoint_async_queues_task(self):
        # Dispatch is mocked so this test doesn't depend on a live Celery
        # broker - it only checks that the view queues the task correctly.
        _make_student(self.tenant, 'SIB060', father_phone='9777777777')
        _make_student(self.tenant, 'SIB061', father_phone='9777777777')

        with patch('students.views.tasks.sync_siblings_task.delay') as mock_delay:
            mock_delay.return_value.id = 'fake-task-id'
            response = self.client.post(
                '/api/v1/students/students/sync_siblings/', {}, format='json',
                HTTP_X_TENANT_ID=str(self.tenant.id), QUERY_STRING='async=true'
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED, response.data)
        self.assertEqual(response.data['task_id'], 'fake-task-id')
        mock_delay.assert_called_once_with(tenant_id=self.tenant.id)

    def test_creating_student_via_api_auto_links_sibling(self):
        existing = _make_student(self.tenant, 'SIB070', father_phone='9888888888')

        payload = {
            'admission_number': 'SIB071',
            'admission_date': '2024-01-01',
            'first_name': 'New',
            'last_name': 'Sibling',
            'date_of_birth': '2013-01-01',
            'gender': 'M',
            'father_phone': '9888888888',
        }
        response = self.client.post(
            '/api/v1/students/students/', payload, **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        existing.refresh_from_db()
        new_student = Student.objects.get(admission_number='SIB071')
        self.assertEqual(new_student.family_id, existing.family_id)
