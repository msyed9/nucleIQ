"""
Transport & Fleet Management Models - Enhanced Version

Features:
- Vehicle Management with GPS Tracking
- Driver Management with Attendance
- Route Optimization
- Trip Logs
- Maintenance Scheduling
- Fuel Management
- Parent Notifications
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from core.models import TenantAwareModel


# =============================================================================
# VEHICLE MANAGEMENT
# =============================================================================

class Vehicle(TenantAwareModel):
    """
    School Buses / Vans
    """
    VEHICLE_TYPES = [
        ('BUS', _('Bus')),
        ('MINI_BUS', _('Mini Bus')),
        ('VAN', _('Van')),
        ('CAR', _('Car')),
        ('OTHER', _('Other')),
    ]
    
    FUEL_TYPES = [
        ('DIESEL', _('Diesel')),
        ('PETROL', _('Petrol')),
        ('CNG', _('CNG')),
        ('ELECTRIC', _('Electric')),
        ('HYBRID', _('Hybrid')),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', _('Active')),
        ('MAINTENANCE', _('Under Maintenance')),
        ('INACTIVE', _('Inactive')),
        ('DECOMMISSIONED', _('Decommissioned')),
    ]
    
    vehicle_number = models.CharField(max_length=20, help_text=_("License Plate Number"))
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default='BUS')
    make = models.CharField(max_length=50, blank=True, help_text=_("Manufacturer"))
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField(null=True, blank=True, help_text=_("Manufacturing Year"))
    color = models.CharField(max_length=30, blank=True)
    capacity = models.IntegerField(help_text=_("Seating Capacity"))
    
    # Fuel & Performance
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES, default='DIESEL')
    fuel_tank_capacity = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text=_("Tank capacity in liters"))
    average_mileage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text=_("Km per liter"))
    current_odometer = models.PositiveIntegerField(default=0, help_text=_("Current odometer reading in km"))
    
    # GPS & Tracking
    gps_device_id = models.CharField(max_length=50, blank=True, help_text=_("GPS device identifier"))
    gps_provider = models.CharField(max_length=50, blank=True, help_text=_("GPS service provider"))
    
    # Compliance Documents
    registration_number = models.CharField(max_length=50, blank=True)
    registration_expiry = models.DateField(null=True, blank=True)
    insurance_number = models.CharField(max_length=50, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    insurance_provider = models.CharField(max_length=100, blank=True)
    fitness_certificate_number = models.CharField(max_length=50, blank=True)
    fitness_certificate_expiry = models.DateField(null=True, blank=True)
    pollution_certificate_number = models.CharField(max_length=50, blank=True)
    pollution_certificate_expiry = models.DateField(null=True, blank=True)
    permit_number = models.CharField(max_length=50, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_active = models.BooleanField(default=True)
    
    # Contact for vehicle
    emergency_contact = models.CharField(max_length=15, blank=True)
    
    # Images
    photo = models.ImageField(upload_to='transport/vehicles/', null=True, blank=True)
    
    class Meta:
        db_table = 'transport_vehicles'
        unique_together = ['tenant', 'vehicle_number']
        ordering = ['vehicle_number']

    def __str__(self):
        return f"{self.vehicle_number} ({self.model})"
    
    @property
    def is_documents_valid(self):
        """Check if all documents are valid."""
        today = timezone.now().date()
        documents = [
            self.insurance_expiry,
            self.fitness_certificate_expiry,
            self.pollution_certificate_expiry,
            self.permit_expiry,
        ]
        return all(doc and doc > today for doc in documents if doc)
    
    @property
    def next_expiring_document(self):
        """Get the next document that will expire."""
        today = timezone.now().date()
        documents = []
        
        if self.insurance_expiry:
            documents.append(('Insurance', self.insurance_expiry))
        if self.fitness_certificate_expiry:
            documents.append(('Fitness Certificate', self.fitness_certificate_expiry))
        if self.pollution_certificate_expiry:
            documents.append(('Pollution Certificate', self.pollution_certificate_expiry))
        if self.permit_expiry:
            documents.append(('Permit', self.permit_expiry))
        
        valid_docs = [(name, date) for name, date in documents if date >= today]
        if valid_docs:
            return min(valid_docs, key=lambda x: x[1])
        return None


class Driver(TenantAwareModel):
    """
    Bus Drivers with enhanced tracking
    """
    LICENSE_TYPES = [
        ('LMV', _('Light Motor Vehicle')),
        ('HMV', _('Heavy Motor Vehicle')),
        ('TRANSPORT', _('Transport')),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', _('Active')),
        ('ON_LEAVE', _('On Leave')),
        ('SUSPENDED', _('Suspended')),
        ('INACTIVE', _('Inactive')),
    ]
    
    # Link to staff
    staff = models.OneToOneField(
        'staff.Staff', 
        on_delete=models.CASCADE, 
        related_name='driver_profile'
    )
    employee_code = models.CharField(max_length=20, blank=True)
    
    # License Details
    license_number = models.CharField(max_length=50)
    license_type = models.CharField(max_length=20, choices=LICENSE_TYPES, default='HMV')
    license_expiry = models.DateField()
    license_issue_date = models.DateField(null=True, blank=True)
    license_issuing_authority = models.CharField(max_length=100, blank=True)
    
    # Badges & Permits
    badge_number = models.CharField(max_length=50, blank=True)
    badge_expiry = models.DateField(null=True, blank=True)
    police_verification_date = models.DateField(null=True, blank=True)
    police_verification_valid_until = models.DateField(null=True, blank=True)
    
    # Contact
    phone = models.CharField(max_length=15, blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    
    # Driving Record
    years_of_experience = models.PositiveIntegerField(default=0)
    total_incidents = models.PositiveIntegerField(default=0)
    last_incident_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Default Vehicle (if assigned)
    default_vehicle = models.ForeignKey(
        Vehicle, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='default_drivers'
    )
    
    class Meta:
        db_table = 'transport_drivers'
        ordering = ['staff__first_name']

    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.license_number}"
    
    @property
    def is_license_valid(self):
        """Check if license is valid."""
        return self.license_expiry > timezone.now().date()
    
    @property
    def get_full_name(self):
        """Get driver's full name."""
        return self.staff.get_full_name()


