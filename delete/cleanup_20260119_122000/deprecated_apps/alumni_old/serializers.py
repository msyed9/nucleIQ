"""
Alumni Serializers
"""
from rest_framework import serializers
from .models import AlumniProfile, JobPosting, AlumniEvent, DonationCampaign, Donation

class AlumniProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = AlumniProfile
        fields = '__all__'

class JobPostingSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.user.get_full_name', read_only=True)
    class Meta:
        model = JobPosting
        fields = '__all__'

class AlumniEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlumniEvent
        fields = '__all__'

class DonationCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCampaign
        fields = '__all__'

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    class Meta:
        model = Donation
        fields = '__all__'
    
    def get_donor_name(self, obj):
        if obj.anonymous: return "Anonymous"
        return obj.donor.user.get_full_name() if obj.donor else "Guest"
