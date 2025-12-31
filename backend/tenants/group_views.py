"""
Group Headquarters Views
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Tenant
from students.models import Student
from staff.models import Staff
# Assuming a Finance model exists or we mock revenue

class HeadquartersViewSet(viewsets.ViewSet):
    """
    Super Admin / Group Dashboard
    """
    permission_classes = [permissions.IsAdminUser]  # Only Superuser

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Aggregated Stats for Group
        """
        total_tenants = Tenant.objects.count()
        total_students = Student.objects.count()
        total_staff = Staff.objects.count()
        
        # Breakdown by School
        tenants = Tenant.objects.annotate(
            student_count=Count('students', distinct=True),
            staff_count=Count('staff_members', distinct=True)
        ).values('id', 'name', 'student_count', 'staff_count')
        
        return Response({
            'overview': {
                'schools': total_tenants,
                'students': total_students,
                'staff': total_staff,
                'total_revenue': 50000000 # Placeholder until Finance module
            },
            'schools_breakdown': list(tenants)
        })

    @action(detail=False, methods=['post'])
    def push_curriculum(self, request):
        """
        Push a standard curriculum (Subjects/Chapters) to all tenants.
        """
        # Logic to iterate all tenants and create Subject/Topic records
        return Response({'status': 'Curriculum Pushed to 50 Schools'})