class DriverAttendance(TenantAwareModel):
    """
    Driver attendance records
    """
    ATTENDANCE_STATUS = [
        ('PRESENT', _('Present')),
        ('ABSENT', _('Absent')),
        ('LATE', _('Late')),
        ('ON_LEAVE', _('On Leave')),
        ('HALF_DAY', _('Half Day')),
    ]
    
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS, default='PRESENT')
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'transport_driver_attendance'
        unique_together = ['driver', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.driver} - {self.date} - {self.status}"


# =============================================================================
# ROUTE MANAGEMENT
# =============================================================================

class Route(TenantAwareModel):
    """
    Transport Route with optimization features
    """
    ROUTE_TYPES = [
        ('PICKUP', _('Pickup Only')),
        ('DROP', _('Drop Only')),
        ('BOTH', _('Pickup & Drop')),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', _('Active')),
        ('INACTIVE', _('Inactive')),
        ('SUSPENDED', _('Suspended')),
    ]
    
    name = models.CharField(max_length=100, help_text=_("Route Name (e.g. Route 5)"))
    code = models.CharField(max_length=20, blank=True, help_text=_("Route Code"))
    description = models.TextField(blank=True)
    route_type = models.CharField(max_length=20, choices=ROUTE_TYPES, default='BOTH')
    
    # Vehicle & Driver Assignment
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='routes')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='routes')
    helper = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='helper_routes')
    
    # Timing
    pickup_start_time = models.TimeField(null=True, blank=True, help_text=_("Morning pickup start"))
    pickup_end_time = models.TimeField(null=True, blank=True, help_text=_("Morning pickup end"))
    drop_start_time = models.TimeField(null=True, blank=True, help_text=_("Afternoon drop start"))
    drop_end_time = models.TimeField(null=True, blank=True, help_text=_("Afternoon drop end"))
    
    # For backward compatibility
    start_time = models.TimeField(null=True, blank=True, help_text=_("Legacy: Morning Start Time"))
    
    # Route Details
    total_distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Geofencing
    start_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    start_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    end_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    end_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    route_path = models.JSONField(null=True, blank=True, help_text=_("Array of lat/lng points"))
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'transport_routes'
        unique_together = ['tenant', 'code']
        ordering = ['name']

    def __str__(self):
        return self.name
    
    @property
    def total_students(self):
        """Count students on this route."""
        return StudentTransport.objects.filter(
            stop__route=self,
            is_active=True
        ).count()
    
    @property
    def total_stops(self):
        """Count stops on this route."""
        return self.stops.count()


