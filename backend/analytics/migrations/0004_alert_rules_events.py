"""Add analytics alert rules and events."""

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0003_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AlertRule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for this record', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Timestamp when this record was created')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Timestamp when this record was last updated')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, help_text='Soft delete flag')),
                ('deleted_at', models.DateTimeField(blank=True, help_text='Timestamp when this record was soft deleted', null=True)),
                ('deleted_by_id', models.UUIDField(blank=True, help_text='UUID of user who deleted this record', null=True)),
                ('name', models.CharField(max_length=200)),
                ('metric', models.CharField(choices=[('ATTENDANCE_RATE', 'Attendance Rate'), ('FEE_DELINQUENCY', 'Fee Delinquency'), ('FEE_COLLECTION_RATE', 'Fee Collection Rate')], max_length=30)),
                ('comparator', models.CharField(choices=[('LT', '<'), ('LTE', '<='), ('GT', '>'), ('GTE', '>=')], default='LT', max_length=5)),
                ('threshold_value', models.DecimalField(decimal_places=2, max_digits=10)),
                ('window_days', models.IntegerField(default=30)),
                ('severity', models.CharField(choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')], default='MEDIUM', max_length=10)),
                ('scope', models.CharField(choices=[('ALL', 'All'), ('GRADE', 'Grade'), ('SECTION', 'Section')], default='ALL', max_length=10)),
                ('gender', models.CharField(blank=True, max_length=1)),
                ('is_active', models.BooleanField(default=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, to='users.user')),
                ('grade_level', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, to='tenants.gradelevel')),
                ('section', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, to='tenants.section')),
                ('tenant', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='alert_rules', to='tenants.tenant')),
            ],
            options={
                'db_table': 'analytics_alert_rules',
                'verbose_name': 'Analytics Alert Rule',
                'verbose_name_plural': 'Analytics Alert Rules',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AlertEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for this record', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Timestamp when this record was created')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Timestamp when this record was last updated')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, help_text='Soft delete flag')),
                ('deleted_at', models.DateTimeField(blank=True, help_text='Timestamp when this record was soft deleted', null=True)),
                ('deleted_by_id', models.UUIDField(blank=True, help_text='UUID of user who deleted this record', null=True)),
                ('status', models.CharField(choices=[('OPEN', 'Open'), ('RESOLVED', 'Resolved')], default='OPEN', max_length=10)),
                ('current_value', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('triggered_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('details', models.JSONField(blank=True, default=dict)),
                ('rule', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='events', to='analytics.alertrule')),
                ('tenant', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='alert_events', to='tenants.tenant')),
            ],
            options={
                'db_table': 'analytics_alert_events',
                'verbose_name': 'Analytics Alert Event',
                'verbose_name_plural': 'Analytics Alert Events',
                'ordering': ['-triggered_at'],
            },
        ),
        migrations.AddIndex(
            model_name='alertrule',
            index=models.Index(fields=['tenant', 'metric'], name='analytics_a_tenant__f9e9b0_idx'),
        ),
        migrations.AddIndex(
            model_name='alertrule',
            index=models.Index(fields=['tenant', 'is_active'], name='analytics_a_tenant__b8b24f_idx'),
        ),
        migrations.AddIndex(
            model_name='alertevent',
            index=models.Index(fields=['tenant', 'status'], name='analytics_a_tenant__9a2db0_idx'),
        ),
        migrations.AddIndex(
            model_name='alertevent',
            index=models.Index(fields=['tenant', '-triggered_at'], name='analytics_a_tenant__b9d4be_idx'),
        ),
    ]