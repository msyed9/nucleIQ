"""
Exams App Configuration
"""

from django.apps import AppConfig


class ExamsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'exams'
    verbose_name = 'Examination Management'
