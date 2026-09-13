"""
RBAC for the complaints module.

Visibility rules (enforced in ComplaintViewSet.get_queryset, using the helpers
here) and write rules (ComplaintPermission.has_object_permission):

- Principal / Supervisor / tenant admins: view and manage ALL entries.
- Teacher: entries they created, entries assigned to them, entries where they
  are the tagged `teacher`, or entries about students they teach (homeroom
  class-teacher sections + sections they teach on the timetable).
- Parent: entries about their own children (via students.ParentUser).
- Student / Receptionist / any other role: entries they created or are
  assigned to. (Receptionists create freely but only see their own — least
  privilege; a principal/supervisor manages the full queue.)

Role codes in this system are tenant-defined data (users.Role.code, a slug with
no fixed enum), so "teacher"/"parent"/"student" are detected structurally
(a staff profile, a parent profile, etc.) rather than by role code. Only the
"full access" tier is matched by code, consistent with core.permissions.IsTenantAdmin.
"""

import logging

from rest_framework.permissions import BasePermission, SAFE_METHODS

from core.permissions import IsTenantUser

logger = logging.getLogger(__name__)

# Roles that can see and manage every complaint in the tenant. Superset of
# core.permissions.IsTenantAdmin.admin_role_codes plus 'supervisor'.
FULL_ACCESS_ROLE_CODES = [
    'admin', 'super_admin', 'tenant_admin', 'school_admin',
    'principal', 'administrator', 'supervisor',
]

# Staff designations treated as "teacher" for visibility purposes.
TEACHER_DESIGNATIONS = ['TEACHER', 'ASSISTANT_TEACHER', 'HEAD_TEACHER']


def get_staff_profile(user):
    """Return the user's Staff record, or None."""
    return getattr(user, 'staff_profile', None)


def is_full_access(user):
    """True if the user can view/manage all complaints in the tenant."""
    if not user or not user.is_authenticated:
        return False
    if user.is_platform_admin or user.is_superuser or user.is_staff:
        return True
    if not hasattr(user, 'roles'):
        return False
    return user.roles.filter(
        code__in=FULL_ACCESS_ROLE_CODES, is_active=True
    ).exists()


def is_teacher(user):
    """True if the user is a teacher (by staff designation or class-teacher role)."""
    staff = get_staff_profile(user)
    if staff and getattr(staff, 'designation', None) in TEACHER_DESIGNATIONS:
        return True
    # A user assigned as class_teacher of any section counts as a teacher.
    return user.class_teacher_sections.exists()


def sections_taught_by(user):
    """
    Set of Section ids the user teaches:
    - sections where they are the class_teacher (tenants.Section.class_teacher -> User)
    - sections they teach on the timetable (timetable.TimetableSlot.teacher -> Staff)
    """
    section_ids = set(user.class_teacher_sections.values_list('id', flat=True))

    staff = get_staff_profile(user)
    if staff:
        try:
            from timetable.models import TimetableSlot
            section_ids |= set(
                TimetableSlot.objects.filter(teacher=staff)
                .values_list('section_id', flat=True)
            )
        except Exception:  # timetable optional / schema drift - degrade gracefully
            logger.debug('sections_taught_by: timetable lookup skipped', exc_info=True)

    return section_ids


def taught_student_ids(user):
    """Ids of active-enrollment students the user teaches (empty if none)."""
    section_ids = sections_taught_by(user)
    if not section_ids:
        return []
    from students.models import StudentEnrollment
    return list(
        StudentEnrollment.objects.filter(
            section_id__in=section_ids, status='ACTIVE'
        ).values_list('student_id', flat=True)
    )


def child_student_ids(user):
    """Ids of students linked to this user as a parent (empty if not a parent)."""
    parent = getattr(user, 'parent_profile', None)
    if not parent:
        return []
    return list(parent.students.values_list('id', flat=True))


class ComplaintPermission(BasePermission):
    """
    Endpoint- and object-level access for complaints.

    - has_permission: any authenticated user of the current tenant (list/create
      are open to everyone; row visibility is narrowed in get_queryset).
    - has_object_permission: reads are allowed for anything already surfaced by
      the tenant/RBAC-scoped queryset; writes require full access, or being the
      creator or the assignee.
    """

    message = 'You do not have permission to act on this complaint.'

    def has_permission(self, request, view):
        return IsTenantUser().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        user = request.user

        # get_queryset already restricts which objects are visible, so any object
        # that reaches an object-level SAFE check is one the user may read.
        if request.method in SAFE_METHODS:
            return True

        if is_full_access(user):
            return True

        # Creators and assignees may update/resolve their own entries.
        return obj.created_by_id == user.id or obj.assigned_to_id == user.id
