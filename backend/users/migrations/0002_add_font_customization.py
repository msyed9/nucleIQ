# Generated migration for font customization fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreference',
            name='font_family',
            field=models.CharField(default='Inter, sans-serif', help_text='Preferred font family (e.g., Inter, Roboto, Poppins)', max_length=100),
        ),
        migrations.AddField(
            model_name='userpreference',
            name='font_size',
            field=models.CharField(choices=[('small', 'Small (14px)'), ('medium', 'Medium (16px)'), ('large', 'Large (18px)'), ('extra-large', 'Extra Large (20px)')], default='medium', help_text='Preferred font size', max_length=20),
        ),
        migrations.AddField(
            model_name='userpreference',
            name='font_color',
            field=models.CharField(default='#1a1a1a', help_text='Custom text color in hex format (e.g., #1a1a1a)', max_length=7),
        ),
        migrations.AddField(
            model_name='userpreference',
            name='heading_color',
            field=models.CharField(default='#1a1a1a', help_text='Custom heading color in hex format (e.g., #1a1a1a)', max_length=7),
        ),
        migrations.AddField(
            model_name='userpreference',
            name='link_color',
            field=models.CharField(default='#0066cc', help_text='Custom link color in hex format (e.g., #0066cc)', max_length=7),
        ),
    ]
