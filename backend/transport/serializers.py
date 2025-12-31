"""
Transport Serializers
"""
from rest_framework import serializers
from .models import Vehicle, Driver, Route, Stop, StudentTransport

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

class DriverSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='staff.get_full_name', read_only=True)
    class Meta:
        model = Driver
        fields = '__all__'

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.staff.get_full_name', read_only=True)
    
    class Meta:
        model = Route
        fields = '__all__'

class StudentTransportSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    route_name = serializers.CharField(source='stop.route.name', read_only=True)
    stop_name = serializers.CharField(source='stop.name', read_only=True)
    
    class Meta:
        model = StudentTransport
        fields = '__all__'
