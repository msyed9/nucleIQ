"""
Hostel Admin
"""
from django.contrib import admin
from .models import HostelBuilding, Room, Bed, HostelAllocation

@admin.register(HostelBuilding)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ['name', 'building_type', 'warden']

class BedInline(admin.TabularInline):
    model = Bed
    extra = 4

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['building', 'room_number', 'floor', 'capacity', 'is_ac']
    list_filter = ['building', 'is_ac']
    inlines = [BedInline]

@admin.register(HostelAllocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ['student', 'bed', 'start_date', 'is_active']
    search_fields = ['student__first_name', 'bed__room__room_number']
    list_filter = ['is_active']
