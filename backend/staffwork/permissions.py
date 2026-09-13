"""
RBAC for the staffwork module (lesson plans, admin tasks, daily updates, reports).

Tiers (role codes are tenant-defined data, so only "full access" is matched by
code — everyone else is detected structurally, reusing the complaints helpers):

- Principal / Supervisor / tenant admins ("full access"): view everything in the
  tenant, review/comment on daily updates, override statuses, see the
  consolidated dashboard and task-completion board.
- Teacher: manage their own lesson plans and daily updates; per-student remarks
  only for students they teach.
- Admin / Finance / HR / front-office staff: manage their own AdminTaskInstances
  and their own daily updates; no student remarks.
- Everyone else: no access.

Tenant isolation is enforced in every viewset's get_queryset (filter by
request.user.tenant_id); these classes add the ownership/role layer on top.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from core.permissions import IsTenantUser
# Reuse the structural role helpers already battle-tested in complaints.
from complaints.permissions import is_full_access, is_teacher, taught_student_ids


class IsStaffworkUser(BasePermission):
    """Base: authenticated tenant user. Row visibility narrowed in get_queryset."""

    message = 'You do not have access to this resource.'

    def has_permission(self, request, view):
        return IsTenantUser().has_permission(request, view)


class LessonPlanPermission(IsStaffworkUser):
    """
    Reads: anything the tenant/RBAC-scoped queryset already surfaced.
    Writes: full-access users, or the owning teacher.
    """

    message = 'You do not have permission to modify this lesson plan.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_full_access(request.user):
            return True
        return obj.teacher_id == request.user.id


class DailyUpdatePermission(IsStaffworkUser):
    """
    Reads: surfaced by get_queryset.
    Writes: full-access users, or the owner of the update. (Review is gated
    separately in the `review` action — only full-access users may review.)
    """

    message = 'You do not have permission to modify this daily update.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_full_access(request.user):
            return True
        return obj.user_id == request.user.id


class AdminTaskPermission(IsStaffworkUser):
    """
    Reads: surfaced by get_queryset.
    Writes: full-access users (may create/assign/override), or the assignee
    (may update status / complete their own task).
    """

    message = 'You do not have permission to modify this task.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_full_access(request.user):
            return True
        return obj.assigned_to_id == request.user.id


class ReportPermission(IsStaffworkUser):
    """
    Reads: surfaced by get_queryset.
    Writes: full-access users, or the report's generator.
    """

    message = 'You do not have permission to modify this report.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_full_access(request.user):
            return True
        return obj.generated_by_id == request.user.id


def can_remark_on_student(user, student_id):
    """
    True if `user` may attach a per-student remark for `student_id`:
    full-access users always, teachers only for students they teach.
    """
    if is_full_access(user):
        return True
    if is_teacher(user):
        return student_id in set(taught_student_ids(user))
    return False
