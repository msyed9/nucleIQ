"""
Parent Portal API Views

Provides read-only API endpoints for parent access to student data.
Enforces strict data isolation - parents can only see their own children's data.
"""

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers

from .models import ParentUser
from .parent_portal import ParentPortalService
from .parent_serializers import (
    ParentStudentListSerializer, ParentStudentDetailSerializer,
    ParentStudentRemarkSerializer, ParentStudentDocumentSerializer,
    ParentStudentHealthRecordSerializer, ParentStudent360Serializer,
    ParentProfileSerializer
)

User = get_user_model()


class ParentTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer for parent login.
    Supports login via email OR mobile number.
    Adds parent profile, email, and accessible students info to token response.
    """
    username_field = 'username'  # Accept either email or phone number
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace the email field with a more flexible username field
        del self.fields[self.username_field]
        self.fields['username'] = serializers.CharField(
            help_text="Email or mobile number"
        )
    
    def validate(self, attrs):
        username = attrs.get('username', '')
        password = attrs.get('password', '')
        
        # Try to find user by email or phone number
        user = User.objects.filter(
            Q(email__iexact=username) | Q(phone_number=username)
        ).first()
        
        if not user:
            raise serializers.ValidationError(
                "No account found with this email or mobile number."
            )
        
        # Check password
        if not user.check_password(password):
            raise serializers.ValidationError(
                "Incorrect password."
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )
        
        # Set the user for token generation
        self.user = user
        
        # Generate tokens
        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Check if user is a parent
        try:
            parent_profile = ParentUser.objects.get(
                user=self.user,
                portal_access_enabled=True
            )
            
            # Add parent-specific data
            data['user_type'] = 'parent'
            data['parent_id'] = parent_profile.id
            data['relation_type'] = parent_profile.relation_type
            data['email'] = self.user.email  # Include email in response
            data['phone_number'] = self.user.phone_number  # Include phone in response
            data['name'] = self.user.get_full_name()
            
            # Get accessible students with more details
            students = parent_profile.students.filter(is_active=True)
            students_data = []
            for student in students:
                enrollment = student.get_current_enrollment()
                students_data.append({
                    'id': str(student.id),
                    'admission_number': student.admission_number,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'full_name': student.get_full_name(),
                    'class': enrollment.section.grade_level.name if enrollment else 'N/A',
                    'section': enrollment.section.name if enrollment else 'N/A',
                    'photo_url': student.photo.url if student.photo else None,
                })
            data['students'] = students_data
            data['students_count'] = len(students_data)
            
            # Update last login
            parent_profile.last_login_at = timezone.now()
            parent_profile.save(update_fields=['last_login_at'])
            
        except ParentUser.DoesNotExist:
            raise PermissionDenied(
                "This account is not registered as a parent or portal access is disabled. "
                "Please contact school administration."
            )
        
        return data


class ParentLoginView(TokenObtainPairView):
    """
    Parent-specific login endpoint.
    
    POST /api/parent/auth/login/
    
    Request:
    {
        "email": "parent@example.com",
        "password": "password123"
    }
    
    Response:
    {
        "refresh": "...",
        "access": "...",
        "user_type": "parent",
        "parent_id": 1,
        "relation_type": "FATHER",
        "students": [
            {"id": 1, "admission_number": "ADM001", "first_name": "John", "last_name": "Doe"}
        ],
        "students_count": 1
    }
    """
    
    serializer_class = ParentTokenObtainPairSerializer
    permission_classes = [AllowAny]


class IsParentUser(IsAuthenticated):
    """
    Permission class to ensure user is a parent with portal access enabled.
    """
    
    def has_permission(self, request, view):
        # Check base authentication
        if not super().has_permission(request, view):
            return False
        
        # Check if user has parent profile with portal access
        try:
            parent_profile = ParentUser.objects.get(
                user=request.user,
                portal_access_enabled=True
            )
            # Attach to request for later use
            request.parent_profile = parent_profile
            return True
        except ParentUser.DoesNotExist:
            return False


class ParentStudentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for parents to view their students.
    
    Endpoints:
    - GET /api/parent/students/ - List all accessible students
    - GET /api/parent/students/{id}/ - Get student details
    - GET /api/parent/students/{id}/attendance/ - Get attendance summary
    - GET /api/parent/students/{id}/fees/ - Get fee summary
    - GET /api/parent/students/{id}/exams/ - Get exam summary
    - GET /api/parent/students/{id}/360/ - Get complete 360° summary
    - GET /api/parent/students/{id}/remarks/ - Get recent remarks
    - GET /api/parent/students/{id}/documents/ - Get documents
    - GET /api/parent/students/{id}/health-records/ - Get health records
    """
    
    permission_classes = [IsParentUser]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ParentStudentListSerializer
        return ParentStudentDetailSerializer
    
    def get_queryset(self):
        """Return students accessible to this parent."""
        service = ParentPortalService(self.request.user)
        return service.get_accessible_students()
    
    def retrieve(self, request, pk=None):
        """Get detailed student information."""
        service = ParentPortalService(request.user)
        student = service.get_student(pk)
        serializer = self.get_serializer(student)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """
        Get attendance summary for a student.
        
        Query params:
        - academic_year_id: Filter by academic year (optional)
        """
        service = ParentPortalService(request.user)
        academic_year_id = request.query_params.get('academic_year_id')
        
        summary = service.get_student_attendance_summary(
            pk,
            academic_year_id=academic_year_id
        )
        
        return Response(summary)
    
    @action(detail=True, methods=['get'])
    def fees(self, request, pk=None):
        """
        Get fee summary for a student.
        
        Query params:
        - academic_year_id: Filter by academic year (optional)
        """
        service = ParentPortalService(request.user)
        academic_year_id = request.query_params.get('academic_year_id')
        
        summary = service.get_student_fee_summary(
            pk,
            academic_year_id=academic_year_id
        )
        
        return Response(summary)
    
    @action(detail=True, methods=['get'])
    def exams(self, request, pk=None):
        """
        Get exam results summary for a student.
        
        Query params:
        - academic_year_id: Filter by academic year (optional)
        """
        service = ParentPortalService(request.user)
        academic_year_id = request.query_params.get('academic_year_id')
        
        summary = service.get_student_exam_summary(
            pk,
            academic_year_id=academic_year_id
        )
        
        return Response(summary)
    
    @action(detail=True, methods=['get'], url_path='360')
    def student_360(self, request, pk=None):
        """
        Get comprehensive 360° summary for a student.
        
        Query params:
        - academic_year_id: Filter by academic year (optional)
        """
        service = ParentPortalService(request.user)
        academic_year_id = request.query_params.get('academic_year_id')
        
        summary = service.get_student_360_summary(
            pk,
            academic_year_id=academic_year_id
        )
        
        serializer = ParentStudent360Serializer(summary)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def remarks(self, request, pk=None):
        """
        Get recent remarks for a student.
        
        Query params:
        - limit: Maximum number of remarks (default: 10)
        """
        service = ParentPortalService(request.user)
        limit = int(request.query_params.get('limit', 10))
        
        remarks = service.get_student_remarks(pk, limit=limit)
        serializer = ParentStudentRemarkSerializer(
            remarks,
            many=True,
            context={'request': request}
        )
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get documents for a student."""
        service = ParentPortalService(request.user)
        documents = service.get_student_documents(pk)
        
        serializer = ParentStudentDocumentSerializer(
            documents,
            many=True,
            context={'request': request}
        )
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='health-records')
    def health_records(self, request, pk=None):
        """Get health records for a student."""
        service = ParentPortalService(request.user)
        records = service.get_student_health_records(pk)
        
        serializer = ParentStudentHealthRecordSerializer(
            records,
            many=True,
            context={'request': request}
        )
        
        return Response(serializer.data)


class ParentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for parent to view and update their own profile.
    
    Endpoints:
    - GET /api/parent/profile/ - Get own profile
    - PATCH /api/parent/profile/ - Update notification preferences
    """
    
    permission_classes = [IsParentUser]
    serializer_class = ParentProfileSerializer
    
    def get_queryset(self):
        """Return only the current parent's profile."""
        return ParentUser.objects.filter(user=self.request.user)
    
    def list(self, request):
        """Get current parent's profile."""
        try:
            parent_profile = ParentUser.objects.get(user=request.user)
            
            # Update last login
            service = ParentPortalService(request.user)
            service.update_last_login()
            
            serializer = self.get_serializer(parent_profile)
            return Response(serializer.data)
        except ParentUser.DoesNotExist:
            raise PermissionDenied("Parent profile not found")
    
    def partial_update(self, request, pk=None):
        """
        Update parent profile preferences.
        
        Allowed fields:
        - preferred_language
        - email_notifications
        - sms_notifications
        - push_notifications
        """
        try:
            parent_profile = ParentUser.objects.get(user=request.user)
            
            # Only allow updating specific fields
            allowed_fields = [
                'preferred_language',
                'email_notifications',
                'sms_notifications',
                'push_notifications'
            ]
            
            # Filter out non-allowed fields
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            serializer = self.get_serializer(
                parent_profile,
                data=data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data)
        except ParentUser.DoesNotExist:
            raise PermissionDenied("Parent profile not found")


class ParentDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for parent dashboard summary.
    
    Endpoints:
    - GET /api/parent/dashboard/ - Get dashboard summary for all children
    """
    
    permission_classes = [IsParentUser]
    
    def list(self, request):
        """
        Get dashboard summary for all children.
        
        Returns aggregated data for all students linked to this parent.
        """
        service = ParentPortalService(request.user)
        students = service.get_accessible_students()
        
        # Build summary for each student
        students_summary = []
        for student in students:
            try:
                summary = service.get_student_360_summary(student.id)
                students_summary.append(summary)
            except Exception as e:
                # Log error but continue
                print(f"Error getting summary for student {student.id}: {e}")
                continue
        
        return Response({
            'total_students': len(students_summary),
            'students': students_summary,
            'last_updated': timezone.now()
        })
