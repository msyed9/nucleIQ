"""
Placement & Recruitment Models
"""
from django.db import models
from core.models import TenantAwareModel

class Recruiter(TenantAwareModel):
    """Company Details"""
    name = models.CharField(max_length=100)
    industry = models.CharField(max_length=100)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'placement_recruiters'
        
    def __str__(self): return self.name

class PlacementDrive(TenantAwareModel):
    """Campus Drive Event"""
    title = models.CharField(max_length=150)
    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE)
    date = models.DateField()
    
    eligibility_criteria = models.TextField(help_text="e.g. GPA > 8.0")
    roles_offered = models.TextField()
    package_range = models.CharField(max_length=100)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'placement_drives'

class StudentApplication(TenantAwareModel):
    """Student applying for a drive"""
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('SHORTLISTED', 'Shortlisted'),
        ('REJECTED', 'Rejected'),
        ('OFFERED', 'Offer Received'),
        ('ACCEPTED', 'Offer Accepted'),
    ]
    
    drive = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    
    offer_letter = models.FileField(upload_to='placements/offers/', null=True, blank=True)
    ctc = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Cost to Company")

    class Meta:
        db_table = 'placement_applications'
        unique_together = ['drive', 'student']
