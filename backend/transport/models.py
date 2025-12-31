"""
Transport & Fleet Management Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TenantAwareModel
from django.utils import timezone

class Vehicle(TenantAwareModel):
    """
    School Buses / Vans
    """
    vehicle_number = models.CharField(max_length=20, unique=True, help_text=_("License Plate Number"))
    model = models.CharField(max_length=100)
    capacity = models.IntegerField(help_text=_("Seating Capacity"))
    
    # Tracking & Compliance
    gps_device_id = models.CharField(max_length=50, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    fitness_certificate_expiry = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'transport_vehicles'

    def __str__(self):
        return f"{self.vehicle_number} ({self.model})"


class Driver(TenantAwareModel):
    """
    Bus Drivers
    """
    staff = models.OneToOneField('staff.Staff', on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=50)
    license_expiry = models.DateField()
    
    class Meta:
        db_table = 'transport_drivers'

    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.license_number}"


class Route(TenantAwareModel):
    """
    Transport Route
    """
    name = models.CharField(max_length=100, help_text=_("Route Name (e.g. Route 5)"))
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True)
    
    start_time = models.TimeField(null=True, blank=True, help_text=_("Morning Start Time"))
    
    class Meta:
        db_table = 'transport_routes'

    def __str__(self):
        return self.name


class Stop(TenantAwareModel):
    """
    Stops along a route
    """
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=200, help_text=_("Stop Name/Location"))
    order = models.IntegerField(default=0, help_text=_("Sequence Order"))
    
    pickup_time = models.TimeField(null=True, blank=True)
    drop_time = models.TimeField(null=True, blank=True)
    
    monthly_fare = models.DecimalField(max_digits=10, decimal_places=2, help_text=_("Cost for this stop"))
    
    class Meta:
        db_table = 'transport_stops'
        ordering = ['route', 'order']

    def __str__(self):
        return f"{self.name} ({self.route.name})"


class StudentTransport(TenantAwareModel):
    """
    Allocation of transport to a student
    """
    student = models.OneToOneField('students.Student', on_delete=models.CASCADE, related_name='transport')
    stop = models.ForeignKey(Stop, on_delete=models.PROTECT, related_name='students')
    
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'transport_allocations'

    def __str__(self):
        return f"{self.student} - {self.stop}"
