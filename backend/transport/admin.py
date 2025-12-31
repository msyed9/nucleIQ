"""
Transport Admin
"""
from django.contrib import admin
from .models import Vehicle, Driver, Route, Stop, StudentTransport

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['vehicle_number', 'model', 'capacity', 'is_active']
    search_fields = ['vehicle_number', 'model']

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['staff', 'license_number', 'license_expiry']
    search_fields = ['staff__first_name', 'license_number']

class StopInline(admin.TabularInline):
    model = Stop
    extra = 1

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'vehicle', 'driver', 'start_time']
    inlines = [StopInline]

@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ['name', 'route', 'order', 'pickup_time', 'monthly_fare']
    list_filter = ['route']
    ordering = ['route', 'order']

@admin.register(StudentTransport)
class StudentTransportAdmin(admin.ModelAdmin):
    list_display = ['student', 'stop', 'is_active', 'start_date']
    search_fields = ['student__first_name', 'stop__name']
    list_filter = ['is_active', 'stop__route']
