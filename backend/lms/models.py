"""
LMS / Live Classroom Models
"""
from django.db import models
from django.utils import timezone
from core.models import TenantAwareModel

class LiveClass(TenantAwareModel):
    """
    Scheduled Virtual Class
    """
    PROVIDER_CHOICES = [
        ('ZOOM', 'Zoom'),
        ('MEET', 'Google Meet'),
        ('JITSI', 'Jitsi Meet'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Scheduling
    start_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=45)
    
    # Target Audience
    grade_level = models.ForeignKey('tenants.GradeLevel', on_delete=models.CASCADE, related_name='live_classes')
    section = models.ForeignKey('tenants.Section', on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.ForeignKey('tenants.Subject', on_delete=models.CASCADE, related_name='live_classes')
    
    # Teacher
    teacher = models.ForeignKey('staff.Staff', on_delete=models.CASCADE, related_name='hosted_classes')
    
    # Video Details
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='ZOOM')
    meeting_link = models.URLField(max_length=500, blank=True)
    meeting_id = models.CharField(max_length=100, blank=True)
    passcode = models.CharField(max_length=50, blank=True)
    
    # Post Class
    is_completed = models.BooleanField(default=False)
    recording_link = models.URLField(max_length=500, blank=True)
    
    class Meta:
        db_table = 'lms_live_classes'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} ({self.start_time})"
