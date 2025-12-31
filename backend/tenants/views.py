from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser
from .models import AcademicYear, GradeLevel, Section, Department
from .serializers import (
    AcademicYearSerializer, 
    GradeLevelSerializer, 
    SectionSerializer, 
    DepartmentSerializer
)
from django_filters.rest_framework import DjangoFilterBackend

class AcademicYearViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AcademicYearSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        return AcademicYear.objects.filter(tenant=self.request.user.tenant)

class DepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        return Department.objects.filter(tenant=self.request.user.tenant)

class GradeLevelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = GradeLevelSerializer
    filter_backends = [DjangoFilterBackend]
    
    def get_queryset(self):
        return GradeLevel.objects.filter(tenant=self.request.user.tenant)

class SectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = SectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grade_level']
    
    def get_queryset(self):
        return Section.objects.filter(tenant=self.request.user.tenant)
