"""
Hostel Views
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import HostelBuilding, Room, Bed, HostelAllocation
from .serializers import (HostelBuildingSerializer, RoomSerializer, BedSerializer, HostelAllocationSerializer)
from core.middleware import get_current_tenant

class HostelBuildingViewSet(viewsets.ModelViewSet):
    queryset = HostelBuilding.objects.all()
    serializer_class = HostelBuildingSerializer
    def get_queryset(self): return HostelBuilding.objects.filter(tenant=get_current_tenant())

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    def get_queryset(self): return Room.objects.filter(tenant=get_current_tenant())

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    def get_queryset(self): return Bed.objects.filter(tenant=get_current_tenant())

class HostelAllocationViewSet(viewsets.ModelViewSet):
    queryset = HostelAllocation.objects.all()
    serializer_class = HostelAllocationSerializer
    def get_queryset(self): return HostelAllocation.objects.filter(tenant=get_current_tenant())

    @action(detail=True, methods=['post'])
    def vacating(self, request, pk=None):
        """Mark allocation as ended and free the bed."""
        allocation = self.get_object()
        allocation.is_active = False
        allocation.end_date = request.data.get('end_date')
        allocation.save()
        
        # Free bed
        allocation.bed.is_occupied = False
        allocation.bed.save()
        
        return Response({'status': 'vacated'})
