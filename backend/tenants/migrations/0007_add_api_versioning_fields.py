# Generated migration for tenant API versioning settings

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0006_add_branding_image_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenantsettings',
            name='api_default_version',
            field=models.CharField(
                default='v1',
                help_text="Default API version for this tenant (e.g., 'v1' or 'v2')",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='tenantsettings',
            name='api_module_versions',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Per-module API version overrides (e.g., {'students': 'v2', 'fees': 'v1'})",
            ),
        ),
    ]