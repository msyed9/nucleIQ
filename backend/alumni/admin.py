from django.contrib import admin
from .models import AlumniProfile, JobPosting, AlumniEvent, DonationCampaign, Donation

@admin.register(AlumniProfile)
class AlumniAdmin(admin.ModelAdmin):
    list_display = ['user', 'graduation_year', 'current_company', 'is_verified']
    search_fields = ['user__first_name', 'current_company']

@admin.register(JobPosting)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'posted_by', 'posted_at']

@admin.register(DonationCampaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ['title', 'goal_amount', 'collected_amount', 'end_date']
