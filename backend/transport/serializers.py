"""
Transport Module Serializers - Enhanced Version
"""

from rest_framework import serializers
from django.utils import timezone
from .models import (
    Vehicle, Driver, DriverAttendance, Route, Stop, StudentTransport,
    VehicleTracking, VehicleCurrentLocation, TripLog, TripStopLog,
    StudentTripAttendance, VehicleMaintenance, FuelLog,
    TransportNotification, TransportNotificationSetting, TransportExpenseSummary
)


# =============================================================================
# VEHICLE SERIALIZERS
# =============================================================================

class VehicleListSerializer(serializers.ModelSerializer):
    """Compact serializer for vehicle lists."""
    driver_name = serializers.SerializerMethodField()
    route_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'vehicle_number', 'vehicle_type', 'make', 'model',
            'capacity', 'status', 'is_active', 'driver_name', 'route_name'
        ]
    
    def get_driver_name(self, obj):
        # Get driver from default route
        route = obj.routes.filter(is_active=True).first()
        if route and route.driver:
            return route.driver.get_full_name
        return None
    
    def get_route_name(self, obj):
        route = obj.routes.filter(is_active=True).first()
        return route.name if route else None


class VehicleSerializer(serializers.ModelSerializer):
    """Full vehicle serializer with all details."""
    is_documents_valid = serializers.ReadOnlyField()
    next_expiring_document = serializers.ReadOnlyField()
    
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at', 'updated_at']


class VehicleDocumentStatusSerializer(serializers.Serializer):
    """Serializer for document expiry status."""
    document_type = serializers.CharField()
    expiry_date = serializers.DateField()
    days_remaining = serializers.IntegerField()
    status = serializers.CharField()


# =============================================================================
# DRIVER SERIALIZERS
# =============================================================================

class DriverListSerializer(serializers.ModelSerializer):
    """Compact serializer for driver lists."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    phone = serializers.CharField(source='staff.phone', read_only=True)
    is_license_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = Driver
        fields = [
            'id', 'full_name', 'phone', 'license_number', 'license_expiry',
            'status', 'is_license_valid', 'default_vehicle'
        ]


class DriverSerializer(serializers.ModelSerializer):
    """Full driver serializer."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    staff_phone = serializers.CharField(source='staff.phone', read_only=True)
    staff_email = serializers.CharField(source='staff.email', read_only=True)
    is_license_valid = serializers.ReadOnlyField()
    vehicle_number = serializers.CharField(source='default_vehicle.vehicle_number', read_only=True)
    
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at', 'updated_at']


class DriverAttendanceSerializer(serializers.ModelSerializer):
    """Driver attendance serializer."""
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    
    class Meta:
        model = DriverAttendance
        fields = '__all__'
        read_only_fields = ['tenant']


class BulkDriverAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk driver attendance marking."""
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )


# =============================================================================
# ROUTE SERIALIZERS
# =============================================================================

class StopSerializer(serializers.ModelSerializer):
    """Stop serializer."""
    student_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Stop
        fields = '__all__'
        read_only_fields = ['tenant']


class StopListSerializer(serializers.ModelSerializer):
    """Compact stop serializer for lists."""
    class Meta:
        model = Stop
        fields = ['id', 'name', 'order', 'pickup_time', 'drop_time', 'monthly_fare', 'is_active']


class RouteListSerializer(serializers.ModelSerializer):
    """Compact serializer for route lists."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    total_students = serializers.ReadOnlyField()
    total_stops = serializers.ReadOnlyField()
    
    class Meta:
        model = Route
        fields = [
            'id', 'name', 'code', 'route_type', 'vehicle_number', 'driver_name',
            'pickup_start_time', 'drop_start_time', 'total_students', 'total_stops',
            'status', 'is_active'
        ]


