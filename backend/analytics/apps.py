"""
Django app configuration for Analytics
"""

from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analytics'
    verbose_name = 'Platform Analytics'
    
    def ready(self):
        """Import signals when app is ready."""
        import analytics.signals  # noqa

        # Ensure periodic tasks exist for analytics (safe on startup)
        try:
            import json
            from django.conf import settings
            from django_celery_beat.models import CrontabSchedule, PeriodicTask, PeriodicTasks

            timezone = getattr(settings, 'TIME_ZONE', 'UTC')

            daily_schedule, _ = CrontabSchedule.objects.get_or_create(
                minute='15',
                hour='0',
                day_of_week='*',
                day_of_month='*',
                month_of_year='*',
                timezone=timezone
            )

            churn_schedule, _ = CrontabSchedule.objects.get_or_create(
                minute='30',
                hour='0',
                day_of_week='*',
                day_of_month='*',
                month_of_year='*',
                timezone=timezone
            )

            weekly_schedule, _ = CrontabSchedule.objects.get_or_create(
                minute='0',
                hour='2',
                day_of_week='0',
                day_of_month='*',
                month_of_year='*',
                timezone=timezone
            )

            created_any = False

            _, created = PeriodicTask.objects.get_or_create(
                name='analytics-aggregate-daily-metrics',
                defaults={
                    'task': 'analytics.tasks.aggregate_daily_metrics',
                    'crontab': daily_schedule,
                    'enabled': True
                }
            )
            created_any = created_any or created

            _, created = PeriodicTask.objects.get_or_create(
                name='analytics-predict-churn-daily',
                defaults={
                    'task': 'analytics.tasks.predict_churn_daily',
                    'crontab': churn_schedule,
                    'enabled': True
                }
            )
            created_any = created_any or created

            _, created = PeriodicTask.objects.get_or_create(
                name='analytics-backfill-historical-metrics-weekly',
                defaults={
                    'task': 'analytics.tasks.backfill_historical_metrics',
                    'crontab': weekly_schedule,
                    'args': json.dumps([30]),
                    'enabled': True
                }
            )
            created_any = created_any or created

            if created_any:
                PeriodicTasks.changed()
        except Exception:
            # Avoid failing app startup if celery beat tables aren't ready
            pass
