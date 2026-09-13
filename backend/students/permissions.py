"""
Object-level access control for viewing a single student's aggregated profile
(the Student 360 endpoint).

The StudentViewSet itself is intentionally gated only by tenant membership (see
students.views.StudentViewSet) so that admin/staff listing and management keep
working. The 360 profile, however, exposes a student's complete cross-module
record, so it warrants a tighter, relationship-aware check:

- Principal / Supervisor / tenant admins: any student in their tenant.
- Teacher: only students they teach (homeroom class-teacher sections + sections
  they teach on the timetable), reusing the same rule the complaints module uses.
- Parents: excluded from this admin endpoint entirely (IsNotParent). Parents view
  their children through the dedicated parent portal 360 endpoint
  (/api/v1/parent/students/{id}/360/), which enforces the parent->child link.

Role detection is structural (staff profile / class-teacher) rather than by role
code, matching the rest of the RBAC in this codebase. We reuse the helpers from
complaints.permissions so the "which students does this teacher teach?" rule
stays defined in exactly one place.

Assumption: students do not have their own login accounts linked to a Student
row in this system (only ParentUser exists). If student self-service logins are
added later, extend has_object_permission with that self-access branch.
"""

from rest_framework.permissions import BasePermission

from complaints.permissions import is_full_access, is_teacher, taught_student_ids


class CanViewStudentProfile(BasePermission):
    """Allow a full-access user to view any student; a teacher only their own."""

    message = "You don't have access to this student's profile."

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Principals, supervisors, tenant admins, superusers: any student.
        if is_full_access(user):
            return True

        # Teachers: only students in the sections they teach.
        if is_teacher(user):
            return obj.id in set(taught_student_ids(user))

        # Everyone else (e.g. receptionist) has no relationship-based access to
        # a full 360 profile. Broaden here if a role should be allowed.
        return False