class Stop(TenantAwareModel):
    """
    Stops along a route with geolocation
    """
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=200, help_text=_("Stop Name/Location"))
    address = models.TextField(blank=True)
    
    # Sequence
    order = models.IntegerField(default=0, help_text=_("Sequence Order"))
    
    # Geolocation
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    geofence_radius = models.PositiveIntegerField(default=100, help_text=_("Radius in meters"))
    
    # Timing
    pickup_time = models.TimeField(null=True, blank=True)
    drop_time = models.TimeField(null=True, blank=True)
    wait_time_minutes = models.PositiveIntegerField(default=2, help_text=_("Wait time at stop"))
    
    # Fare
    monthly_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text=_("Monthly fare"))
    one_way_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text=_("One-way fare"))
    
    # Landmark for easy identification
    landmark = models.CharField(max_length=200, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'transport_stops'
        ordering = ['route', 'order']
        unique_together = ['route', 'order']

    def __str__(self):
        return f"{self.name} ({self.route.name})"
    
    @property
    def student_count(self):
        """Count students at this stop."""
        return self.students.filter(is_active=True).count()


# =============================================================================
# STUDENT TRANSPORT ALLOCATION
# =============================================================================

class StudentTransport(TenantAwareModel):
    """
    Allocation of transport to a student
    """
    TRANSPORT_TYPES = [
        ('BOTH', _('Both Pickup & Drop')),
        ('PICKUP', _('Pickup Only')),
        ('DROP', _('Drop Only')),
    ]
    
    student = models.OneToOneField(
        'students.Student', 
        on_delete=models.CASCADE, 
        related_name='transport'
    )
    stop = models.ForeignKey(Stop, on_delete=models.PROTECT, related_name='students')
    transport_type = models.CharField(max_length=20, choices=TRANSPORT_TYPES, default='BOTH')
    
    # Status
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    # RFID/Card for tracking
    rfid_card_number = models.CharField(max_length=50, blank=True)
    
    # Parent notification preferences
    notify_on_pickup = models.BooleanField(default=True)
    notify_on_drop = models.BooleanField(default=True)
    notify_on_delay = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'transport_allocations'
        ordering = ['student__first_name']

    def __str__(self):
        return f"{self.student} - {self.stop}"


# =============================================================================
# GPS TRACKING
# =============================================================================

class VehicleTracking(TenantAwareModel):
    """
    Real-time GPS tracking data
    """
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='tracking_history')
    
    # Location
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    altitude = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Motion
    speed = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text=_("Speed in km/h"))
    heading = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text=_("Direction in degrees"))
    
    # Accuracy
    accuracy = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text=_("GPS accuracy in meters"))
    
    # Vehicle Status
    ignition_on = models.BooleanField(default=True)
    is_moving = models.BooleanField(default=False)
    
    # Timestamp
    timestamp = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)
    
    # Raw data from GPS device
    raw_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        db_table = 'transport_vehicle_tracking'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['vehicle', '-timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.vehicle} @ {self.timestamp}"


class VehicleCurrentLocation(TenantAwareModel):
    """
    Current location of each vehicle (single record per vehicle)
    """
    vehicle = models.OneToOneField(Vehicle, on_delete=models.CASCADE, related_name='current_location')
    
    # Current Position
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    speed = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    heading = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Status
    ignition_on = models.BooleanField(default=False)
    is_moving = models.BooleanField(default=False)
    
    # Current Route/Trip Info
    current_route = models.ForeignKey(Route, on_delete=models.SET_NULL, null=True, blank=True)
    current_trip = models.ForeignKey('TripLog', on_delete=models.SET_NULL, null=True, blank=True, related_name='current_vehicle')
    last_stop = models.ForeignKey(Stop, on_delete=models.SET_NULL, null=True, blank=True, related_name='last_stop_vehicles')
    next_stop = models.ForeignKey(Stop, on_delete=models.SET_NULL, null=True, blank=True, related_name='next_stop_vehicles')
    eta_next_stop = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    last_updated = models.DateTimeField(auto_now=True)
    location_updated_at = models.DateTimeField()
    
    class Meta:
        db_table = 'transport_vehicle_current_location'

    def __str__(self):
        return f"{self.vehicle} - Current Location"


# =============================================================================
# TRIP MANAGEMENT
# =============================================================================

class TripLog(TenantAwareModel):
    """
    Trip logs for each vehicle run
    """
    TRIP_TYPES = [
        ('PICKUP', _('Morning Pickup')),
        ('DROP', _('Afternoon Drop')),
        ('SPECIAL', _('Special Trip')),
        ('FIELD_TRIP', _('Field Trip')),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', _('Scheduled')),
        ('IN_PROGRESS', _('In Progress')),
        ('COMPLETED', _('Completed')),
        ('CANCELLED', _('Cancelled')),
        ('DELAYED', _('Delayed')),
    ]
    
    # Trip Identification
    trip_number = models.CharField(max_length=50, unique=True, editable=False)
    trip_type = models.CharField(max_length=20, choices=TRIP_TYPES, default='PICKUP')
    
    # Vehicle & Driver
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='trips')
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name='trips')
    helper = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='helper_trips')
    route = models.ForeignKey(Route, on_delete=models.PROTECT, related_name='trips')
    
    # Scheduling
    date = models.DateField()
    scheduled_start_time = models.TimeField()
    scheduled_end_time = models.TimeField(null=True, blank=True)
    
    # Actual Times
    actual_start_time = models.TimeField(null=True, blank=True)
    actual_end_time = models.TimeField(null=True, blank=True)
    
    # Distance & Fuel
    start_odometer = models.PositiveIntegerField(null=True, blank=True)
    end_odometer = models.PositiveIntegerField(null=True, blank=True)
    total_distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fuel_consumed = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text=_("Liters"))
    
    # Passengers
    expected_passengers = models.PositiveIntegerField(default=0)
    actual_passengers = models.PositiveIntegerField(default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    delay_minutes = models.PositiveIntegerField(default=0)
    delay_reason = models.TextField(blank=True)
    
    # Notes
    remarks = models.TextField(blank=True)
    incidents = models.TextField(blank=True)
    
    class Meta:
        db_table = 'transport_trip_logs'
        ordering = ['-date', '-scheduled_start_time']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['vehicle', 'date']),
        ]

    def __str__(self):
        return f"{self.trip_number} - {self.route.name} ({self.date})"
    
    def save(self, *args, **kwargs):
        if not self.trip_number:
            # Generate trip number: TRIP-YYYYMMDD-XXXX
            date_str = timezone.now().strftime('%Y%m%d')
            last_trip = TripLog.objects.filter(
                tenant=self.tenant,
                trip_number__startswith=f'TRIP-{date_str}'
            ).order_by('-trip_number').first()
            
            if last_trip:
                try:
                    last_num = int(last_trip.trip_number.split('-')[-1])
                    new_num = last_num + 1
                except:
                    new_num = 1
            else:
                new_num = 1
            
            self.trip_number = f'TRIP-{date_str}-{new_num:04d}'
        
        # Calculate distance
        if self.start_odometer and self.end_odometer:
            self.total_distance_km = self.end_odometer - self.start_odometer
        
        super().save(*args, **kwargs)


