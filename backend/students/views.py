"""
Student 360° API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser, HasModulePermission
from .models import Student, StudentRemark, StudentDocument, StudentHealthRecord, StudentEnrollment
from .serializers import (
    StudentBasicSerializer,
    StudentDetailSerializer,
    StudentRemarkSerializer,
    CreateRemarkSerializer,
    StudentDocumentSerializer,
    StudentHealthRecordSerializer,
    Student360Serializer,
    SiblingSerializer,
    StudentEnrollmentSerializer
)
from .services import Student360Service, create_system_remark


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student management with 360° profile support.
    """
    # Require authentication and tenant membership. Module-level RBAC is
    # intentionally omitted here so tenant administrators (staff users)
    # can access student listings in development/seeding scenarios.
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        return Student.objects.filter(tenant=self.request.user.tenant, is_active=True)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentBasicSerializer
        return StudentDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    
    @action(detail=True, methods=['get'])
    def profile_360(self, request, pk=None):
        """
        Get complete 360° profile for a student.
        
        Returns comprehensive data from all modules.
        """
        student = self.get_object()
        service = Student360Service(student)
        profile_data = service.get_360_profile()
        
        serializer = Student360Serializer(profile_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def siblings(self, request, pk=None):
        """Get student's siblings."""
        student = self.get_object()
        siblings = student.get_siblings()
        
        serializer = SiblingSerializer(siblings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def remarks(self, request, pk=None):
        """Get all remarks for a student."""
        student = self.get_object()
        remarks = StudentRemark.objects.filter(student=student).order_by('-created_at')
        
        # Filter by type if provided
        remark_type = request.query_params.get('type')
        if remark_type:
            remarks = remarks.filter(remark_type=remark_type)
        
        # Filter by category if provided
        category = request.query_params.get('category')
        if category:
            remarks = remarks.filter(category=category)
        
        serializer = StudentRemarkSerializer(remarks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get all documents for a student."""
        student = self.get_object()
        documents = StudentDocument.objects.filter(student=student).order_by('-created_at')
        
        serializer = StudentDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def health_records(self, request, pk=None):
        """Get health records for a student."""
        student = self.get_object()
        records = StudentHealthRecord.objects.filter(student=student).order_by('-date')
        
        serializer = StudentHealthRecordSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_family(self, request):
        """Get all students in a family."""
        family_id = request.query_params.get('family_id')
        if not family_id:
            return Response(
                {'error': 'family_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        students = Student.objects.filter(
            tenant=request.user.tenant,
            family_id=family_id,
            is_active=True
        )
        
        serializer = StudentBasicSerializer(students, many=True)
        return Response(serializer.data)


class StudentRemarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student remarks (Universal Feed).
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasModulePermission]
    required_permission = ('student_module', 'read')
    
    def get_queryset(self):
        queryset = StudentRemark.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student', 'created_by_staff').order_by('-created_at')
        
        # Filter by student if provided
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by type if provided
        remark_type = self.request.query_params.get('type')
        if remark_type:
            queryset = queryset.filter(remark_type=remark_type)
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by visibility
        if self.request.query_params.get('parent_visible') == 'true':
            queryset = queryset.filter(visible_to_parent=True)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateRemarkSerializer
        return StudentRemarkSerializer
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Mark remark as acknowledged by parent."""
        remark = self.get_object()
        
        from django.utils import timezone
        remark.parent_acknowledged = True
        remark.parent_acknowledged_at = timezone.now()
        remark.save()
        
        serializer = self.get_serializer(remark)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_action_taken(self, request, pk=None):
        """Mark action as taken for a remark."""
        remark = self.get_object()
        
        action_notes = request.data.get('action_notes', '')
        remark.action_taken = True
        remark.action_notes = action_notes
        remark.save()
        
        serializer = self.get_serializer(remark)
        return Response(serializer.data)


class StudentDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student documents.
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasModulePermission]
    required_permission = ('student_module', 'read')
    serializer_class = StudentDocumentSerializer
    
    def get_queryset(self):
        return StudentDocument.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a document."""
        document = self.get_object()
        
        from django.utils import timezone
        document.is_verified = True
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)


class StudentHealthRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student health records.
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasModulePermission]
    required_permission = ('student_module', 'read')
    serializer_class = StudentHealthRecordSerializer
    
    def get_queryset(self):
        return StudentHealthRecord.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student').order_by('-date')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)



class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student enrollments.
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasModulePermission]
    required_permission = ('student_module', 'read')
    serializer_class = StudentEnrollmentSerializer
    
    def get_queryset(self):
        return StudentEnrollment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'academic_year', 'section')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

