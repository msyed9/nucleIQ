"""
Alumni Management Models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel

class AlumniProfile(TenantAwareModel):
    """
    Profile of a former student
    """
    student = models.OneToOneField(
        'students.Student', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='alumni_profile'
    )
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='alumni_profile')
    
    current_company = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    linkedin_url = models.URLField(blank=True)
    
    graduation_year = models.IntegerField(help_text="Batch Year")
    
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'alumni_profiles'

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.graduation_year})"

class JobPosting(TenantAwareModel):
    """
    Jobs/Internships posted by Alumni
    """
    posted_by = models.ForeignKey(AlumniProfile, on_delete=models.CASCADE, related_name='job_posts')
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    description = models.TextField()
    apply_link = models.URLField()
    
    posted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'alumni_jobs'
        ordering = ['-posted_at']

class AlumniEvent(TenantAwareModel):
    """
    Reunions and Meetups
    """
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField()
    venue = models.CharField(max_length=200)
    registration_link = models.URLField(blank=True)
    
    organizer = models.ForeignKey(AlumniProfile, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'alumni_events'
        ordering = ['-date']

class DonationCampaign(TenantAwareModel):
    """
    Fundraising Campaigns
    """
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    collected_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'alumni_campaigns'

class Donation(TenantAwareModel):
    """
    Donation Transactions
    """
    campaign = models.ForeignKey(DonationCampaign, on_delete=models.CASCADE, related_name='donations')
    donor = models.ForeignKey(AlumniProfile, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_status = models.CharField(max_length=20, default='SUCCESS')
    
    date = models.DateTimeField(auto_now_add=True)
    anonymous = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'alumni_donations'
