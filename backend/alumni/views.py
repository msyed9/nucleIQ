"""
Alumni Views
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AlumniProfile, JobPosting, AlumniEvent, DonationCampaign, Donation
from .serializers import (AlumniProfileSerializer, JobPostingSerializer, 
                          AlumniEventSerializer, DonationCampaignSerializer, DonationSerializer)
from core.middleware import get_current_tenant

class AlumniProfileViewSet(viewsets.ModelViewSet):
    queryset = AlumniProfile.objects.all()
    serializer_class = AlumniProfileSerializer
    def get_queryset(self): return AlumniProfile.objects.filter(tenant=get_current_tenant())

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    def get_queryset(self): return JobPosting.objects.filter(tenant=get_current_tenant(), is_active=True)

class AlumniEventViewSet(viewsets.ModelViewSet):
    queryset = AlumniEvent.objects.all()
    serializer_class = AlumniEventSerializer
    def get_queryset(self): return AlumniEvent.objects.filter(tenant=get_current_tenant())

class DonationCampaignViewSet(viewsets.ModelViewSet):
    queryset = DonationCampaign.objects.all()
    serializer_class = DonationCampaignSerializer
    def get_queryset(self): return DonationCampaign.objects.filter(tenant=get_current_tenant())

    @action(detail=True, methods=['post'])
    def donate(self, request, pk=None):
        """Record a donation"""
        campaign = self.get_object()
        amount = request.data.get('amount')
        # Here we would integrate Payment Gateway logic
        
        donation = Donation.objects.create(
            tenant=get_current_tenant(),
            campaign=campaign,
            amount=amount,
            # Placeholder donor handling
            # donor=request.user.alumni_profile if hasattr(request.user, 'alumni_profile') else None
        )
        
        campaign.collected_amount += float(amount)
        campaign.save()
        
        return Response({'status': 'success', 'donation_id': donation.id})
