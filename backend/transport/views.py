"""
Transport Views
"""
from rest_framework import viewsets
from .models import Vehicle, Driver, Route, Stop, StudentTransport
from .serializers import (
    VehicleSerializer, DriverSerializer, RouteSerializer, 
    StopSerializer, StudentTransportSerializer
)
from core.middleware import get_current_tenant

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    def get_queryset(self): return Vehicle.objects.filter(tenant=get_current_tenant())

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    def get_queryset(self): return Driver.objects.filter(tenant=get_current_tenant())

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    def get_queryset(self): return Route.objects.filter(tenant=get_current_tenant())

class StopViewSet(viewsets.ModelViewSet):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    def get_queryset(self): return Stop.objects.filter(tenant=get_current_tenant())

class StudentTransportViewSet(viewsets.ModelViewSet):
    queryset = StudentTransport.objects.all()
    serializer_class = StudentTransportSerializer
    def get_queryset(self): return StudentTransport.objects.filter(tenant=get_current_tenant())
