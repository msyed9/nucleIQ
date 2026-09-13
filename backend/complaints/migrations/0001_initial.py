"""
Initial migration for the complaints app.

Hand-written to match complaints.models.Complaint (a BaseModel subclass with an
explicit tenant + created_by FK). Dependencies point at the latest migration of
each referenced app so the FK targets are guaranteed to exist, and the
AUTH_USER_MODEL FKs use a swappable dependency.
"""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tenants', '0008_tenantsettings_auto_mark_absent_time_and_more'),
        ('students', '0004_manual_qr_support'),
        ('staff', '0004_manual_qr_support'),
    ]

    operations = [
        migrations.CreateModel(
            name='Complaint',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text='Unique identifier for this record',
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    'created_at',
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        help_text='Timestamp when this record was created',
                    ),
                ),
                (
                    'updated_at',
                    models.DateTimeField(
                        auto_now=True,
                        help_text='Timestamp when this record was last updated',
                    ),
                ),
                (
                    'is_deleted',
                    models.BooleanField(
                        db_index=True, default=False, help_text='Soft delete flag'
                    ),
                ),
                (
                    'deleted_at',
                    models.DateTimeField(
                        blank=True,
                        help_text='Timestamp when this record was soft deleted',
                        null=True,
                    ),
                ),
                (
                    'deleted_by_id',
                    models.UUIDField(
                        blank=True,
                        help_text='UUID of user who deleted this record',
                        null=True,
                    ),
                ),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                (
                    'type',
                    models.CharField(
                        choices=[
                            ('COMPLAINT', 'Complaint'),
                            ('ISSUE', 'Issue'),
                            ('QUERY', 'Query'),
                        ],
                        db_index=True,
                        default='COMPLAINT',
                        max_length=20,
                    ),
                ),
                (
                    'category',
                    models.CharField(
                        blank=True,
                        choices=[
                            ('ACADEMIC', 'Academic'),
                            ('BEHAVIOUR', 'Behaviour'),
                            ('ATTENDANCE', 'Attendance'),
                            ('TRANSPORT', 'Transport'),
                            ('FEES', 'Fees'),
                            ('HEALTH', 'Health'),
                            ('DISCIPLINE', 'Discipline'),
                            ('FACILITIES', 'Facilities'),
                            ('OTHER', 'Other'),
                        ],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                (
                    'priority',
                    models.CharField(
                        choices=[
                            ('LOW', 'Low'),
                            ('MEDIUM', 'Medium'),
                            ('HIGH', 'High'),
                            ('URGENT', 'Urgent'),
                        ],
                        db_index=True,
                        default='MEDIUM',
                        max_length=10,
                    ),
                ),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('OPEN', 'Open'),
                            ('IN_PROGRESS', 'In Progress'),
                            ('RESOLVED', 'Resolved'),
                            ('CLOSED', 'Closed'),
                        ],
                        db_index=True,
                        default='OPEN',
                        max_length=20,
                    ),
                ),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_notes', models.TextField(blank=True)),
                (
                    'assigned_to',
                    models.ForeignKey(
                        blank=True,
                        help_text='User responsible for resolving this entry',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='complaints_assigned',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'created_by',
                    models.ForeignKey(
                        help_text='User who raised this entry',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='complaints_created',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'student',
                    models.ForeignKey(
                        help_text='Student this entry is about (required)',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='complaints',
                        to='students.student',
                    ),
                ),
                (
                    'teacher',
                    models.ForeignKey(
                        blank=True,
                        help_text='Optional teacher this entry relates to',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='complaints_tagged',
                        to='staff.staff',
                    ),
                ),
                (
                    'tenant',
                    models.ForeignKey(
                        help_text='Tenant (denormalized from student)',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='complaints',
                        to='tenants.tenant',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Complaint',
                'verbose_name_plural': 'Complaints',
                'db_table': 'complaints',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='complaint',
            index=models.Index(
                fields=['tenant', 'status', 'created_at'],
                name='cmplnt_tenant_status_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='complaint',
            index=models.Index(
                fields=['tenant', 'student'], name='cmplnt_tenant_student_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='complaint',
            index=models.Index(
                fields=['tenant', 'assigned_to'], name='cmplnt_tenant_asgn_idx'
            ),
        ),
    ]
