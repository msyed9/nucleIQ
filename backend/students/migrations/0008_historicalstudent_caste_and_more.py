
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0007_remove_historicalstudent_updated_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalstudent',
            name='caste',
            field=models.CharField(blank=True, default='', help_text='Caste', max_length=100),
        ),
        migrations.AddField(
            model_name='historicalstudent',
            name='nationality',
            field=models.CharField(blank=True, default='', help_text='Nationality', max_length=100),
        ),
        migrations.AddField(
            model_name='historicalstudent',
            name='religion',
            field=models.CharField(blank=True, default='', help_text='Religion', max_length=100),
        ),
        migrations.AddField(
            model_name='student',
            name='caste',
            field=models.CharField(blank=True, default='', help_text='Caste', max_length=100),
        ),
        migrations.AddField(
            model_name='student',
            name='nationality',
            field=models.CharField(blank=True, default='', help_text='Nationality', max_length=100),
        ),
        migrations.AddField(
            model_name='student',
            name='religion',
            field=models.CharField(blank=True, default='', help_text='Religion', max_length=100),
        ),
    ]
