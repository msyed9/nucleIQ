"""
Tests for the complaints module: RBAC visibility rules and the API endpoints.

Role detection is structural (staff profile / class-teacher / parent profile),
so the fixtures below build those relationships rather than only assigning role
codes. The one role code exercised directly is the "full access" tier
(principal), matched via users.UserRole.
"""

from datetime import date

from rest_framework.test import APITestCase
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from users.models import User, Role, UserRole
from students.models import Student, StudentEnrollment, ParentUser

from complaints.models import Complaint


def _make_tenant(subdomain='complaintschool'):
    return Tenant.objects.create(
        name='Complaint Test School',
        subdomain=subdomain,
        admin_email=f'{subdomain}@example.com',
    )


def _make_student(tenant, admission_number, **extra):
    return Student.objects.create(
        tenant=tenant,
        admission_number=admission_number,
        admission_date=date(2024, 1, 1),
        first_name='Test',
        last_name=admission_number,
        date_of_birth=date(2012, 5, 1),
        gender='M',
        is_active=True,
        **extra,
    )


def _make_user(tenant, email, **extra):
    return User.objects.create_user(
        email=email, password='testpass123', tenant=tenant, **extra
    )


class ComplaintRBACTests(APITestCase):
    LIST_URL = '/api/v1/complaints/complaints/'

    def setUp(self):
        self.tenant = _make_tenant()
        self.headers = {'HTTP_X_TENANT_ID': str(self.tenant.id)}

        # Users
        self.principal = _make_user(self.tenant, 'principal@complaintschool.example.com')
        principal_role = Role.objects.create(
            tenant=self.tenant, name='Principal', code='principal', is_active=True
        )
        UserRole.objects.create(user=self.principal, role=principal_role)

        self.teacher = _make_user(self.tenant, 'teacher@complaintschool.example.com')
        self.parent = _make_user(self.tenant, 'parent@complaintschool.example.com')
        self.receptionist = _make_user(self.tenant, 'reception@complaintschool.example.com')

        # Students
        self.child = _make_student(self.tenant, 'CHILD01')
        self.taught_student = _make_student(self.tenant, 'TAUGHT01')
        self.other_student = _make_student(self.tenant, 'OTHER01')

        # Parent -> child link
        parent_profile = ParentUser.objects.create(
            user=self.parent, tenant=self.tenant, relation_type='FATHER'
        )
        parent_profile.students.add(self.child)

        # Teacher -> taught_student via class-teacher of a section
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

        # Complaints
        self.c_recept = Complaint.objects.create(
            tenant=self.tenant, student=self.other_student, created_by=self.receptionist,
            title='Broken locker', description='...', type='ISSUE',
        )
        self.c_child = Complaint.objects.create(
            tenant=self.tenant, student=self.child, created_by=self.principal,
            title='Fee query', description='...', type='QUERY',
        )
        self.c_taught = Complaint.objects.create(
            tenant=self.tenant, student=self.taught_student, created_by=self.principal,
            title='Behaviour note', description='...', type='COMPLAINT',
        )

    def _items(self, response):
        data = response.data
        return data['results'] if isinstance(data, dict) and 'results' in data else data

    def _ids(self, response):
        return {str(item['id']) for item in self._items(response)}

    def test_principal_sees_all(self):
        self.client.force_authenticate(self.principal)
        res = self.client.get(self.LIST_URL, **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(
            self._ids(res),
            {str(self.c_recept.id), str(self.c_child.id), str(self.c_taught.id)},
        )

    def test_receptionist_sees_only_own(self):
        self.client.force_authenticate(self.receptionist)
        res = self.client.get(self.LIST_URL, **self.headers)
        self.assertEqual(self._ids(res), {str(self.c_recept.id)})

    def test_parent_sees_own_childs_entry(self):
        self.client.force_authenticate(self.parent)
        res = self.client.get(self.LIST_URL, **self.headers)
        self.assertEqual(self._ids(res), {str(self.c_child.id)})

    def test_teacher_sees_taught_students_entry(self):
        self.client.force_authenticate(self.teacher)
        res = self.client.get(self.LIST_URL, **self.headers)
        self.assertEqual(self._ids(res), {str(self.c_taught.id)})

    def test_unrelated_user_cannot_retrieve_others_entry(self):
        self.client.force_authenticate(self.receptionist)
        res = self.client.get(f'{self.LIST_URL}{self.c_child.id}/', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_sets_created_by_and_tenant(self):
        self.client.force_authenticate(self.receptionist)
        res = self.client.post(
            self.LIST_URL,
            {'title': 'Bus late', 'description': 'Route 3 late', 'type': 'ISSUE',
             'category': 'TRANSPORT', 'student': str(self.other_student.id)},
            format='json', **self.headers,
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        complaint = Complaint.objects.get(pk=res.data['id'])
        self.assertEqual(complaint.created_by_id, self.receptionist.id)
        self.assertEqual(complaint.tenant_id, self.tenant.id)
        self.assertEqual(complaint.status, 'OPEN')

    def test_create_rejects_student_from_another_tenant(self):
        other_tenant = _make_tenant(subdomain='othercomplaintschool')
        foreign_student = _make_student(other_tenant, 'FOREIGN01')
        self.client.force_authenticate(self.receptionist)
        res = self.client.post(
            self.LIST_URL,
            {'title': 'x', 'description': 'y', 'type': 'ISSUE',
             'student': str(foreign_student.id)},
            format='json', **self.headers,
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_sets_status_and_timestamp(self):
        self.client.force_authenticate(self.principal)
        res = self.client.post(
            f'{self.LIST_URL}{self.c_recept.id}/resolve/',
            {'resolution_notes': 'Fixed', 'status': 'RESOLVED'},
            format='json', **self.headers,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.c_recept.refresh_from_db()
        self.assertEqual(self.c_recept.status, 'RESOLVED')
        self.assertIsNotNone(self.c_recept.resolved_at)
        self.assertEqual(self.c_recept.resolution_notes, 'Fixed')

    def test_assign_requires_full_access(self):
        # Receptionist (not full access) cannot assign.
        self.client.force_authenticate(self.receptionist)
        res = self.client.post(
            f'{self.LIST_URL}{self.c_recept.id}/assign/',
            {'assigned_to': str(self.teacher.id)}, format='json', **self.headers,
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Principal can assign.
        self.client.force_authenticate(self.principal)
        res = self.client.post(
            f'{self.LIST_URL}{self.c_recept.id}/assign/',
            {'assigned_to': str(self.teacher.id)}, format='json', **self.headers,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.c_recept.refresh_from_db()
        self.assertEqual(self.c_recept.assigned_to_id, self.teacher.id)
        self.assertEqual(self.c_recept.status, 'IN_PROGRESS')

    def test_assignee_sees_assigned_entry(self):
        # After assignment, the teacher sees the entry via the assigned_to branch.
        self.c_recept.assigned_to = self.teacher
        self.c_recept.save(update_fields=['assigned_to'])
        self.client.force_authenticate(self.teacher)
        res = self.client.get(self.LIST_URL, **self.headers)
        self.assertIn(str(self.c_recept.id), self._ids(res))

    def test_my_endpoint_returns_created_and_assigned(self):
        self.c_taught.assigned_to = self.receptionist
        self.c_taught.save(update_fields=['assigned_to'])
        self.client.force_authenticate(self.receptionist)
        res = self.client.get(f'{self.LIST_URL}my/', **self.headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(
            self._ids(res), {str(self.c_recept.id), str(self.c_taught.id)}
        )
