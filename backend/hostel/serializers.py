"""
Hostel Serializers - Phase 5 Complete
"""
from rest_framework import serializers
from .models import (
    HostelBuilding, Room, Bed, HostelAllocation,
    HostelFeeStructure, HostelFeePayment,
    HostelAttendance, HostelGatePass,
    HostelComplaint, MaintenanceSchedule,
    MessRegistration, MessMenu, MessAttendance
)

# Phase 5.1: Infrastructure Serializers
class BedSerializer(serializers.ModelSerializer):
    allocation = serializers.SerializerMethodField()
    
    class Meta:
        model = Bed
        fields = '__all__'
    
    def get_allocation(self, obj):
        if hasattr(obj, 'allocation') and obj.allocation:
            return {
                'id': obj.allocation.id,
                'student_id': obj.allocation.student.id,
                'student_name': obj.allocation.student.get_full_name(),
                'start_date': obj.allocation.start_date,
            }
        return None


class RoomSerializer(serializers.ModelSerializer):
    beds = BedSerializer(many=True, read_only=True)
    building_name = serializers.CharField(source='building.name', read_only=True)
    available_beds = serializers.ReadOnlyField()
    occupancy_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Room
        fields = '__all__'


class HostelBuildingSerializer(serializers.ModelSerializer):
    warden_name = serializers.SerializerMethodField()
    total_rooms = serializers.ReadOnlyField()
    occupied_rooms = serializers.ReadOnlyField()
    total_beds = serializers.ReadOnlyField()
    occupied_beds = serializers.ReadOnlyField()
    
    class Meta:
        model = HostelBuilding
        fields = '__all__'
    
    def get_warden_name(self, obj):
        if obj.warden:
            return obj.warden.get_full_name()
        return None


class HostelBuildingDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with rooms"""
    rooms = RoomSerializer(many=True, read_only=True)
    warden_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelBuilding
        fields = '__all__'
    
    def get_warden_name(self, obj):
        if obj.warden:
            return obj.warden.get_full_name()
        return None


# Phase 5.2: Allocation Serializers
class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    bed_detail = serializers.SerializerMethodField()
    room_detail = serializers.SerializerMethodField()
    building_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelAllocation
        fields = '__all__'
    
    def get_bed_detail(self, obj):
        return str(obj.bed)
    
    def get_room_detail(self, obj):
        return {
            'id': obj.bed.room.id,
            'room_number': obj.bed.room.room_number,
            'floor': obj.bed.room.floor,
        }
    
    def get_building_detail(self, obj):
        return {
            'id': obj.bed.room.building.id,
            'name': obj.bed.room.building.name,
            'building_type': obj.bed.room.building.building_type,
        }


# Phase 5.3: Fee Serializers
class HostelFeeStructureSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    total_monthly_fee = serializers.ReadOnlyField()
    
    class Meta:
        model = HostelFeeStructure
        fields = '__all__'


class HostelFeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allocation.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='allocation.student.admission_number', read_only=True)
    fee_structure_name = serializers.CharField(source='fee_structure.name', read_only=True)
    
    class Meta:
        model = HostelFeePayment
        fields = '__all__'


# Phase 5.4: Attendance & Gate Pass Serializers
class HostelAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allocation.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='allocation.student.admission_number', read_only=True)
    
    class Meta:
        model = HostelAttendance
        fields = '__all__'


class HostelGatePassSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allocation.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='allocation.student.admission_number', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelGatePass
        fields = '__all__'
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None


# Phase 5.5: Complaint & Maintenance Serializers
class HostelComplaintSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allocation.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='allocation.student.admission_number', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelComplaint
        fields = '__all__'
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None


class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    building_name = serializers.CharField(source='building.name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MaintenanceSchedule
        fields = '__all__'
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None


# Phase 5.6: Mess Management Serializers
class MessRegistrationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allocation.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='allocation.student.admission_number', read_only=True)
    room_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = MessRegistration
        fields = '__all__'
    
    def get_room_detail(self, obj):
        return {
            'room_number': obj.allocation.bed.room.room_number,
            'building_name': obj.allocation.bed.room.building.name,
        }


class MessMenuSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    
    class Meta:
        model = MessMenu
        fields = '__all__'


class MessAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='registration.allocation.student.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='registration.allocation.student.admission_number', read_only=True)
    total_meals = serializers.ReadOnlyField()
    
    class Meta:
        model = MessAttendance
        fields = '__all__'

