"""
Best-effort notifications for complaints.

Uses the existing communication app's push helper
(communication.services.push_notifications.send_push_notification). Every call
is wrapped so a notification failure can never break the API request that
triggered it. Parents are resolved via students.ParentUser.
"""

import logging

logger = logging.getLogger(__name__)


def _push(user_id, title, body, data=None):
    if not user_id:
        return
    try:
        from communication.services.push_notifications import send_push_notification
        send_push_notification(str(user_id), title, body, data=data or {})
    except Exception:
        logger.warning('complaints: push notification failed', exc_info=True)


def _parent_user_ids(student):
    try:
        from students.models import ParentUser
        return list(
            ParentUser.objects.filter(
                students=student, portal_access_enabled=True
            ).values_list('user_id', flat=True)
        )
    except Exception:
        logger.debug('complaints: parent lookup failed', exc_info=True)
        return []


def notify_complaint_created(complaint):
    """On creation: notify the assignee (if any) and the student's parents."""
    data = {'complaint_id': str(complaint.id), 'type': 'COMPLAINT_CREATED'}

    if complaint.assigned_to_id:
        _push(
            complaint.assigned_to_id,
            f'New {complaint.get_type_display().lower()} assigned',
            complaint.title,
            data,
        )

    for parent_user_id in _parent_user_ids(complaint.student):
        _push(
            parent_user_id,
            f'New {complaint.get_type_display().lower()} logged',
            f'Regarding {complaint.student.get_full_name()}: {complaint.title}',
            data,
        )


def notify_complaint_resolved(complaint):
    """On resolution: notify the user who raised the entry."""
    _push(
        complaint.created_by_id,
        f'Your {complaint.get_type_display().lower()} was {complaint.get_status_display().lower()}',
        complaint.title,
        {'complaint_id': str(complaint.id), 'type': 'COMPLAINT_RESOLVED'},
    )