class TripStopLog(TenantAwareModel):
    """
    Log of each stop during a trip
    """
    EVENT_TYPES = [
        ('ARRIVAL', _('Arrived at Stop')),
        ('DEPARTURE', _('Left Stop')),
        ('SKIP', _('Skipped Stop')),
    ]
    
    trip = models.ForeignKey(TripLog, on_delete=models.CASCADE, related_name='stop_logs')
    stop = models.ForeignKey(Stop, on_delete=models.PROTECT, related_name='trip_logs')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    
    scheduled_time = models.TimeField()
    actual_time = models.TimeField()
    
    # Geolocation when event occurred
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Passenger boarding
    students_boarded = models.PositiveIntegerField(default=0)
    students_alighted = models.PositiveIntegerField(default=0)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'transport_trip_stop_logs'
        ordering = ['trip', 'actual_time']

    def __str__(self):
        return f"{self.trip} - {self.stop} @ {self.actual_time}"


class StudentTripAttendance(TenantAwareModel):
    """
    Track which students were on each trip
    """
    BOARDING_STATUS = [
        ('BOARDED', _('Boarded')),
        ('NOT_BOARDED', _('Did Not Board')),
        ('ABSENT', _('Absent from School')),
        ('ALTERNATIVE', _('Using Alternative Transport')),
    ]
    
    trip = models.ForeignKey(TripLog, on_delete=models.CASCADE, related_name='student_attendance')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='trip_attendance')
    stop = models.ForeignKey(Stop, on_delete=models.PROTECT)
    
    # Boarding
    boarding_status = models.CharField(max_length=20, choices=BOARDING_STATUS, default='NOT_BOARDED')
    boarding_time = models.TimeField(null=True, blank=True)
    alighting_time = models.TimeField(null=True, blank=True)
    
    # RFID/Manual
    scanned_via_rfid = models.BooleanField(default=False)
    
    # Notification
    parent_notified = models.BooleanField(default=False)
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'transport_student_trip_attendance'
        unique_together = ['trip', 'student']

    def __str__(self):
        return f"{self.student} - {self.trip}"


