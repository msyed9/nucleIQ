"""
Staff API Views
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsTenantUser
from .models import Staff, StaffDocument, StaffAttendance, StaffLeave
from .serializers import (
    StaffSerializer,
    StaffListSerializer,
    StaffDocumentSerializer,
    StaffAttendanceSerializer,
    StaffLeaveSerializer
)


class StaffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Staff management.
    Provides CRUD operations and additional actions.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['designation', 'department', 'employment_type', 'status']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email', 'phone']
    ordering_fields = ['first_name', 'joining_date', 'employee_id']
    ordering = ['first_name']
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list':
            return StaffListSerializer
        return StaffSerializer
    
    def get_queryset(self):
        """Filter by tenant."""
        return Staff.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('department', 'user')
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        staff = serializer.save(tenant=self.request.user.tenant)
        
        # Auto-assign role based on designation
        self._assign_role_by_designation(staff)
    
    def perform_update(self, serializer):
        """Update and reassign role if designation changed."""
        staff = serializer.save()
        
        # Check if designation changed
        if 'designation' in serializer.validated_data:
            self._assign_role_by_designation(staff)
    
    def _assign_role_by_designation(self, staff):
        """
        Auto-assign role to user based on staff designation.
        """
        if not staff.user:
            return
        
        from users.models import Role
        
        # Designation to Role mapping
        role_mapping = {
            'PRINCIPAL': 'Principal',
            'VICE_PRINCIPAL': 'Vice Principal',
            'HEAD_TEACHER': 'Head Teacher',
            'TEACHER': 'Teacher',
            'ASSISTANT_TEACHER': 'Teacher',
            'LIBRARIAN': 'Librarian',
            'LAB_ASSISTANT': 'Lab Assistant',
            'COUNSELOR': 'Counselor',
            'ACCOUNTANT': 'Accountant',
            'CLERK': 'Clerk',
            'RECEPTIONIST': 'Receptionist',
        }
        
        role_name = role_mapping.get(staff.designation)
        if role_name:
            try:
                role = Role.objects.get(
                    tenant=staff.tenant,
                    name=role_name
                )
                staff.user.role = role
                staff.user.save()
            except Role.DoesNotExist:
                pass
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active staff members."""
        queryset = self.get_queryset().filter(status='ACTIVE')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def teachers(self, request):
        """Get only teaching staff."""
        queryset = self.get_queryset().filter(
            designation__in=['TEACHER', 'ASSISTANT_TEACHER', 'HEAD_TEACHER']
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_inactive(self, request, pk=None):
        """Mark staff as inactive."""
        staff = self.get_object()
        staff.status = 'RESIGNED'
        staff.save()
        
        serializer = self.get_serializer(staff)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get staff statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'active': queryset.filter(status='ACTIVE').count(),
            'on_leave': queryset.filter(status='ON_LEAVE').count(),
            'by_designation': {},
            'by_department': {}
        }
        
        # Count by designation
        for designation, label in Staff.DESIGNATION_CHOICES:
            count = queryset.filter(designation=designation).count()
            if count > 0:
                stats['by_designation'][label] = count
        
        # Count by department
        departments = queryset.values_list('department__name', flat=True).distinct()
        for dept in departments:
            if dept:
                count = queryset.filter(department__name=dept).count()
                stats['by_department'][dept] = count
        
        return Response(stats)


class StaffDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Staff Documents.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffDocumentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['staff', 'document_type']
    
    def get_queryset(self):
        return StaffDocument.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff', 'uploaded_by')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            uploaded_by=self.request.user
        )


class StaffAttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Staff Attendance.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffAttendanceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'date', 'status']
    ordering_fields = ['date']
    ordering = ['-date']
    
    def get_queryset(self):
        return StaffAttendance.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff', 'marked_by')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            marked_by=self.request.user
        )
    
    @action(detail=False, methods=['post'])
    def mark_bulk(self, request):
        """Mark attendance for multiple staff members."""
        date = request.data.get('date')
        attendance_data = request.data.get('attendance', [])
        
        if not date or not attendance_data:
            return Response(
                {'error': 'Date and attendance data required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_count = 0
        for item in attendance_data:
            staff_id = item.get('staff_id')
            attendance_status = item.get('status')
            
            if staff_id and attendance_status:
                StaffAttendance.objects.update_or_create(
                    tenant=request.user.tenant,
                    staff_id=staff_id,
                    date=date,
                    defaults={
                        'status': attendance_status,
                        'marked_by': request.user
                    }
                )
                created_count += 1
        
        return Response({
            'message': f'Marked attendance for {created_count} staff members',
            'count': created_count
        })


class StaffLeaveViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Staff Leave applications.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffLeaveSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'leave_type', 'status']
    ordering_fields = ['from_date', 'created_at']
    ordering = ['-from_date']
    
    def get_queryset(self):
        return StaffLeave.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff', 'approved_by')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve leave application."""
        leave = self.get_object()
        
        if leave.status != 'PENDING':
            return Response(
                {'error': 'Only pending leaves can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        
        leave.status = 'APPROVED'
        leave.approved_by = request.user
        leave.approval_date = timezone.now()
        leave.approval_remarks = request.data.get('remarks', '')
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject leave application."""
        leave = self.get_object()
        
        if leave.status != 'PENDING':
            return Response(
                {'error': 'Only pending leaves can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        
        leave.status = 'REJECTED'
        leave.approved_by = request.user
        leave.approval_date = timezone.now()
        leave.approval_remarks = request.data.get('remarks', '')
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending leave applications."""
        queryset = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
