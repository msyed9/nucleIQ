"""
Reports Signals
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ScheduledReport
from datetime import datetime, timedelta


@receiver(post_save, sender=ScheduledReport)
def calculate_next_run(sender, instance, created, **kwargs):
    """
    Calculate next run time for scheduled reports
    """
    if created or not instance.next_run:
        from django.utils import timezone
        
        # Get current time
        now = timezone.now()
        
        # Calculate next run based on frequency
        if instance.frequency == 'DAILY':
            next_run = now + timedelta(days=1)
        elif instance.frequency == 'WEEKLY':
            days_ahead = instance.day_of_week - now.isoweekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
        elif instance.frequency == 'BIWEEKLY':
            days_ahead = instance.day_of_week - now.isoweekday()
            if days_ahead <= 0:
                days_ahead += 14
            next_run = now + timedelta(days=days_ahead)
        elif instance.frequency == 'MONTHLY':
            # Next month, same day
            next_run = now.replace(day=instance.day_of_month or 1)
            if next_run < now:
                # If date has passed, go to next month
                if next_run.month == 12:
                    next_run = next_run.replace(year=next_run.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=next_run.month + 1)
        elif instance.frequency == 'QUARTERLY':
            next_run = now + timedelta(days=90)
        else:  # YEARLY
            next_run = now + timedelta(days=365)
        
        # Set time
        next_run = next_run.replace(
            hour=instance.time.hour,
            minute=instance.time.minute,
            second=0,
            microsecond=0
        )
        
        # Update if not already set
        if not instance.next_run or created:
            ScheduledReport.objects.filter(pk=instance.pk).update(next_run=next_run)
