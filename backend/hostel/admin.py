"""
Hostel Admin - Phase 5 Complete
"""
from django.contrib import admin
from .models import (
    HostelBuilding, Room, Bed, HostelAllocation,
    HostelFeeStructure, HostelFeePayment,
    HostelAttendance, HostelGatePass,
    HostelComplaint, MaintenanceSchedule,
    MessRegistration, MessMenu, MessAttendance
)


# Phase 5.1: Infrastructure
@admin.register(HostelBuilding)
class HostelBuildingAdmin(admin.ModelAdmin):
    list_display = ['name', 'building_type', 'warden', 'total_floors', 'is_active', 'total_capacity']
    list_filter = ['building_type', 'is_active']
    search_fields = ['name', 'address']


class BedInline(admin.TabularInline):
    model = Bed
    extra = 4


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_number', 'building', 'floor', 'capacity', 'is_ac', 'monthly_fee', 'is_available', 'maintenance_status']
    list_filter = ['building', 'is_ac', 'is_available', 'maintenance_status', 'floor']
    search_fields = ['room_number', 'building__name']
    inlines = [BedInline]


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ['bed_number', 'room', 'is_occupied']
    list_filter = ['is_occupied', 'room__building']
    search_fields = ['bed_number', 'room__room_number']


# Phase 5.2: Allocations
@admin.register(HostelAllocation)
class HostelAllocationAdmin(admin.ModelAdmin):
    list_display = ['student', 'bed', 'start_date', 'end_date', 'is_active', 'security_deposit_paid']
    list_filter = ['is_active', 'start_date']
    search_fields = ['student__first_name', 'student__last_name', 'student__admission_number', 'bed__room__room_number']
    date_hierarchy = 'start_date'


# Phase 5.3: Fees
@admin.register(HostelFeeStructure)
class HostelFeeStructureAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'academic_year', 'monthly_rent', 'security_deposit', 'is_active']
    list_filter = ['room_type', 'academic_year', 'is_active']
    search_fields = ['name', 'room_type']


@admin.register(HostelFeePayment)
class HostelFeePaymentAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'payment_month', 'payment_date', 'total_amount', 'payment_method', 'receipt_number']
    list_filter = ['payment_method', 'payment_date', 'payment_month']
    search_fields = ['allocation__student__first_name', 'allocation__student__last_name', 'receipt_number', 'transaction_id']
    date_hierarchy = 'payment_date'


# Phase 5.4: Attendance & Gate Pass
@admin.register(HostelAttendance)
class HostelAttendanceAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'date', 'morning_status', 'evening_status', 'night_status']
    list_filter = ['morning_status', 'evening_status', 'night_status', 'date']
    search_fields = ['allocation__student__first_name', 'allocation__student__last_name']
    date_hierarchy = 'date'


@admin.register(HostelGatePass)
class HostelGatePassAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'pass_type', 'from_date', 'to_date', 'status', 'approved_by', 'destination']
    list_filter = ['pass_type', 'status', 'from_date']
    search_fields = ['allocation__student__first_name', 'allocation__student__last_name', 'destination', 'reason']
    date_hierarchy = 'from_date'


# Phase 5.5: Complaints & Maintenance
@admin.register(HostelComplaint)
class HostelComplaintAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'complaint_type', 'priority', 'status', 'reported_date', 'assigned_to', 'resolution_date']
    list_filter = ['complaint_type', 'priority', 'status', 'reported_date']
    search_fields = ['allocation__student__first_name', 'allocation__student__last_name', 'subject', 'description']
    date_hierarchy = 'reported_date'


@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ['maintenance_type', 'scheduled_date', 'room', 'building', 'assigned_to', 'status', 'is_recurring']
    list_filter = ['maintenance_type', 'status', 'is_recurring', 'scheduled_date']
    search_fields = ['title', 'description', 'room__room_number', 'building__name']
    date_hierarchy = 'scheduled_date'


# Phase 5.6: Mess Management
@admin.register(MessRegistration)
class MessRegistrationAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'meal_plan', 'dietary_preference', 'monthly_fee', 'start_date', 'is_active']
    list_filter = ['meal_plan', 'dietary_preference', 'is_active', 'start_date']
    search_fields = ['allocation__student__first_name', 'allocation__student__last_name', 'allergies']


@admin.register(MessMenu)
class MessMenuAdmin(admin.ModelAdmin):
    list_display = ['building', 'week_start_date', 'day_of_week', 'meal_type', 'items', 'is_active']
    list_filter = ['building', 'day_of_week', 'meal_type', 'is_active', 'week_start_date']
    search_fields = ['items', 'building__name']


@admin.register(MessAttendance)
class MessAttendanceAdmin(admin.ModelAdmin):
    list_display = ['registration', 'date', 'breakfast_taken', 'lunch_taken', 'snacks_taken', 'dinner_taken', 'total_meals']
    list_filter = ['date', 'breakfast_taken', 'lunch_taken', 'snacks_taken', 'dinner_taken']
    search_fields = ['registration__allocation__student__first_name', 'registration__allocation__student__last_name']
    date_hierarchy = 'date'
    
    def total_meals(self, obj):
        return obj.total_meals
    total_meals.short_description = 'Total Meals'

