"""
Optional push notifications for the staffwork module.

All helpers are best-effort: they import the push service lazily and swallow
errors so a notification failure never breaks the surrounding transaction.
Callers already wrap these in try/except, but we double-guard here too.
"""

import logging

logger = logging.getLogger(__name__)


def _push(user_id, title, body, data=None):
    try:
        from communication.services.push_notifications import send_push_notification
        send_push_notification(user_id, title, body, data=data)
    except Exception:
        logger.debug('staffwork: push notification skipped', exc_info=True)


def notify_task_assigned(user, task_title):
    """A new admin task was assigned to `user`."""
    _push(
        user.id, 'New task assigned',
        f'You have a new task: {task_title}',
        data={'type': 'admin_task_assigned'},
    )


def notify_update_submitted(supervisor, submitter_name, date):
    """A daily update was submitted; notify a reviewing supervisor."""
    _push(
        supervisor.id, 'Daily update submitted',
        f'{submitter_name} submitted a daily update for {date}.',
        data={'type': 'daily_update_submitted'},
    )


def notify_update_reviewed(submitter, reviewer_name):
    """A submitter's daily update was reviewed."""
    _push(
        submitter.id, 'Your update was reviewed',
        f'{reviewer_name} reviewed your daily update.',
        data={'type': 'daily_update_reviewed'},
    )


def notify_negative_remark(parent_user, student_name, severity):
    """A high-severity / negative remark was recorded about a student."""
    _push(
        parent_user.id, 'Update about your child',
        f'A teacher recorded an observation about {student_name}.',
        data={'type': 'student_remark', 'severity': severity},
    )
