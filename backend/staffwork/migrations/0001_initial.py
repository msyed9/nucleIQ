"""
Initial migration for the staffwork app.

Hand-written to match staffwork.models (all BaseModel subclasses with an explicit
tenant FK). Dependencies point at the latest migration of each referenced app so
the FK targets exist; AUTH_USER_MODEL FKs use a swappable dependency.
"""

import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def base_fields():
    """The five columns every BaseModel subclass contributes."""
    return [
        (
            'id',
            models.UUIDField(
                default=uuid.uuid4, editable=False,
                help_text='Unique identifier for this record',
                primary_key=True, serialize=False,
            ),
        ),
        (
            'created_at',
            models.DateTimeField(
                auto_now_add=True, db_index=True,
                help_text='Timestamp when this record was created',
            ),
        ),
        (
            'updated_at',
            models.DateTimeField(
                auto_now=True, help_text='Timestamp when this record was last updated',
            ),
        ),
        (
            'is_deleted',
            models.BooleanField(db_index=True, default=False, help_text='Soft delete flag'),
        ),
        (
            'deleted_at',
            models.DateTimeField(
                blank=True, null=True,
                help_text='Timestamp when this record was soft deleted',
            ),
        ),
        (
            'deleted_by_id',
            models.UUIDField(
                blank=True, null=True, help_text='UUID of user who deleted this record',
            ),
        ),
    ]


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tenants', '0008_tenantsettings_auto_mark_absent_time_and_more'),
        ('students', '0004_manual_qr_support'),
        ('users', '0003_rename_login_activ_tenant__f80dd4_idx_login_activ_tenant__c754b4_idx_and_more'),
    ]

    operations = [
        # -------------------------------------------------------------- LessonPlan
        migrations.CreateModel(
            name='LessonPlan',
            fields=base_fields() + [
                ('date', models.DateField(db_index=True)),
                ('topic', models.CharField(max_length=255)),
                ('objectives', models.TextField(blank=True)),
                ('activities', models.TextField(blank=True)),
                ('resources', models.TextField(blank=True)),
                ('homework', models.TextField(blank=True)),
                ('status', models.CharField(
                    choices=[('DRAFT', 'Draft'), ('PUBLISHED', 'Published'), ('ARCHIVED', 'Archived')],
                    db_index=True, default='DRAFT', max_length=20)),
                ('teacher', models.ForeignKey(
                    help_text='Teacher who owns this lesson plan',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='lesson_plans', to=settings.AUTH_USER_MODEL)),
                ('section', models.ForeignKey(
                    blank=True, null=True, help_text='Class/section this plan targets',
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='lesson_plans', to='tenants.section')),
                ('subject', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='lesson_plans', to='tenants.subject')),
                ('shared_with', models.ManyToManyField(
                    blank=True, related_name='shared_lesson_plans', to=settings.AUTH_USER_MODEL)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='lesson_plans', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Lesson Plan',
                'verbose_name_plural': 'Lesson Plans',
                'db_table': 'staffwork_lesson_plans',
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='lessonplan',
            index=models.Index(fields=['tenant', 'teacher', 'date'], name='swk_lp_teacher_date_idx'),
        ),
        migrations.AddIndex(
            model_name='lessonplan',
            index=models.Index(fields=['tenant', 'section', 'date'], name='swk_lp_section_date_idx'),
        ),
        # ------------------------------------------------ LessonPlanAttachment
        migrations.CreateModel(
            name='LessonPlanAttachment',
            fields=base_fields() + [
                ('file', models.FileField(upload_to='staffwork/lesson_plans/%Y/%m/')),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('lesson_plan', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attachments', to='staffwork.lessonplan')),
                ('uploaded_by', models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='uploaded_lesson_plan_attachments', to=settings.AUTH_USER_MODEL)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='lesson_plan_attachments', to='tenants.tenant')),
            ],
            options={
                'db_table': 'staffwork_lesson_plan_attachments',
                'ordering': ['-created_at'],
            },
        ),
        # --------------------------------------------------- AdminTaskTemplate
        migrations.CreateModel(
            name='AdminTaskTemplate',
            fields=base_fields() + [
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('frequency', models.CharField(
                    choices=[('DAILY', 'Daily'), ('WEEKLY', 'Weekly'), ('MONTHLY', 'Monthly')],
                    db_index=True, default='DAILY', max_length=10)),
                ('day_of_week', models.IntegerField(
                    blank=True, null=True,
                    choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'),
                             (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('due_time', models.TimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('role_scope', models.ForeignKey(
                    help_text='Role whose members receive this task',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='admin_task_templates', to='users.role')),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='admin_task_templates', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Admin Task Template',
                'verbose_name_plural': 'Admin Task Templates',
                'db_table': 'staffwork_admin_task_templates',
                'ordering': ['title'],
            },
        ),
        migrations.AddIndex(
            model_name='admintasktemplate',
            index=models.Index(fields=['tenant', 'is_active', 'frequency'], name='swk_tmpl_active_freq_idx'),
        ),
        # --------------------------------------------------- AdminTaskInstance
        migrations.CreateModel(
            name='AdminTaskInstance',
            fields=base_fields() + [
                ('date', models.DateField(db_index=True, help_text='Day the task is due')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('due_time', models.TimeField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[('PENDING', 'Pending'), ('IN_PROGRESS', 'In Progress'),
                             ('COMPLETED', 'Completed'), ('SKIPPED', 'Skipped'), ('OVERDUE', 'Overdue')],
                    db_index=True, default='PENDING', max_length=15)),
                ('update_notes', models.TextField(blank=True, help_text='What the assignee did')),
                ('attachment', models.FileField(blank=True, null=True, upload_to='staffwork/admin_tasks/%Y/%m/')),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('template', models.ForeignKey(
                    blank=True, null=True, help_text='Source template (null for ad-hoc tasks)',
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='instances', to='staffwork.admintasktemplate')),
                ('assigned_to', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='admin_task_instances', to=settings.AUTH_USER_MODEL)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='admin_task_instances', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Admin Task Instance',
                'verbose_name_plural': 'Admin Task Instances',
                'db_table': 'staffwork_admin_task_instances',
                'ordering': ['-date', 'due_time'],
            },
        ),
        migrations.AddConstraint(
            model_name='admintaskinstance',
            constraint=models.UniqueConstraint(
                fields=['template', 'assigned_to', 'date'], name='uniq_admin_task_per_user_day'),
        ),
        migrations.AddIndex(
            model_name='admintaskinstance',
            index=models.Index(fields=['tenant', 'assigned_to', 'date'], name='swk_ati_user_date_idx'),
        ),
        migrations.AddIndex(
            model_name='admintaskinstance',
            index=models.Index(fields=['tenant', 'date', 'status'], name='swk_ati_date_status_idx'),
        ),
        # -------------------------------------------------- DailyStatusUpdate
        migrations.CreateModel(
            name='DailyStatusUpdate',
            fields=base_fields() + [
                ('role', models.CharField(
                    choices=[('TEACHER', 'Teacher'), ('ADMIN', 'Admin'), ('FINANCE', 'Finance'),
                             ('HR', 'HR'), ('FRONT_OFFICE', 'Front Office'), ('OTHER', 'Other')],
                    db_index=True, max_length=20)),
                ('date', models.DateField(db_index=True, default=django.utils.timezone.localdate)),
                ('summary', models.TextField(help_text='Free-text overview of the day')),
                ('details', models.TextField(blank=True)),
                ('attachment', models.FileField(blank=True, null=True, upload_to='staffwork/daily_updates/%Y/%m/')),
                ('status', models.CharField(
                    choices=[('DRAFT', 'Draft'), ('SUBMITTED', 'Submitted'), ('REVIEWED', 'Reviewed')],
                    db_index=True, default='DRAFT', max_length=15)),
                ('review_notes', models.TextField(blank=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('related_class', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='daily_status_updates', to='tenants.section')),
                ('reviewed_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reviewed_daily_updates', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='daily_status_updates', to=settings.AUTH_USER_MODEL)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='daily_status_updates', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Daily Status Update',
                'verbose_name_plural': 'Daily Status Updates',
                'db_table': 'staffwork_daily_status_updates',
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='dailystatusupdate',
            index=models.Index(fields=['tenant', 'date', 'role'], name='swk_dsu_date_role_idx'),
        ),
        migrations.AddIndex(
            model_name='dailystatusupdate',
            index=models.Index(fields=['tenant', 'user', 'date'], name='swk_dsu_user_date_idx'),
        ),
        migrations.AddIndex(
            model_name='dailystatusupdate',
            index=models.Index(fields=['tenant', 'status'], name='swk_dsu_status_idx'),
        ),
        # -------------------------------------------------- StudentDailyRemark
        migrations.CreateModel(
            name='StudentDailyRemark',
            fields=base_fields() + [
                ('did_not_do_homework', models.BooleanField(default=False)),
                ('did_not_complete_classwork', models.BooleanField(default=False)),
                ('was_disruptive', models.BooleanField(default=False)),
                ('was_absent', models.BooleanField(default=False)),
                ('participated_well', models.BooleanField(default=False)),
                ('remark', models.TextField(blank=True)),
                ('severity', models.CharField(
                    blank=True, help_text='Optional severity for negative flags',
                    choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High')], max_length=10)),
                ('daily_update', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='student_remarks', to='staffwork.dailystatusupdate')),
                ('student', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='daily_remarks', to='students.student')),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='student_daily_remarks', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Student Daily Remark',
                'verbose_name_plural': 'Student Daily Remarks',
                'db_table': 'staffwork_student_daily_remarks',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='studentdailyremark',
            constraint=models.UniqueConstraint(
                fields=['daily_update', 'student'], name='uniq_remark_per_update_student'),
        ),
        migrations.AddIndex(
            model_name='studentdailyremark',
            index=models.Index(fields=['tenant', 'student'], name='swk_sdr_student_idx'),
        ),
        # ------------------------------------------------------------- Report
        migrations.CreateModel(
            name='Report',
            fields=base_fields() + [
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('file', models.FileField(upload_to='staffwork/reports/%Y/%m/')),
                ('generated_by', models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='generated_reports', to=settings.AUTH_USER_MODEL)),
                ('shared_with', models.ManyToManyField(
                    blank=True, related_name='shared_reports', to=settings.AUTH_USER_MODEL)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='staff_reports', to='tenants.tenant')),
            ],
            options={
                'verbose_name': 'Report',
                'verbose_name_plural': 'Reports',
                'db_table': 'staffwork_reports',
                'ordering': ['-created_at'],
            },
        ),
    ]
