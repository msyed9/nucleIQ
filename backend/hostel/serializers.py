"""
Hostel Serializers
"""
from rest_framework import serializers
from .models import HostelBuilding, Room, Bed, HostelAllocation

class BedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    beds = BedSerializer(many=True, read_only=True)
    building_name = serializers.CharField(source='building.name', read_only=True)
    
    class Meta:
        model = Room
        fields = '__all__'

class HostelBuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelBuilding
        fields = '__all__'

class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    bed_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelAllocation
        fields = '__all__'
    
    def get_bed_detail(self, obj):
        return str(obj.bed)
