"""Add async generation tracking fields to GeneratedReport."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='generatedreport',
            name='celery_task_id',
            field=models.CharField(blank=True, help_text='Celery task id for async generation', max_length=255),
        ),
        migrations.AddField(
            model_name='generatedreport',
            name='is_async',
            field=models.BooleanField(default=False, help_text='Whether report was generated asynchronously'),
        ),
    ]