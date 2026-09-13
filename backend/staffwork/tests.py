"""
Tests for the staffwork module: daily-update RBAC + writable nested remarks,
admin-task auto-generation, the consolidated dashboard, and the Student 360
teacher-remarks integration.

Role detection reuses the complaints helpers (structural), so fixtures build a
class-teacher relationship for the teacher and assign the "principal" role code
for the full-access tier.
"""

from datetime import date, time

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from users.models import User, Role, UserRole
from students.models import Student, StudentEnrollment

from staffwork.models import (
    AdminTaskTemplate, AdminTaskInstance, DailyStatusUpdate, StudentDailyRemark,
)
from staffwork.services import TaskGenerationService


def _make_tenant(subdomain='staffworkschool'):
    return Tenant.objects.create(
        name='Staffwork Test School', subdomain=subdomain,
        admin_email=f'{subdomain}@example.com',
    )


def _make_student(tenant, admission_number):
    return Student.objects.create(
        tenant=tenant, admission_number=admission_number,
        admission_date=date(2024, 1, 1), first_name='Test', last_name=admission_number,
        date_of_birth=date(2012, 5, 1), gender='M', is_active=True,
    )


def _make_user(tenant, email, **extra):
    return User.objects.create_user(email=email, password='testpass123', tenant=tenant, **extra)