# =============================================================================
# MAINTENANCE & FUEL MANAGEMENT
# =============================================================================

class VehicleMaintenance(TenantAwareModel):
    """
    Vehicle maintenance records and schedules
    """
    MAINTENANCE_TYPES = [
        ('SCHEDULED', _('Scheduled Service')),
        ('REPAIR', _('Repair')),
        ('BREAKDOWN', _('Breakdown')),
        ('INSPECTION', _('Inspection')),
        ('TIRE', _('Tire Change/Rotation')),
        ('OIL_CHANGE', _('Oil Change')),
        ('BATTERY', _('Battery')),
        ('BRAKE', _('Brake Service')),
        ('AC_SERVICE', _('AC Service')),
        ('BODY_WORK', _('Body Work')),
        ('OTHER', _('Other')),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', _('Scheduled')),
        ('IN_PROGRESS', _('In Progress')),
        ('COMPLETED', _('Completed')),
        ('CANCELLED', _('Cancelled')),
        ('OVERDUE', _('Overdue')),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', _('Low')),
        ('MEDIUM', _('Medium')),
        ('HIGH', _('High')),
        ('CRITICAL', _('Critical')),
    ]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenances')
    
    # Maintenance Details
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPES)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    # Scheduling
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    
    # Odometer-based scheduling
    scheduled_at_km = models.PositiveIntegerField(null=True, blank=True)
    completed_at_km = models.PositiveIntegerField(null=True, blank=True)
    
    # Vendor/Workshop
    vendor_name = models.CharField(max_length=200, blank=True)
    vendor_contact = models.CharField(max_length=15, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)
    
    # Cost
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    parts_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labor_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    # Next maintenance
    next_scheduled_date = models.DateField(null=True, blank=True)
    next_scheduled_km = models.PositiveIntegerField(null=True, blank=True)
    
    # Documentation
    invoice_file = models.FileField(upload_to='transport/maintenance/', null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Approval
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_maintenances')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'transport_vehicle_maintenance'
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.vehicle} - {self.maintenance_type} ({self.scheduled_date})"


class FuelLog(TenantAwareModel):
    """
    Fuel consumption records
    """
    FUEL_TYPES = [
        ('DIESEL', _('Diesel')),
        ('PETROL', _('Petrol')),
        ('CNG', _('CNG')),
    ]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='fuel_logs')
    
    # Fueling Details
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES)
    quantity = models.DecimalField(max_digits=8, decimal_places=2, help_text=_("Liters"))
    rate_per_liter = models.DecimalField(max_digits=8, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Odometer
    odometer_reading = models.PositiveIntegerField()
    
    # Fuel Station
    station_name = models.CharField(max_length=200, blank=True)
    station_location = models.CharField(max_length=200, blank=True)
    
    # Payment
    payment_mode = models.CharField(max_length=20, default='CASH')
    receipt_number = models.CharField(max_length=50, blank=True)
    receipt_file = models.FileField(upload_to='transport/fuel_receipts/', null=True, blank=True)
    
    # Tank Status
    is_full_tank = models.BooleanField(default=True)
    
    # Mileage Calculation
    km_since_last_fill = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    calculated_mileage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text=_("Km per liter"))
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'transport_fuel_logs'
        ordering = ['-date', '-time']

    def __str__(self):
        return f"{self.vehicle} - {self.quantity}L ({self.date})"
    
    def save(self, *args, **kwargs):
        # Calculate total cost if not provided
        if not self.total_cost:
            self.total_cost = self.quantity * self.rate_per_liter
        
        # Calculate mileage if full tank fill
        if self.is_full_tank:
            last_full = FuelLog.objects.filter(
                vehicle=self.vehicle,
                is_full_tank=True,
                odometer_reading__lt=self.odometer_reading
            ).order_by('-odometer_reading').first()
            
            if last_full:
                self.km_since_last_fill = self.odometer_reading - last_full.odometer_reading
                if self.quantity > 0:
                    self.calculated_mileage = self.km_since_last_fill / self.quantity
        
        super().save(*args, **kwargs)


