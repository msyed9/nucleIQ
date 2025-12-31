"""
Attendance Signals for Auto-Recalculation
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AttendanceRecord


@receiver(post_save, sender=AttendanceRecord)
def recalculate_monthly_aggregate_on_save(sender, instance, created, **kwargs):
    """
    Auto-recalculate monthly aggregate when attendance is marked.
    Triggers async Celery task.
    """
    from .tasks import recalculate_monthly_aggregate_task
    
    # Trigger async recalculation
    if instance.record_type == 'STUDENT' and instance.student:
        recalculate_monthly_aggregate_task.delay(
            'STUDENT',
            instance.student.id,
            instance.date.replace(day=1).isoformat(),
            instance.tenant.id
        )
    elif instance.record_type == 'STAFF' and instance.staff:
        recalculate_monthly_aggregate_task.delay(
            'STAFF',
            instance.staff.id,
            instance.date.replace(day=1).isoformat(),
            instance.tenant.id
        )