class RouteSerializer(serializers.ModelSerializer):
    """Full route serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    helper_name = serializers.CharField(source='helper.get_full_name', read_only=True)
    total_students = serializers.ReadOnlyField()
    total_stops = serializers.ReadOnlyField()
    stops = StopListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at', 'updated_at']


class RouteWithStopsSerializer(serializers.ModelSerializer):
    """Route serializer with detailed stop information."""
    stops = StopSerializer(many=True, read_only=True)
    vehicle = VehicleListSerializer(read_only=True)
    driver = DriverListSerializer(read_only=True)
    
    class Meta:
        model = Route
        fields = '__all__'


# =============================================================================
# STUDENT TRANSPORT SERIALIZERS
# =============================================================================

class StudentTransportSerializer(serializers.ModelSerializer):
    """Student transport allocation serializer."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    student_class = serializers.SerializerMethodField()
    stop_name = serializers.CharField(source='stop.name', read_only=True)
    route_name = serializers.CharField(source='stop.route.name', read_only=True)
    monthly_fare = serializers.DecimalField(source='stop.monthly_fare', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = StudentTransport
        fields = '__all__'
        read_only_fields = ['tenant']
    
    def get_student_class(self, obj):
        if obj.student.current_enrollment:
            enrollment = obj.student.current_enrollment
            return f"{enrollment.grade.name} - {enrollment.section.name}"
        return None


class StudentTransportBulkSerializer(serializers.Serializer):
    """Serializer for bulk student transport allocation."""
    allocations = serializers.ListField(
        child=serializers.DictField()
    )


# =============================================================================
# GPS TRACKING SERIALIZERS
# =============================================================================

class VehicleTrackingSerializer(serializers.ModelSerializer):
    """Vehicle tracking data serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    
    class Meta:
        model = VehicleTracking
        fields = '__all__'
        read_only_fields = ['tenant', 'received_at']


class VehicleCurrentLocationSerializer(serializers.ModelSerializer):
    """Current vehicle location serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.model', read_only=True)
    route_name = serializers.CharField(source='current_route.name', read_only=True)
    last_stop_name = serializers.CharField(source='last_stop.name', read_only=True)
    next_stop_name = serializers.CharField(source='next_stop.name', read_only=True)
    
    class Meta:
        model = VehicleCurrentLocation
        fields = '__all__'
        read_only_fields = ['tenant']


class GPSDataIngestSerializer(serializers.Serializer):
    """Serializer for ingesting GPS data from devices."""
    device_id = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    speed = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    heading = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    altitude = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    accuracy = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    timestamp = serializers.DateTimeField(required=False)
    ignition_on = serializers.BooleanField(required=False, default=True)
    raw_data = serializers.JSONField(required=False)


# =============================================================================
# TRIP MANAGEMENT SERIALIZERS
# =============================================================================

class TripLogListSerializer(serializers.ModelSerializer):
    """Compact trip log serializer."""
    route_name = serializers.CharField(source='route.name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    
    class Meta:
        model = TripLog
        fields = [
            'id', 'trip_number', 'trip_type', 'date', 'status',
            'route_name', 'vehicle_number', 'driver_name',
            'scheduled_start_time', 'actual_start_time',
            'expected_passengers', 'actual_passengers'
        ]


class TripLogSerializer(serializers.ModelSerializer):
    """Full trip log serializer."""
    route_name = serializers.CharField(source='route.name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    helper_name = serializers.CharField(source='helper.get_full_name', read_only=True)
    
    class Meta:
        model = TripLog
        fields = '__all__'
        read_only_fields = ['tenant', 'trip_number', 'total_distance_km']


class TripStopLogSerializer(serializers.ModelSerializer):
    """Trip stop log serializer."""
    stop_name = serializers.CharField(source='stop.name', read_only=True)
    
    class Meta:
        model = TripStopLog
        fields = '__all__'
        read_only_fields = ['tenant']


class StudentTripAttendanceSerializer(serializers.ModelSerializer):
    """Student trip attendance serializer."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    stop_name = serializers.CharField(source='stop.name', read_only=True)
    
    class Meta:
        model = StudentTripAttendance
        fields = '__all__'
        read_only_fields = ['tenant']


class StartTripSerializer(serializers.Serializer):
    """Serializer for starting a trip."""
    route_id = serializers.UUIDField()
    trip_type = serializers.ChoiceField(choices=['PICKUP', 'DROP', 'SPECIAL', 'FIELD_TRIP'])
    driver_id = serializers.UUIDField(required=False)
    vehicle_id = serializers.UUIDField(required=False)
    start_odometer = serializers.IntegerField(required=False)


class EndTripSerializer(serializers.Serializer):
    """Serializer for ending a trip."""
    end_odometer = serializers.IntegerField(required=False)
    fuel_consumed = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    remarks = serializers.CharField(required=False)
    incidents = serializers.CharField(required=False)


class StudentBoardingSerializer(serializers.Serializer):
    """Serializer for recording student boarding."""
    student_id = serializers.UUIDField()
    boarding_status = serializers.ChoiceField(
        choices=['BOARDED', 'NOT_BOARDED', 'ABSENT', 'ALTERNATIVE']
    )
    scanned_via_rfid = serializers.BooleanField(default=False)
    remarks = serializers.CharField(required=False)


# =============================================================================
# MAINTENANCE SERIALIZERS
# =============================================================================

class VehicleMaintenanceListSerializer(serializers.ModelSerializer):
    """Compact maintenance serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    
    class Meta:
        model = VehicleMaintenance
        fields = [
            'id', 'vehicle_number', 'maintenance_type', 'priority',
            'scheduled_date', 'status', 'estimated_cost', 'actual_cost'
        ]


class VehicleMaintenanceSerializer(serializers.ModelSerializer):
    """Full maintenance serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.model', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = VehicleMaintenance
        fields = '__all__'
        read_only_fields = ['tenant', 'approved_by', 'approved_at']


class MaintenanceApprovalSerializer(serializers.Serializer):
    """Serializer for maintenance approval."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False)


class MaintenanceCompletionSerializer(serializers.Serializer):
    """Serializer for completing maintenance."""
    completed_date = serializers.DateField()
    completed_at_km = serializers.IntegerField(required=False)
    actual_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    parts_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    labor_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    vendor_name = serializers.CharField(required=False)
    invoice_number = serializers.CharField(required=False)
    next_scheduled_date = serializers.DateField(required=False)
    next_scheduled_km = serializers.IntegerField(required=False)
    notes = serializers.CharField(required=False)


# =============================================================================
# FUEL LOG SERIALIZERS
# =============================================================================

class FuelLogListSerializer(serializers.ModelSerializer):
    """Compact fuel log serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    
    class Meta:
        model = FuelLog
        fields = [
            'id', 'vehicle_number', 'driver_name', 'date',
            'fuel_type', 'quantity', 'total_cost', 'odometer_reading',
            'calculated_mileage'
        ]


class FuelLogSerializer(serializers.ModelSerializer):
    """Full fuel log serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    
    class Meta:
        model = FuelLog
        fields = '__all__'
        read_only_fields = ['tenant', 'km_since_last_fill', 'calculated_mileage']


# =============================================================================
# NOTIFICATION SERIALIZERS
# =============================================================================

class TransportNotificationSerializer(serializers.ModelSerializer):
    """Transport notification serializer."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = TransportNotification
        fields = '__all__'
        read_only_fields = ['tenant', 'sent_at', 'delivered_at']


class TransportNotificationSettingSerializer(serializers.ModelSerializer):
    """Notification settings serializer."""
    class Meta:
        model = TransportNotificationSetting
        fields = '__all__'
        read_only_fields = ['tenant']


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending custom notification."""
    notification_type = serializers.ChoiceField(
        choices=['DELAY', 'BREAKDOWN', 'ROUTE_CHANGE', 'CUSTOM']
    )
    route_id = serializers.UUIDField(required=False)
    trip_id = serializers.UUIDField(required=False)
    student_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False
    )
    title = serializers.CharField()
    message = serializers.CharField()
    eta_minutes = serializers.IntegerField(required=False)


# =============================================================================
# ANALYTICS & REPORTS SERIALIZERS
# =============================================================================

class TransportExpenseSummarySerializer(serializers.ModelSerializer):
    """Expense summary serializer."""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    
    class Meta:
        model = TransportExpenseSummary
        fields = '__all__'
        read_only_fields = ['tenant']


class TransportDashboardSerializer(serializers.Serializer):
    """Transport dashboard statistics."""
    total_vehicles = serializers.IntegerField()
    active_vehicles = serializers.IntegerField()
    vehicles_in_maintenance = serializers.IntegerField()
    total_drivers = serializers.IntegerField()
    active_drivers = serializers.IntegerField()
    total_routes = serializers.IntegerField()
    total_students = serializers.IntegerField()
    active_trips_today = serializers.IntegerField()
    completed_trips_today = serializers.IntegerField()
    documents_expiring_soon = serializers.IntegerField()


class RouteEfficiencySerializer(serializers.Serializer):
    """Route efficiency report."""
    route_id = serializers.UUIDField()
    route_name = serializers.CharField()
    total_trips = serializers.IntegerField()
    on_time_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_delay_minutes = serializers.DecimalField(max_digits=6, decimal_places=2)
    average_fuel_per_trip = serializers.DecimalField(max_digits=8, decimal_places=2)
    student_utilization = serializers.DecimalField(max_digits=5, decimal_places=2)


class FuelConsumptionReportSerializer(serializers.Serializer):
    """Fuel consumption report."""
    vehicle_id = serializers.UUIDField()
    vehicle_number = serializers.CharField()
    period = serializers.CharField()
    total_fuel = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_distance = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_mileage = serializers.DecimalField(max_digits=5, decimal_places=2)
