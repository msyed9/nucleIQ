# Generated migration for adding branding image fields

from django.db import migrations, models
import tenants.models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0005_merge_20260124_1812'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenantbranding',
            name='small_logo',
            field=models.ImageField(
                blank=True,
                help_text='Small logo for sidebar and headers (recommended: 160x40px)',
                null=True,
                upload_to=tenants.models.branding_upload_path
            ),
        ),
        migrations.AddField(
            model_name='tenantbranding',
            name='large_logo',
            field=models.ImageField(
                blank=True,
                help_text='Large logo for login, landing, and reports (recommended: 400x100px or larger)',
                null=True,
                upload_to=tenants.models.branding_upload_path
            ),
        ),
        migrations.AddField(
            model_name='tenantbranding',
            name='square_logo',
            field=models.ImageField(
                blank=True,
                help_text='Square logo for favicons and profile placeholders (recommended: 512x512px)',
                null=True,
                upload_to=tenants.models.branding_upload_path
            ),
        ),
        migrations.AddField(
            model_name='tenantbranding',
            name='login_banner',
            field=models.ImageField(
                blank=True,
                help_text='Login page banner/hero image (recommended: 1920x1080px)',
                null=True,
                upload_to=tenants.models.branding_upload_path
            ),
        ),
        migrations.AddField(
            model_name='tenantbranding',
            name='dashboard_banner',
            field=models.ImageField(
                blank=True,
                help_text='Dashboard welcome banner (recommended: 1200x300px)',
                null=True,
                upload_to=tenants.models.branding_upload_path
            ),
        ),
        migrations.AddField(
            model_name='tenantbranding',
            name='report_header',
            field=models.ImageField(
                blank=True,
                help_text='Report/Receipt header banner (recommended: 800x100px)',
                null=True,
                upload_to=tenants.models.branding_upload_path
            ),
        ),
        # Update help text for legacy fields
        migrations.AlterField(
            model_name='tenantbranding',
            name='logo_url',
            field=models.URLField(
                blank=True,
                help_text='URL to the school logo (legacy - use small_logo or large_logo instead)',
                max_length=500
            ),
        ),
        migrations.AlterField(
            model_name='tenantbranding',
            name='favicon_url',
            field=models.URLField(
                blank=True,
                help_text='URL to the favicon (legacy - use square_logo instead)',
                max_length=500
            ),
        ),
        migrations.AlterField(
            model_name='tenantbranding',
            name='login_background_url',
            field=models.URLField(
                blank=True,
                help_text='URL to the login page background image (legacy - use login_banner instead)',
                max_length=500
            ),
        ),
    ]
