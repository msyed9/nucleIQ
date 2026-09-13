"""
Service layer for the staffwork module.

- TaskGenerationService: materialize AdminTaskInstances from active templates for
  a given tenant + date (idempotent via get_or_create on the unique key), plus a
  pass to mark past-due pending tasks OVERDUE.
- ConsolidationService: build the supervisor/principal consolidated view of daily
  updates, grouped date -> role -> user, with student remarks and flag counts.
"""

import logging
from collections import defaultdict

from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


class TaskGenerationService:
    """Generate admin-task instances from templates."""

    @staticmethod
    def _template_due_on(template, target_date):
        """Does this template produce a task on target_date?"""
        freq = template.frequency
        if freq == 'DAILY':
            return True
        if freq == 'WEEKLY':
            # Fire on the configured weekday (0=Mon). If unset, fire on Monday.
            expected = template.day_of_week if template.day_of_week is not None else 0
            return target_date.weekday() == expected
        if freq == 'MONTHLY':
            # Fire on the configured day-of-month if given (via day_of_week reused
            # as day-of-month is avoided); default to the 1st.
            return target_date.day == 1
        return False

    @classmethod
    @transaction.atomic
    def generate(cls, tenant, target_date=None):
        """
        Create one AdminTaskInstance per (active template, active role member)
        for target_date. Returns the count created.
        """
        from .models import AdminTaskTemplate, AdminTaskInstance

        target_date = target_date or timezone.localdate()
        created = 0

        templates = AdminTaskTemplate.objects.filter(
            tenant=tenant, is_active=True
        ).select_related('role_scope')

        for template in templates:
            if not cls._template_due_on(template, target_date):
                continue

            # Every active user holding the template's role receives the task.
            members = template.role_scope.users.filter(is_active=True)
            for user in members:
                _, was_created = AdminTaskInstance.objects.get_or_create(
                    template=template,
                    assigned_to=user,
                    date=target_date,
                    defaults={
                        'tenant': tenant,
                        'title': template.title,
                        'description': template.description,
                        'due_time': template.due_time,
                        'status': 'PENDING',
                    },
                )
                if was_created:
                    created += 1
                    cls._notify_assigned(user, template.title)

        logger.info(
            'staffwork: generated %s admin tasks for tenant=%s date=%s',
            created, tenant.id, target_date,
        )
        return created

    @staticmethod
    def mark_overdue(tenant, as_of_date=None):
        """Flag pending/in-progress tasks whose date has passed as OVERDUE."""
        from .models import AdminTaskInstance

        as_of_date = as_of_date or timezone.localdate()
        updated = AdminTaskInstance.objects.filter(
            tenant=tenant,
            date__lt=as_of_date,
            status__in=['PENDING', 'IN_PROGRESS'],
        ).update(status='OVERDUE', updated_at=timezone.now())
        if updated:
            logger.info('staffwork: marked %s tasks overdue for tenant=%s', updated, tenant.id)
        return updated

    @staticmethod
    def _notify_assigned(user, title):
        """Best-effort push notification that a task was assigned."""
        try:
            from .notifications import notify_task_assigned
            notify_task_assigned(user, title)
        except Exception:  # notifications are optional
            logger.debug('staffwork: task-assigned notification skipped', exc_info=True)


class ConsolidationService:
    """Build the consolidated daily-update view for supervisors/principals."""

    @staticmethod
    def build(queryset):
        """
        Group an already tenant/RBAC-scoped DailyStatusUpdate queryset into a
        nested structure: [{date, roles: [{role, users: [{user, updates}]}]}].
        Each update carries its student remarks and a negative-flag count.
        """
        from .serializers import DailyStatusUpdateSerializer

        queryset = queryset.select_related('user', 'reviewed_by', 'related_class') \
            .prefetch_related('student_remarks__student')

        # date -> role -> user_id -> {user, updates}
        grouped = defaultdict(lambda: defaultdict(dict))
        totals = {'updates': 0, 'negative_flags': 0}

        for update in queryset:
            data = DailyStatusUpdateSerializer(update).data
            neg = sum(
                1 for r in update.student_remarks.all() if r.has_negative_flag
            )
            data['negative_flag_count'] = neg
            totals['updates'] += 1
            totals['negative_flags'] += neg

            bucket = grouped[update.date][update.role]
            uid = str(update.user_id)
            if uid not in bucket:
                bucket[uid] = {
                    'user_id': uid,
                    'user_name': update.user.get_full_name(),
                    'updates': [],
                }
            bucket[uid]['updates'].append(data)

        result = []
        for date in sorted(grouped.keys(), reverse=True):
            roles = []
            for role, users_map in grouped[date].items():
                roles.append({'role': role, 'users': list(users_map.values())})
            result.append({'date': date, 'roles': roles})

        return {'summary': totals, 'days': result}
