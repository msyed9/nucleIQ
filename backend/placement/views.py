from rest_framework import viewsets
from .models import Recruiter, PlacementDrive, StudentApplication
from rest_framework import serializers
from core.middleware import get_current_tenant

class RecruiterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruiter
        fields = '__all__'

class PlacementDriveSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source='recruiter.name', read_only=True)
    class Meta:
        model = PlacementDrive
        fields = '__all__'

class StudentApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    drive_title = serializers.CharField(source='drive.title', read_only=True)
    company = serializers.CharField(source='drive.recruiter.name', read_only=True)
    class Meta:
        model = StudentApplication
        fields = '__all__'

class RecruiterViewSet(viewsets.ModelViewSet):
    queryset = Recruiter.objects.all()
    serializer_class = RecruiterSerializer
    def get_queryset(self): return Recruiter.objects.filter(tenant=get_current_tenant())

class PlacementDriveViewSet(viewsets.ModelViewSet):
    queryset = PlacementDrive.objects.all()
    serializer_class = PlacementDriveSerializer
    def get_queryset(self): return PlacementDrive.objects.filter(tenant=get_current_tenant())

class StudentApplicationViewSet(viewsets.ModelViewSet):
    queryset = StudentApplication.objects.all()
    serializer_class = StudentApplicationSerializer
    def get_queryset(self): return StudentApplication.objects.filter(tenant=get_current_tenant())