class StaffworkTestBase(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant()
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

        # Full-access principal
        self.principal = _make_user(self.tenant, 'principal@staffworkschool.example.com')
        self.principal_role = Role.objects.create(
            tenant=self.tenant, name='Principal', code='principal', is_active=True
        )
        UserRole.objects.create(user=self.principal, role=self.principal_role)

        # Teacher (class-teacher of a section) + admin-staff user
        self.teacher = _make_user(self.tenant, 'teacher@staffworkschool.example.com')
        self.finance = _make_user(self.tenant, 'finance@staffworkschool.example.com')

        # Students: one the teacher teaches, one they don't.
        self.taught_student = _make_student(self.tenant, 'TAUGHT01')
        self.other_student = _make_student(self.tenant, 'OTHER01')

        self.year = AcademicYear.objects.create(
            tenant=self.tenant, name='2024-2025',
            start_date=date(2024, 4, 1), end_date=date(2025, 3, 31),
        )
        self.grade = GradeLevel.objects.create(
            tenant=self.tenant, name='Grade 5', short_name='5', display_order=5,
        )
        self.section = Section.objects.create(
            tenant=self.tenant, grade_level=self.grade, name='A', class_teacher=self.teacher,
        )
        StudentEnrollment.objects.create(
            tenant=self.tenant, student=self.taught_student, academic_year=self.year,
            section=self.section, status='ACTIVE', enrollment_date=date(2024, 4, 1),
        )


class DailyUpdateTests(StaffworkTestBase):
    URL = '/api/v1/staffwork/daily-updates/'

    def test_teacher_submits_update_with_nested_remarks(self):
        self.client.force_authenticate(self.teacher)
        payload = {
            'role': 'TEACHER',
            'summary': 'Covered fractions.',
            'status': 'SUBMITTED',
            'student_remarks': [{
                'student': str(self.taught_student.id),
                'did_not_do_homework': True,
                'was_disruptive': True,
                'remark': 'Distracted today.',
                'severity': 'MEDIUM',
            }],
        }
        res = self.client.post(self.URL, payload, format='json', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        update = DailyStatusUpdate.objects.get(pk=res.data['id'])
        self.assertEqual(update.user_id, self.teacher.id)
        self.assertEqual(update.tenant_id, self.tenant.id)
        self.assertEqual(update.student_remarks.count(), 1)

    def test_teacher_cannot_remark_on_untaught_student(self):
        self.client.force_authenticate(self.teacher)
        payload = {
            'role': 'TEACHER', 'summary': 'x',
            'student_remarks': [{'student': str(self.other_student.id), 'was_absent': True}],
        }
        res = self.client.post(self.URL, payload, format='json', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_sees_only_own_updates(self):
        DailyStatusUpdate.objects.create(
            tenant=self.tenant, user=self.teacher, role='TEACHER', date=date.today(), summary='mine')
        DailyStatusUpdate.objects.create(
            tenant=self.tenant, user=self.finance, role='FINANCE', date=date.today(), summary='theirs')
        self.client.force_authenticate(self.finance)
        res = self.client.get(self.URL, **self.headers)
        data = res.data['results'] if isinstance(res.data, dict) and 'results' in res.data else res.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['summary'], 'theirs')

    def test_consolidated_requires_full_access(self):
        DailyStatusUpdate.objects.create(
            tenant=self.tenant, user=self.teacher, role='TEACHER', date=date.today(), summary='mine')
        # Teacher forbidden
        self.client.force_authenticate(self.teacher)
        res = self.client.get(f'{self.URL}consolidated/', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        # Principal allowed
        self.client.force_authenticate(self.principal)
        res = self.client.get(f'{self.URL}consolidated/', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertIn('days', res.data)

    def test_review_sets_reviewed_fields(self):
        upd = DailyStatusUpdate.objects.create(
            tenant=self.tenant, user=self.teacher, role='TEACHER',
            date=date.today(), summary='mine', status='SUBMITTED')
        self.client.force_authenticate(self.principal)
        res = self.client.post(
            f'{self.URL}{upd.id}/review/', {'review_notes': 'Good'}, format='json', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        upd.refresh_from_db()
        self.assertEqual(upd.status, 'REVIEWED')
        self.assertEqual(upd.reviewed_by_id, self.principal.id)


class AdminTaskGenerationTests(StaffworkTestBase):
    def setUp(self):
        super().setUp()
        # The finance user holds a role targeted by a daily template.
        self.finance_role = Role.objects.create(
            tenant=self.tenant, name='Finance', code='finance', is_active=True)
        UserRole.objects.create(user=self.finance, role=self.finance_role)
        self.daily_template = AdminTaskTemplate.objects.create(
            tenant=self.tenant, title='Reconcile fees', role_scope=self.finance_role,
            frequency='DAILY', due_time=time(17, 0), is_active=True)

    def test_generate_is_idempotent(self):
        target = date(2026, 9, 14)
        first = TaskGenerationService.generate(self.tenant, target)
        second = TaskGenerationService.generate(self.tenant, target)
        self.assertEqual(first, 1)
        self.assertEqual(second, 0)  # get_or_create -> no duplicates
        self.assertEqual(
            AdminTaskInstance.objects.filter(assigned_to=self.finance, date=target).count(), 1)

    def test_weekly_template_fires_only_on_configured_day(self):
        weekly = AdminTaskTemplate.objects.create(
            tenant=self.tenant, title='Weekly report', role_scope=self.finance_role,
            frequency='WEEKLY', day_of_week=0, is_active=True)  # Monday
        monday = date(2026, 9, 14)   # a Monday
        tuesday = date(2026, 9, 15)
        self.assertTrue(TaskGenerationService._template_due_on(weekly, monday))
        self.assertFalse(TaskGenerationService._template_due_on(weekly, tuesday))

    def test_mark_overdue(self):
        past = date(2020, 1, 1)
        AdminTaskInstance.objects.create(
            tenant=self.tenant, assigned_to=self.finance, date=past,
            title='Old task', status='PENDING')
        updated = TaskGenerationService.mark_overdue(self.tenant)
        self.assertEqual(updated, 1)

    def test_complete_action(self):
        task = AdminTaskInstance.objects.create(
            tenant=self.tenant, assigned_to=self.finance, date=date.today(),
            title='Task', status='PENDING')
        self.client.force_authenticate(self.finance)
        res = self.client.post(
            f'/api/v1/staffwork/admin-tasks/{task.id}/complete/',
            {'status': 'COMPLETED', 'update_notes': 'done'}, format='json', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        task.refresh_from_db()
        self.assertEqual(task.status, 'COMPLETED')
        self.assertIsNotNone(task.completed_at)


class Student360RemarkTests(StaffworkTestBase):
    def test_remarks_appear_in_360_and_dedicated_endpoint(self):
        upd = DailyStatusUpdate.objects.create(
            tenant=self.tenant, user=self.teacher, role='TEACHER',
            date=date.today(), summary='x')
        StudentDailyRemark.objects.create(
            tenant=self.tenant, daily_update=upd, student=self.taught_student,
            did_not_do_homework=True, was_disruptive=True, severity='HIGH')

        self.client.force_authenticate(self.principal)
        # 360 profile
        res = self.client.get(
            f'/api/v1/students/students/{self.taught_student.id}/profile_360/', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertIn('teacher_remarks', res.data)
        self.assertEqual(len(res.data['teacher_remarks']['items']), 1)

        # Dedicated daily-remarks endpoint
        res = self.client.get(
            f'/api/v1/students/students/{self.taught_student.id}/daily-remarks/', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(len(res.data['items']), 1)