# =============================================================================
# PARENT NOTIFICATIONS
# =============================================================================

class TransportNotification(TenantAwareModel):
    """
    Transport-related notifications sent to parents
    """
    NOTIFICATION_TYPES = [
        ('PICKUP_STARTED', _('Pickup Route Started')),
        ('APPROACHING_STOP', _('Bus Approaching Stop')),
        ('STUDENT_BOARDED', _('Student Boarded')),
        ('STUDENT_ALIGHTED', _('Student Alighted')),
        ('ARRIVED_SCHOOL', _('Arrived at School')),
        ('DROP_STARTED', _('Drop Route Started')),
        ('DELAY', _('Route Delayed')),
        ('BREAKDOWN', _('Vehicle Breakdown')),
        ('ROUTE_CHANGE', _('Route Change')),
        ('CUSTOM', _('Custom Message')),
    ]
    
    DELIVERY_STATUS = [
        ('PENDING', _('Pending')),
        ('SENT', _('Sent')),
        ('DELIVERED', _('Delivered')),
        ('FAILED', _('Failed')),
    ]
    
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    
    # Recipients
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='transport_notifications')
    parent_user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    
    # Context
    trip = models.ForeignKey(TripLog, on_delete=models.SET_NULL, null=True, blank=True)
    stop = models.ForeignKey(Stop, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Message
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Vehicle Location (when sent)
    vehicle_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    vehicle_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    eta_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Delivery
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_channel = models.CharField(max_length=20, blank=True, help_text=_("SMS, Push, WhatsApp"))
    
    class Meta:
        db_table = 'transport_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} - {self.student}"


class TransportNotificationSetting(TenantAwareModel):
    """
    Notification settings for transport module
    """
    # Global Settings
    send_pickup_start_notification = models.BooleanField(default=True)
    send_approaching_stop_notification = models.BooleanField(default=True)
    approaching_stop_minutes = models.PositiveIntegerField(default=5, help_text=_("Minutes before arrival"))
    send_student_boarded_notification = models.BooleanField(default=True)
    send_student_alighted_notification = models.BooleanField(default=True)
    send_delay_notification = models.BooleanField(default=True)
    delay_threshold_minutes = models.PositiveIntegerField(default=10, help_text=_("Notify if delay exceeds"))
    
    # Channels
    use_sms = models.BooleanField(default=True)
    use_push = models.BooleanField(default=True)
    use_whatsapp = models.BooleanField(default=False)
    use_email = models.BooleanField(default=False)
    
    # Templates
    pickup_start_template = models.TextField(blank=True)
    approaching_template = models.TextField(blank=True)
    boarded_template = models.TextField(blank=True)
    alighted_template = models.TextField(blank=True)
    delay_template = models.TextField(blank=True)
    
    class Meta:
        db_table = 'transport_notification_settings'

    def __str__(self):
        return f"Transport Notification Settings - {self.tenant}"


# =============================================================================
# REPORTS & ANALYTICS
# =============================================================================

class TransportExpenseSummary(TenantAwareModel):
    """
    Monthly transport expense summary (auto-generated)
    """
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='expense_summaries')
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    
    # Expenses
    fuel_expense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    maintenance_expense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    driver_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    insurance_expense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_expense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Usage
    total_trips = models.PositiveIntegerField(default=0)
    total_distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_fuel_liters = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_mileage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Revenue
    fee_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    students_using = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'transport_expense_summaries'
        unique_together = ['vehicle', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.vehicle} - {self.month}/{self.year}"

