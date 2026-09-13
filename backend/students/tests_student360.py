"""
Tests for the Student 360 profile endpoint's RBAC and response shape.

Focus is on the access rules added for the aggregated profile
(students.permissions.CanViewStudentProfile) and on the composite response
including the newly aggregated sections (complaints, homework, exam_results).

Role detection is structural, so fixtures build the relationships (class-teacher
of a section + active enrollment) rather than only assigning role codes. The one
code-based tier is "full access" (principal), matched via users.UserRole.
"""

from datetime import date

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from users.models import User, Role, UserRole
from students.models import Student, StudentEnrollment


def _make_tenant(subdomain='threesixty'):
    return Tenant.objects.create(
        name='360 Test School',
        subdomain=subdomain,
        admin_email=f'{subdomain}@example.com',
    )


def _make_student(tenant, admission_number):
    return Student.objects.create(
        tenant=tenant,
        admission_number=admission_number,
        admission_date=date(2024, 1, 1),
        first_name='Test',
        last_name=admission_number,
        date_of_birth=date(2012, 5, 1),
        gender='M',
        is_active=True,
    )


def _make_user(tenant, email):
    return User.objects.create_user(email=email, password='testpass123', tenant=tenant)


class Student360AccessTests(APITestCase):
    def _url(self, student):
        return f'/api/v1/students/students/{student.id}/profile_360/'

    def setUp(self):
        self.tenant = _make_tenant()
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

        # Full-access user (principal via role code).
        self.principal = _make_user(self.tenant, 'principal@threesixty.example.com')
        principal_role = Role.objects.create(
            tenant=self.tenant, name='Principal', code='principal', is_active=True
        )
        UserRole.objects.create(user=self.principal, role=principal_role)

        # Teacher: class-teacher of a section, teaches `taught_student`.
        self.teacher = _make_user(self.tenant, 'teacher@threesixty.example.com')
        self.receptionist = _make_user(self.tenant, 'reception@threesixty.example.com')

        self.taught_student = _make_student(self.tenant, 'TAUGHT01')
        self.other_student = _make_student(self.tenant, 'OTHER01')

        year = AcademicYear.objects.create(
            tenant=self.tenant, name='2024-2025',
            start_date=date(2024, 4, 1), end_date=date(2025, 3, 31),
        )
        grade = GradeLevel.objects.create(
            tenant=self.tenant, name='Grade 5', short_name='5', display_order=5,
        )
        section = Section.objects.create(
            tenant=self.tenant, grade_level=grade, name='A', class_teacher=self.teacher,
        )
        StudentEnrollment.objects.create(
            tenant=self.tenant, student=self.taught_student, academic_year=year,
            section=section, status='ACTIVE', enrollment_date=date(2024, 4, 1),
        )

    def test_principal_can_view_any_student(self):
        self.client.force_authenticate(self.principal)
        res = self.client.get(self._url(self.other_student), **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

    def test_teacher_can_view_taught_student(self):
        self.client.force_authenticate(self.teacher)
        res = self.client.get(self._url(self.taught_student), **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

    def test_teacher_cannot_view_untaught_student(self):
        self.client.force_authenticate(self.teacher)
        res = self.client.get(self._url(self.other_student), **self.headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_receptionist_without_relationship_is_forbidden(self):
        self.client.force_authenticate(self.receptionist)
        res = self.client.get(self._url(self.taught_student), **self.headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_response_includes_aggregated_sections(self):
        self.client.force_authenticate(self.principal)
        res = self.client.get(self._url(self.taught_student), **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        for key in (
            'student', 'kpis', 'attendance_details', 'fee_details',
            'complaints', 'homework', 'exam_results',
        ):
            self.assertIn(key, res.data)
        # New sections carry their summary/items structure even when empty.
        self.assertIn('summary', res.data['complaints'])
        self.assertIn('items', res.data['complaints'])
        self.assertIn('summary', res.data['homework'])
        self.assertIn('open_complaints', res.data['kpis'])
