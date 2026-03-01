from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginActivityLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for this record', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Timestamp when this record was created')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Timestamp when this record was last updated')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, help_text='Soft delete flag')),
                ('deleted_at', models.DateTimeField(blank=True, help_text='Timestamp when this record was soft deleted', null=True)),
                ('deleted_by_id', models.UUIDField(blank=True, help_text='UUID of user who deleted this record', null=True)),
                ('email_snapshot', models.EmailField(blank=True, help_text='User email at login time', max_length=254)),
                ('ip_address', models.GenericIPAddressField(blank=True, help_text='Client IP address', null=True)),
                ('forwarded_for', models.TextField(blank=True, help_text='Raw X-Forwarded-For header if present')),
                ('country', models.CharField(blank=True, max_length=100)),
                ('region', models.CharField(blank=True, max_length=100)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('latitude', models.CharField(blank=True, max_length=50)),
                ('longitude', models.CharField(blank=True, max_length=50)),
                ('user_agent', models.TextField(blank=True)),
                ('login_method', models.CharField(choices=[('legacy_jwt', 'Legacy JWT Login'), ('unified_login', 'Unified Login'), ('parent_portal', 'Parent Portal Login')], db_index=True, default='legacy_jwt', max_length=30)),
                ('login_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('tenant', models.ForeignKey(blank=True, db_index=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='login_activities', to='tenants.tenant')),
                ('user', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='login_activities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Login Activity Log',
                'verbose_name_plural': 'Login Activity Logs',
                'db_table': 'login_activity_logs',
                'ordering': ['-login_at'],
            },
        ),
        migrations.AddIndex(
            model_name='loginactivitylog',
            index=models.Index(fields=['tenant', '-login_at'], name='login_activ_tenant__f80dd4_idx'),
        ),
        migrations.AddIndex(
            model_name='loginactivitylog',
            index=models.Index(fields=['user', '-login_at'], name='login_activ_user_id_b8b119_idx'),
        ),
        migrations.AddIndex(
            model_name='loginactivitylog',
            index=models.Index(fields=['ip_address'], name='login_activ_ip_addr_4dd9f2_idx'),
        ),
    ]
