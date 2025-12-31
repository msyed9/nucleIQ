"""
Salah Tracker Models
"""
from django.db import models
from core.models import TenantAwareModel
from django.utils import timezone

class SalahRecord(TenantAwareModel):
    """
    Daily Prayer Record for Students
    """
    SALAH_CHOICES = [
        ('FAJR', 'Fajr'),
        ('DHUHR', 'Dhuhr'),
        ('ASR', 'Asr'),
        ('MAGHRIB', 'Maghrib'),
        ('ISHA', 'Isha'),
    ]
    
    STATUS_CHOICES = [
        ('OFFERED', 'Offered (Jamaat)'),
        ('INDIVIDUAL', 'Offered (Individual)'),
        ('MISSED', 'Missed'),
        ('EXCUSED', 'Excused'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='salah_records')
    date = models.DateField(default=timezone.now)
    salah_name = models.CharField(max_length=10, choices=SALAH_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='MISSED')
    
    verified_by = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'salah_records'
        unique_together = ['student', 'date', 'salah_name']
        ordering = ['-date', 'salah_name']

    def __str__(self):
        return f"{self.student.first_name} - {self.salah_name} - {self.date}"
