# Generated manually for security enhancements
import core.fields
import core.utils
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0003_add_student_ids_and_admission_config'),
    ]

    operations = [
        # Update Aadhar field to use encryption
        migrations.AlterField(
            model_name='student',
            name='aadhar_number',
            field=core.fields.EncryptedCharField(
                blank=True,
                help_text='Aadhar Card Number (12 digits) - Encrypted',
                max_length=255,
                validators=[core.utils.validate_aadhar]
            ),
        ),
        
        # Add validators to email fields
        migrations.AlterField(
            model_name='student',
            name='email',
            field=models.EmailField(
                blank=True,
                max_length=254,
                validators=[
                    django.core.validators.EmailValidator(),
                    core.utils.validate_email_enhanced
                ]
            ),
        ),
        migrations.AlterField(
            model_name='student',
            name='father_email',
            field=models.EmailField(
                blank=True,
                max_length=254,
                validators=[
                    django.core.validators.EmailValidator(),
                    core.utils.validate_email_enhanced
                ]
            ),
        ),
        migrations.AlterField(
            model_name='student',
            name='mother_email',
            field=models.EmailField(
                blank=True,
                max_length=254,
                validators=[
                    django.core.validators.EmailValidator(),
                    core.utils.validate_email_enhanced
                ]
            ),
        ),
        
        # Add validators to phone fields
        migrations.AlterField(
            model_name='student',
            name='phone',
            field=models.CharField(
                blank=True,
                max_length=20,
                validators=[core.utils.validate_indian_phone]
            ),
        ),
        migrations.AlterField(
            model_name='student',
            name='father_phone',
            field=models.CharField(
                max_length=20,
                validators=[core.utils.validate_indian_phone]
            ),
        ),
        migrations.AlterField(
            model_name='student',
            name='mother_phone',
            field=models.CharField(
                max_length=20,
                validators=[core.utils.validate_indian_phone]
            ),
        ),
        migrations.AlterField(
            model_name='student',
            name='guardian_phone',
            field=models.CharField(
                blank=True,
                max_length=20,
                validators=[core.utils.validate_indian_phone]
            ),
        ),
    ]
