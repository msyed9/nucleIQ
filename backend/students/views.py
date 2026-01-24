"""
Student 360Â° API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from core.permissions import IsTenantUser, HasModulePermission, IsTenantAdmin
from django.http import HttpResponse
from django.utils import timezone
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Student, StudentRemark, StudentDocument, StudentHealthRecord, StudentEnrollment, ParentUser
from tenants.models import AcademicYear
from .serializers import (
    StudentBasicSerializer,
    StudentDetailSerializer,
    StudentRemarkSerializer,
    CreateRemarkSerializer,
    StudentDocumentSerializer,
    StudentHealthRecordSerializer,
    Student360Serializer,
    SiblingSerializer,
    StudentEnrollmentSerializer,
    ParentCredentialsSerializer
)
from .services import Student360Service, create_system_remark
from .bulk_import import BulkStudentImportService
from .promotion_service import PromotionService
from .notifications import StudentNotificationService
from . import tasks
import io
import pandas as pd
import random
import string


def _get_active_academic_year(tenant):
    return AcademicYear.objects.filter(tenant=tenant, is_active=True).first()


class IsNotParent(BasePermission):
    """
    Permission to ensure parent users cannot access admin APIs.
    Parents should use the dedicated /api/parent/* endpoints.
    """
    def has_permission(self, request, view):
        # Check if user has an active parent profile
        try:
            ParentUser.objects.get(user=request.user, portal_access_enabled=True)
            return False  # Is a parent, deny access
        except ParentUser.DoesNotExist:
            return True  # Not a parent, allow access


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student management with 360Â° profile support.
    """
    # Require authentication and tenant membership. Module-level RBAC is
    # intentionally omitted here so tenant administrators (staff users)
    # can access student listings in development/seeding scenarios.
    # IsNotParent ensures parents can't access this admin API.
    permission_classes = [IsAuthenticated, IsTenantUser, IsNotParent]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'admission_number', 'email', 'phone']
    ordering_fields = ['id', 'first_name', 'last_name', 'admission_number', 'admission_date', 'date_of_birth', 'gender', 'created_at']
    ordering = ['admission_number']
    
    def get_queryset(self):
        queryset = Student.objects.filter(tenant=self.request.user.tenant)
        
        # Filter by grade_level ID if provided
        grade_level = self.request.query_params.get('grade_level')
        if grade_level:
            # Get students enrolled in any section of this grade level
            from .models import StudentEnrollment
            student_ids = StudentEnrollment.objects.filter(
                section__grade_level_id=grade_level,
                status='ACTIVE'
            ).values_list('student_id', flat=True)
            queryset = queryset.filter(id__in=student_ids)
        
        # Filter by class_name (grade level name) if provided - used by attendance module
        class_name = self.request.query_params.get('class_name')
        if class_name:
            from .models import StudentEnrollment
            student_ids = StudentEnrollment.objects.filter(
                section__grade_level__name__iexact=class_name,
                status='ACTIVE'
            ).values_list('student_id', flat=True)
            queryset = queryset.filter(id__in=student_ids)
        
        # Filter by section if provided (supports both ID and name)
        section = self.request.query_params.get('section')
        if section:
            from .models import StudentEnrollment
            # Try to filter by ID first, then by name
            try:
                import uuid
                uuid.UUID(section)  # Check if it's a valid UUID
                student_ids = StudentEnrollment.objects.filter(
                    section_id=section,
                    status='ACTIVE'
                ).values_list('student_id', flat=True)
            except (ValueError, AttributeError):
                # Filter by section name instead
                student_ids = StudentEnrollment.objects.filter(
                    section__name__iexact=section,
                    status='ACTIVE'
                ).values_list('student_id', flat=True)
            queryset = queryset.filter(id__in=student_ids)
        
        # Default to active students unless specified otherwise
        is_active = self.request.query_params.get('is_active')
        if is_active is None:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentBasicSerializer
        return StudentDetailSerializer
    
    def perform_create(self, serializer):
        student = serializer.save(tenant=self.request.user.tenant)
        
        # Handle family linking for siblings
        if not student.family_id:
            # Generate a unique family ID if not provided
            import uuid
            student.family_id = f"FAM-{uuid.uuid4().hex[:8].upper()}"
            student.save()
        
        # Create parent login if requested
        create_parent_login = self.request.data.get('create_parent_login', False)
        if create_parent_login:
            parent_info = self._create_parent_login(student)
            # Store parent login info in response
            if hasattr(self, '_parent_login_info'):
                self._parent_login_info.update(parent_info)
            else:
                self._parent_login_info = parent_info
    
    def create(self, request, *args, **kwargs):
        """Override create to include parent login info in response"""
        self._parent_login_info = {}
        response = super().create(request, *args, **kwargs)
        
        # Add parent login info to response
        if self._parent_login_info:
            response.data['parent_logins'] = self._parent_login_info
        
        return response

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to soft-delete the student record instead of
        performing a hard delete which may trigger DB cascade deletes.
        """
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def _create_parent_login(self, student):
        """
        Create parent user accounts for the student.
        Checks if parent accounts already exist based on phone/email.
        Returns dict with parent login information.
        """
        from users.models import User
        from .models import ParentUser
        
        parent_logins = {
            'father': None,
            'mother': None,
            'existing_accounts_linked': False
        }
        
        # Check if parent users already exist for this family
        if student.family_id:
            existing_parents = ParentUser.objects.filter(
                tenant=student.tenant,
                students__family_id=student.family_id
            ).distinct()
            
            if existing_parents.exists():
                # Link to existing parent accounts
                for parent in existing_parents:
                    parent.students.add(student)
                parent_logins['existing_accounts_linked'] = True
                parent_logins['message'] = f'Linked to {existing_parents.count()} existing parent account(s)'
                return parent_logins
        
        # Create father's account if not exists
        if student.father_phone:
            father_user = User.objects.filter(
                tenant=student.tenant,
                phone_number=student.father_phone
            ).first()
            
            if not father_user:
                # Create new user account for father
                import random
                import string
                temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                
                # Determine email
                father_email = student.father_email if student.father_email else f"{student.father_phone}@parent.local"
                
                father_user = User.objects.create_user(
                    tenant=student.tenant,
                    email=father_email,
                    phone_number=student.father_phone,
                    first_name=student.father_name.split()[0] if student.father_name else 'Parent',
                    last_name=' '.join(student.father_name.split()[1:]) if student.father_name and len(student.father_name.split()) > 1 else '',
                    password=temp_password
                )
                
                # Create parent profile with portal access enabled
                parent_profile = ParentUser.objects.create(
                    user=father_user,
                    tenant=student.tenant,
                    relation_type='FATHER',
                    portal_access_enabled=True
                )
                parent_profile.students.add(student)
                
                parent_logins['father'] = {
                    'username': student.father_phone,
                    'password': temp_password,
                    'phone': student.father_phone,
                    'name': student.father_name,
                    'created': True
                }
            else:
                # Link existing father account
                parent_profile = ParentUser.objects.filter(user=father_user).first()
                if parent_profile:
                    parent_profile.students.add(student)
                parent_logins['father'] = {
                    'username': student.father_phone,
                    'phone': student.father_phone,
                    'name': student.father_name,
                    'created': False,
                    'message': 'Linked to existing account'
                }
        
        # Create mother's account if not exists
        if student.mother_phone and student.mother_phone != student.father_phone:
            mother_user = User.objects.filter(
                tenant=student.tenant,
                phone_number=student.mother_phone
            ).first()
            
            if not mother_user:
                import random
                import string
                temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                
                # Determine email
                mother_email = student.mother_email if student.mother_email else f"{student.mother_phone}@parent.local"
                
                mother_user = User.objects.create_user(
                    tenant=student.tenant,
                    email=mother_email,
                    phone_number=student.mother_phone,
                    first_name=student.mother_name.split()[0] if student.mother_name else 'Parent',
                    last_name=' '.join(student.mother_name.split()[1:]) if student.mother_name and len(student.mother_name.split()) > 1 else '',
                    password=temp_password
                )
                
                # Create parent profile with portal access enabled
                parent_profile = ParentUser.objects.create(
                    user=mother_user,
                    tenant=student.tenant,
                    relation_type='MOTHER',
                    portal_access_enabled=True
                )
                parent_profile.students.add(student)
                
                parent_logins['mother'] = {
                    'username': student.mother_phone,
                    'password': temp_password,
                    'phone': student.mother_phone,
                    'name': student.mother_name,
                    'created': True
                }
            else:
                # Link existing mother account
                parent_profile = ParentUser.objects.filter(user=mother_user).first()
                if parent_profile:
                    parent_profile.students.add(student)
                parent_logins['mother'] = {
                    'username': student.mother_phone,
                    'phone': student.mother_phone,
                    'name': student.mother_name,
                    'created': False,
                    'message': 'Linked to existing account'
                }
        
        return parent_logins

    def perform_update(self, serializer):
        """
        Override update to handle parent linking when phone numbers change.
        If father_phone or mother_phone changes, trigger parent account linking/creation.
        """
        instance = self.get_object()
        old_father_phone = instance.father_phone
        old_mother_phone = instance.mother_phone
        
        # Save the updated student
        student = serializer.save()
        
        # Check if phone numbers changed
        phone_changed = (
            (student.father_phone != old_father_phone) or 
            (student.mother_phone != old_mother_phone)
        )
        
        # If parent login creation is requested or phone changed, handle parent accounts
        create_parent_login = self.request.data.get('create_parent_login', False) or phone_changed
        
        if create_parent_login and phone_changed:
            parent_info = self._create_parent_login(student)
            # Store parent login info to include in response
            if hasattr(self, '_parent_login_info'):
                self._parent_login_info.update(parent_info)
            else:
                self._parent_login_info = parent_info
    
    def update(self, request, *args, **kwargs):
        """Override update to include parent login info in response"""
        self._parent_login_info = {}
        response = super().update(request, *args, **kwargs)
        
        # Add parent login info to response if available
        if self._parent_login_info:
            response.data['parent_logins'] = self._parent_login_info
            response.data['message'] = 'Student updated successfully. Parent accounts updated/linked.'
        
        return response
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial update to include parent login info in response"""
        self._parent_login_info = {}
        response = super().partial_update(request, *args, **kwargs)
        
        # Add parent login info to response if available
        if self._parent_login_info:
            response.data['parent_logins'] = self._parent_login_info
            response.data['message'] = 'Student updated successfully. Parent accounts updated/linked.'
        
        return response

    @action(detail=True, methods=['get'])
    def profile_360(self, request, pk=None):
        """
        Get complete 360° profile for a student.

        Returns comprehensive data from all modules.
        """
        student = self.get_object()
        service = Student360Service(student)
        profile_data = service.get_360_profile()

        def _make_absolute(url):
            if not url:
                return None
            if url.startswith('http://') or url.startswith('https://'):
                return url
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url

        if isinstance(profile_data, dict):
            student_block = profile_data.get('student')
            if isinstance(student_block, dict):
                student_block['photo_url'] = _make_absolute(student_block.get('photo_url'))

            siblings = profile_data.get('siblings') or []
            if isinstance(siblings, list):
                for sib in siblings:
                    if isinstance(sib, dict):
                        sib['photo_url'] = _make_absolute(sib.get('photo_url'))

        serializer = Student360Serializer(profile_data)
        return Response(serializer.data)


class ParentCredentialsViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin endpoints to view parent credentials and reset passwords."""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    serializer_class = ParentCredentialsSerializer

    def get_queryset(self):
        return ParentUser.objects.filter(
            tenant=self.request.user.tenant,
            portal_access_enabled=True
        ).select_related('user').prefetch_related('students')

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        parent_profile = self.get_object()
        user = parent_profile.user

        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user.set_password(temp_password)
        user.is_active = True
        user.save(update_fields=['password', 'is_active'])

        return Response({
            'parent_id': str(parent_profile.id),
            'user_email': user.email,
            'user_phone': user.phone_number,
            'user_name': user.get_full_name(),
            'password': temp_password
        })
    
    @action(detail=True, methods=['patch'], url_path='toggle-access')
    def toggle_access(self, request, pk=None):
        """Enable or disable portal access for a parent account."""
        parent_profile = self.get_object()
        
        # Get the new value from request data or toggle current value
        new_value = request.data.get('portal_access_enabled')
        if new_value is None:
            new_value = not parent_profile.portal_access_enabled
        
        parent_profile.portal_access_enabled = new_value
        parent_profile.save(update_fields=['portal_access_enabled', 'updated_at'])
        
        # Also update the user's is_active status
        parent_profile.user.is_active = new_value
        parent_profile.user.save(update_fields=['is_active'])
        
        return Response({
            'parent_id': str(parent_profile.id),
            'portal_access_enabled': parent_profile.portal_access_enabled,
            'user_name': parent_profile.user.get_full_name(),
            'message': f"Portal access {'enabled' if new_value else 'disabled'} for {parent_profile.user.get_full_name()}"
        })

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

        academic_year_id = request.query_params.get('academic_year')
        if academic_year_id:
            remarks = remarks.filter(academic_year_id=academic_year_id)
        else:
            active_year = _get_active_academic_year(request.user.tenant)
            if active_year:
                remarks = remarks.filter(academic_year=active_year)
        
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

        academic_year_id = request.query_params.get('academic_year')
        if academic_year_id:
            documents = documents.filter(academic_year_id=academic_year_id)
        else:
            active_year = _get_active_academic_year(request.user.tenant)
            if active_year:
                documents = documents.filter(academic_year=active_year)
        
        serializer = StudentDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def health_records(self, request, pk=None):
        """Get health records for a student."""
        student = self.get_object()
        records = StudentHealthRecord.objects.filter(student=student).order_by('-date')

        academic_year_id = request.query_params.get('academic_year')
        if academic_year_id:
            records = records.filter(academic_year_id=academic_year_id)
        else:
            active_year = _get_active_academic_year(request.user.tenant)
            if active_year:
                records = records.filter(academic_year=active_year)
        
        serializer = StudentHealthRecordSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsTenantUser, HasModulePermission])
    def history(self, request, pk=None):
        """
        Get complete change history for a student.
        
        Returns all historical records tracked by django-simple-history.
        Only accessible by users with student management permissions.
        """
        from .serializers import StudentHistorySerializer
        
        student = self.get_object()
        
        # Get all historical records for this student, ordered by most recent
        history_records = student.history.all().order_by('-history_date')
        
        # Apply pagination if needed
        limit = request.query_params.get('limit', 50)
        try:
            limit = int(limit)
        except ValueError:
            limit = 50
        
        history_records = history_records[:limit]
        
        serializer = StudentHistorySerializer(history_records, many=True)
        
        return Response({
            'count': student.history.count(),
            'results': serializer.data
        })
    
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
    
    @action(detail=False, methods=['get'])
    def check_siblings(self, request):
        """
        Check if students exist with the same parent phone number.
        Used during student admission to detect siblings.
        """
        phone = request.query_params.get('phone')
        if not phone:
            return Response(
                {'error': 'phone parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search for students with matching parent phone
        from django.db.models import Q
        students = Student.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).filter(
            Q(father_phone=phone) | Q(mother_phone=phone)
        )
        
        serializer = StudentBasicSerializer(students, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='analytics/by-gender')
    def analytics_by_gender(self, request):
        """
        Get student count grouped by gender.
        
        Returns:
            {
                "male": 150,
                "female": 120,
                "other": 5
            }
        """
        from django.db.models import Count
        
        gender_stats = Student.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).values('gender').annotate(count=Count('id')).order_by('gender')
        
        # Convert to dict format
        result = {item['gender']: item['count'] for item in gender_stats}
        
        return Response(result)
    
    @action(detail=False, methods=['get'], url_path='analytics/by-class')
    def analytics_by_class(self, request):
        """
        Get student count grouped by class/grade level.
        
        Returns:
            [
                {"class": "Class 1", "count": 45},
                {"class": "Class 2", "count": 50},
                ...
            ]
        """
        from django.db.models import Count
        
        class_stats = StudentEnrollment.objects.filter(
            student__tenant=request.user.tenant,
            student__is_active=True,
            is_current=True
        ).values(
            class_name=models.F('section__grade_level__name')
        ).annotate(count=Count('student', distinct=True)).order_by('class_name')
        
        return Response(list(class_stats))
    
    @action(detail=False, methods=['get'], url_path='analytics/by-age')
    def analytics_by_age(self, request):
        """
        Get student count grouped by age ranges.
        
        Returns:
            [
                {"age_range": "5-7", "count": 60},
                {"age_range": "8-10", "count": 85},
                {"age_range": "11-13", "count": 90},
                {"age_range": "14-16", "count": 40},
                {"age_range": "17+", "count": 20}
            ]
        """
        from django.db.models import Count, F, Q
        from django.db.models.functions import ExtractYear
        from datetime import date
        
        # Get all active students with their ages
        current_year = date.today().year
        
        students = Student.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).annotate(
            age=current_year - ExtractYear('date_of_birth')
        )
        
        # Group into age ranges
        age_ranges = [
            {'age_range': '5-7', 'count': students.filter(age__gte=5, age__lte=7).count()},
            {'age_range': '8-10', 'count': students.filter(age__gte=8, age__lte=10).count()},
            {'age_range': '11-13', 'count': students.filter(age__gte=11, age__lte=13).count()},
            {'age_range': '14-16', 'count': students.filter(age__gte=14, age__lte=16).count()},
            {'age_range': '17+', 'count': students.filter(age__gte=17).count()},
        ]
        
        return Response(age_ranges)
    
    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """
        Bulk import students from Excel/CSV file.
        
        Query params:
            - dry_run: boolean (default: false)
        
        Request body:
            - file: Excel/CSV file
        
        Returns:
            - If dry_run=true: validation report
            - If dry_run=false: import results
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file_obj = request.FILES['file']
        dry_run = request.query_params.get('dry_run', 'false').lower() == 'true'
        
        service = BulkStudentImportService(
            tenant=request.user.tenant,
            user=request.user
        )
        
        try:
            if dry_run:
                # Validation only
                result = service.dry_run(file_obj)
                return Response(result)
            else:
                # Actual import
                result = service.import_students(file_obj)
                if result['success']:
                    return Response(result, status=status.HTTP_201_CREATED)
                else:
                    return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def download_import_template(self, request):
        """
        Download Excel template for bulk import.
        
        Returns:
            Excel file with headers and sample data
        """
        # Generate template
        template_df = BulkStudentImportService.generate_template()
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            template_df.to_excel(writer, index=False, sheet_name='Students')
            
            # Get workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Students']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        # Return as downloadable file
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="student_import_template.xlsx"'
        
        return response
    
    @action(detail=False, methods=['post'])
    def promote_students(self, request):
        """
        Create or execute student promotion.
        
        POST with action=preview: Preview promotion
        POST with action=execute: Execute promotion
        
        Body:
            - academic_year_from: UUID
            - academic_year_to: UUID
            - section_from: UUID (optional)
            - section_to: UUID (optional)
            - criteria: dict (optional) - {min_attendance_percentage: 75, min_percentage: 40}
            - student_ids: list (optional) - for selective promotion
            - action: 'preview' or 'execute'
        """
        action = request.data.get('action', 'preview')
        service = PromotionService(
            tenant=request.user.tenant,
            user=request.user
        )
        
        if action == 'preview':
            # Check if promotion_id provided (preview existing)
            promotion_id = request.data.get('promotion_id')
            
            if not promotion_id:
                # Create new promotion batch
                promotion = service.create_promotion_batch(
                    academic_year_from_id=request.data.get('academic_year_from'),
                    academic_year_to_id=request.data.get('academic_year_to'),
                    section_from_id=request.data.get('section_from'),
                    section_to_id=request.data.get('section_to'),
                    criteria=request.data.get('criteria', {})
                )
                promotion_id = promotion.id
            
            # Preview promotion
            preview = service.preview_promotion(promotion_id)
            preview['promotion_id'] = str(promotion_id)
            
            return Response(preview)
        
        elif action == 'execute':
            # Execute promotion
            promotion_id = request.data.get('promotion_id')
            if not promotion_id:
                return Response(
                    {'error': 'promotion_id required for execution'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                result = service.execute_promotion(
                    promotion_id=promotion_id,
                    student_ids=request.data.get('student_ids')
                )
                return Response(result, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        else:
            return Response(
                {'error': 'Invalid action. Use "preview" or "execute"'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_promote(self, request):
        """
        Simplified bulk promotion endpoint for the Student Promotions wizard.
        
        Body:
            - student_ids: list of UUIDs
            - target_grade_id: UUID of target grade level
            - target_section_id: UUID of target section (optional)
            - target_academic_year_id: UUID of target academic year
            - action: 'promote', 'graduate', or 'retain'
        """
        from tenants.models import GradeLevel, Section, AcademicYear
        
        student_ids = request.data.get('student_ids', [])
        target_grade_id = request.data.get('target_grade_id')
        target_section_id = request.data.get('target_section_id')
        target_academic_year_id = request.data.get('target_academic_year_id')
        action_type = request.data.get('action', 'promote')
        
        if not student_ids:
            return Response(
                {'error': 'student_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not target_academic_year_id:
            return Response(
                {'error': 'target_academic_year_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_year = AcademicYear.objects.get(
                id=target_academic_year_id,
                tenant=request.user.tenant
            )
        except AcademicYear.DoesNotExist:
            return Response(
                {'error': 'Invalid target academic year'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get target grade and section if provided
        target_grade = None
        target_section = None
        
        if target_grade_id:
            try:
                target_grade = GradeLevel.objects.get(
                    id=target_grade_id,
                    tenant=request.user.tenant
                )
            except GradeLevel.DoesNotExist:
                return Response(
                    {'error': 'Invalid target grade'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if target_section_id:
            try:
                target_section = Section.objects.get(
                    id=target_section_id,
                    tenant=request.user.tenant
                )
            except Section.DoesNotExist:
                pass  # Section is optional
        
        # Get students
        students = Student.objects.filter(
            id__in=student_ids,
            tenant=request.user.tenant
        )
        
        promoted_count = 0
        errors = []
        
        for student in students:
            try:
                if action_type == 'graduate':
                    # Mark as alumni
                    from .models import AlumniProfile
                    if not AlumniProfile.objects.filter(student=student).exists():
                        AlumniProfile.objects.create(
                            student=student,
                            tenant=request.user.tenant,
                            graduation_year=timezone.now().year,
                            notes='Graduated via bulk promotion'
                        )
                        student.status = 'ALUMNI'
                        student.save()
                        promoted_count += 1
                        
                        # Create system remark
                        create_system_remark(
                            student=student,
                            title='Graduated',
                            description=f'Graduated and marked as alumni',
                            category='ACHIEVEMENT'
                        )
                else:
                    # Promote to next grade
                    current_enrollment = student.get_current_enrollment()
                    
                    if current_enrollment:
                        # End current enrollment
                        current_enrollment.is_current = False
                        current_enrollment.end_date = timezone.now().date()
                        current_enrollment.save()
                    
                    # Determine new class name and section from current enrollment or target
                    if current_enrollment:
                        old_class_name = current_enrollment.section.grade_level.name if current_enrollment.section else 'N/A'
                        old_section_name = current_enrollment.section.name if current_enrollment.section else None
                    else:
                        old_class_name = 'N/A'
                        old_section_name = None
                    
                    new_class_name = target_grade.name if target_grade else old_class_name
                    new_section_name = target_section.name if target_section else old_section_name
                    
                    # Create new enrollment
                    new_enrollment_section = target_section
                    if not new_enrollment_section and current_enrollment and target_grade:
                        # Try to find matching section name in new grade
                        new_enrollment_section = Section.objects.filter(
                            tenant=request.user.tenant,
                            grade_level=target_grade,
                            name=current_enrollment.section.name if current_enrollment.section else ''
                        ).first()
                    
                    if new_enrollment_section:
                        StudentEnrollment.objects.create(
                            student=student,
                            tenant=request.user.tenant,
                            academic_year=target_year,
                            section=new_enrollment_section,
                            enrollment_date=timezone.now().date(),
                            is_current=True,
                            status='ACTIVE'
                        )
                    
                    promoted_count += 1
                    
                    # Create system remark
                    create_system_remark(
                        student=student,
                        title='Promoted',
                        description=f'Promoted to {new_class_name} for academic year {target_year.name}',
                        category='ADMINISTRATIVE'
                    )
                    
            except Exception as e:
                errors.append({
                    'student_id': str(student.id),
                    'name': f'{student.first_name} {student.last_name}',
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'promoted_count': promoted_count,
            'total_students': len(student_ids),
            'errors': errors,
            'message': f'Successfully promoted {promoted_count} students'
        })
    
    @action(detail=True, methods=['post'])
    def mark_as_alumni(self, request, pk=None):
        """
        Mark a student as alumni (graduated).
        
        Body:
            - graduation_year: int
            - remarks: str (optional)
        """
        from .models import AlumniProfile
        
        student = self.get_object()
        graduation_year = request.data.get('graduation_year', timezone.now().year)
        
        # Check if already alumni
        if AlumniProfile.objects.filter(student=student, tenant=request.user.tenant).exists():
            return Response(
                {'error': 'Student is already marked as alumni'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark current enrollment as completed
        current_enrollment = student.get_current_enrollment()
        if current_enrollment:
            current_enrollment.status = 'COMPLETED'
            current_enrollment.exit_date = timezone.now().date()
            current_enrollment.exit_reason = f"Graduated - {graduation_year}"
            current_enrollment.save()
        
        # Create alumni profile
        AlumniProfile.objects.create(
            student=student,
            tenant=request.user.tenant,
            graduation_year=graduation_year,
            notes=request.data.get('remarks', '')
        )
        
        # Mark student as inactive
        student.is_active = False
        student.save()
        
        # Create system remark
        create_system_remark(
            student=student,
            title='Student Marked as Alumni',
            description=f"Student graduated in {graduation_year}",
            category='ACHIEVEMENT'
        )
        
        serializer = self.get_serializer(student)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def transfer_student(self, request, pk=None):
        """
        Transfer student to different section or school.
        
        Body:
            - transfer_type: 'SECTION' or 'SCHOOL'
            - section_to: UUID (for SECTION transfer)
            - transfer_reason: str
            - effective_date: date (optional, defaults to today)
        """
        from .models import StudentTransfer
        
        student = self.get_object()
        transfer_type = request.data.get('transfer_type')

        current_enrollment = student.get_current_enrollment()
        transfer_academic_year = current_enrollment.academic_year if current_enrollment else None
        
        if transfer_type not in ['SECTION', 'SCHOOL']:
            return Response(
                {'error': 'transfer_type must be SECTION or SCHOOL'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transfer record
        transfer = StudentTransfer.objects.create(
            tenant=request.user.tenant,
            student=student,
            academic_year=transfer_academic_year,
            transfer_type=transfer_type,
            transfer_reason=request.data.get('transfer_reason', ''),
            effective_date=request.data.get('effective_date', timezone.now().date()),
            requested_by=request.user,
            status='PENDING'
        )
        
        if transfer_type == 'SECTION':
            # Section transfer
            section_to_id = request.data.get('section_to')
            if not section_to_id:
                return Response(
                    {'error': 'section_to required for SECTION transfer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            from tenants.models import Section
            section_to = Section.objects.get(id=section_to_id, tenant=request.user.tenant)
            
            # Get current enrollment
            if current_enrollment:
                transfer.section_from = current_enrollment.section
                transfer.section_to = section_to
                transfer.save()
                
                # Auto-approve and complete section transfer
                transfer.status = 'APPROVED'
                transfer.approved_by = request.user
                transfer.approved_at = timezone.now()
                transfer.save()
                
                # Update enrollment
                current_enrollment.section = section_to
                current_enrollment.save()
                
                transfer.status = 'COMPLETED'
                transfer.completed_at = timezone.now()
                transfer.save()
                
                # Create remark
                create_system_remark(
                    student=student,
                    title='Section Transfer',
                    description=f"Transferred to {section_to.name}",
                    category='ADMINISTRATIVE'
                )
        
        elif transfer_type == 'SCHOOL':
            # School transfer - mark student as transferred
            transfer.status = 'PENDING'
            transfer.save()
            
            # Optionally mark enrollment as transferred
            if request.data.get('complete_now', False):
                # Mark current enrollment as transferred
                current_enrollment = student.get_current_enrollment()
                if current_enrollment:
                    current_enrollment.status = 'TRANSFERRED'
                    current_enrollment.exit_date = timezone.now().date()
                    current_enrollment.exit_reason = request.data.get('transfer_reason', 'School Transfer')
                    current_enrollment.save()
                
                # Mark student as inactive
                student.is_active = False
                student.save()
                
                transfer.status = 'COMPLETED'
                transfer.completed_at = timezone.now()
                transfer.save()
                
                # Create remark
                create_system_remark(
                    student=student,
                    title='School Transfer',
                    description=f"Transferred to another school: {request.data.get('transfer_reason', '')}",
                    category='ADMINISTRATIVE'
                )
        
        return Response({
            'message': 'Transfer initiated successfully',
            'transfer_id': str(transfer.id),
            'status': transfer.status
        })
    
    @action(detail=False, methods=['get'])
    def alumni_list(self, request):
        """
        Get list of alumni students.
        
        Query params:
            - graduation_year: int (optional)
        """
        from .models import AlumniProfile
        
        # Get alumni profiles
        alumni_profiles = AlumniProfile.objects.filter(
            tenant=request.user.tenant
        ).select_related('student')
        
        graduation_year = request.query_params.get('graduation_year')
        if graduation_year:
            alumni_profiles = alumni_profiles.filter(graduation_year=graduation_year)
        
        # Get students
        student_ids = alumni_profiles.values_list('student_id', flat=True)
        queryset = Student.objects.filter(id__in=student_ids)
        
        serializer = StudentBasicSerializer(queryset, many=True)
        return Response(serializer.data)
    
    # ==================== NOTIFICATION ENDPOINTS ====================
    
    @action(detail=True, methods=['post'])
    def send_admission_confirmation(self, request, pk=None):
        """Send admission confirmation notification to parents."""
        student = self.get_object()
        task = tasks.send_admission_confirmation_task.delay(
            student_id=student.id,
            tenant_id=student.tenant.id
        )
        return Response({
            'message': 'Admission confirmation notification queued',
            'task_id': task.id,
            'student_id': student.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def send_fee_reminder(self, request, pk=None):
        """Send fee payment reminder to parents."""
        student = self.get_object()
        amount = request.data.get('amount')
        due_date = request.data.get('due_date')
        invoice_number = request.data.get('invoice_number')
        
        if not amount or not due_date:
            return Response(
                {'error': 'amount and due_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task = tasks.send_fee_reminder_task.delay(
            student_id=student.id,
            tenant_id=student.tenant.id,
            amount=float(amount),
            due_date=due_date,
            invoice_number=invoice_number
        )
        return Response({
            'message': 'Fee reminder notification queued',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def send_absent_alert(self, request, pk=None):
        """Send absent alert to parents."""
        student = self.get_object()
        date = request.data.get('date')
        reason = request.data.get('reason')
        
        if not date:
            return Response(
                {'error': 'date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task = tasks.send_absent_alert_task.delay(
            student_id=student.id,
            tenant_id=student.tenant.id,
            date=date,
            reason=reason
        )
        return Response({
            'message': 'Absent alert notification queued',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def send_exam_result_notification(self, request, pk=None):
        """Send exam result published notification to parents."""
        student = self.get_object()
        exam_name = request.data.get('exam_name')
        percentage = request.data.get('percentage')
        grade = request.data.get('grade')
        
        if not all([exam_name, percentage, grade]):
            return Response(
                {'error': 'exam_name, percentage, and grade are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task = tasks.send_exam_result_published_task.delay(
            student_id=student.id,
            tenant_id=student.tenant.id,
            exam_name=exam_name,
            percentage=float(percentage),
            grade=grade
        )
        return Response({
            'message': 'Exam result notification queued',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=False, methods=['post'])
    def send_bulk_notification(self, request):
        """Send bulk notifications to multiple students."""
        student_ids = request.data.get('student_ids', [])
        sms_message = request.data.get('sms_message')
        email_subject = request.data.get('email_subject')
        email_content = request.data.get('email_content')
        notification_type = request.data.get('notification_type', 'general')
        
        if not student_ids:
            return Response(
                {'error': 'student_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not sms_message and not email_subject:
            return Response(
                {'error': 'At least one of sms_message or email_subject is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task = tasks.send_bulk_notification_task.delay(
            student_ids=student_ids,
            tenant_id=request.user.tenant.id,
            sms_message_template=sms_message or '',
            email_subject_template=email_subject or '',
            email_content_template=email_content or '',
            notification_type=notification_type
        )
        return Response({
            'message': f'Bulk notification queued for {len(student_ids)} students',
            'task_id': task.id,
            'student_count': len(student_ids)
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=['post'])
    def bulk_upload_photos(self, request):
        """
        Bulk upload student photos via ZIP file.
        
        ZIP file should contain images named as: {admission_number}.jpg/png
        
        Returns:
            Success/failure count and details
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No ZIP file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        import zipfile
        import tempfile
        import os
        from django.core.files import File
        from PIL import Image
        
        zip_file = request.FILES['file']
        results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        try:
            # Create temp directory
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract ZIP
                with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Process each file
                for filename in os.listdir(temp_dir):
                    if filename.startswith('.') or filename.startswith('__'):
                        continue
                    
                    file_path = os.path.join(temp_dir, filename)
                    if not os.path.isfile(file_path):
                        continue
                    
                    # Get admission number from filename
                    admission_number = os.path.splitext(filename)[0]
                    
                    try:
                        # Find student
                        student = Student.objects.get(
                            tenant=request.user.tenant,
                            admission_number=admission_number
                        )
                        
                        # Validate image
                        try:
                            img = Image.open(file_path)
                            img.verify()
                        except Exception:
                            results['failed'] += 1
                            results['errors'].append(
                                f"{filename}: Invalid image file"
                            )
                            continue
                        
                        # Save photo
                        with open(file_path, 'rb') as f:
                            student.photo.save(
                                f'{admission_number}.jpg',
                                File(f),
                                save=True
                            )
                        
                        results['success'] += 1
                    
                    except Student.DoesNotExist:
                        results['failed'] += 1
                        results['errors'].append(
                            f"{filename}: Student not found"
                        )
                    except Exception as e:
                        results['failed'] += 1
                        results['errors'].append(
                            f"{filename}: {str(e)}"
                        )
        
        except zipfile.BadZipFile:
            return Response(
                {'error': 'Invalid ZIP file'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(results, status=status.HTTP_200_OK)


class StudentRemarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student remarks (Universal Feed).
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasModulePermission]
    required_permission = ('student_module', 'read')
    
    def get_queryset(self):
        queryset = StudentRemark.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student', 'created_by_staff', 'academic_year').order_by('-created_at')
        
        # Filter by student if provided
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        else:
            active_year = _get_active_academic_year(self.request.user.tenant)
            if active_year:
                queryset = queryset.filter(academic_year=active_year)
        
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
        queryset = StudentDocument.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student', 'academic_year').order_by('-created_at')

        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        else:
            active_year = _get_active_academic_year(self.request.user.tenant)
            if active_year:
                queryset = queryset.filter(academic_year=active_year)

        return queryset
    
    def perform_create(self, serializer):
        student = serializer.validated_data.get('student')
        academic_year = serializer.validated_data.get('academic_year')

        if not academic_year and student:
            enrollment = student.get_current_enrollment()
            if enrollment and enrollment.academic_year:
                academic_year = enrollment.academic_year
            else:
                academic_year = _get_active_academic_year(self.request.user.tenant)

        serializer.save(uploaded_by=self.request.user, academic_year=academic_year)
    
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
        queryset = StudentHealthRecord.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student', 'academic_year').order_by('-date')

        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        else:
            active_year = _get_active_academic_year(self.request.user.tenant)
            if active_year:
                queryset = queryset.filter(academic_year=active_year)

        return queryset
    
    def perform_create(self, serializer):
        student = serializer.validated_data.get('student')
        academic_year = serializer.validated_data.get('academic_year')

        if not academic_year and student:
            enrollment = student.get_current_enrollment()
            if enrollment and enrollment.academic_year:
                academic_year = enrollment.academic_year
            else:
                academic_year = _get_active_academic_year(self.request.user.tenant)

        serializer.save(academic_year=academic_year)



class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student enrollments.
    
    Endpoints:
    - GET /enrollments/ - List enrollments
    - POST /enrollments/ - Create enrollment
    - GET /enrollments/pending/ - Get students without enrollments for current year
    - POST /enrollments/bulk_create/ - Bulk create enrollments
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasModulePermission]
    required_permission = ('student_module', 'read')
    serializer_class = StudentEnrollmentSerializer
    
    def get_queryset(self):
        queryset = StudentEnrollment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'academic_year', 'section', 'section__grade_level')
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        
        # Filter by section
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section_id=section)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by student name or admission number
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(student__first_name__icontains=search) |
                models.Q(student__last_name__icontains=search) |
                models.Q(student__admission_number__icontains=search)
            )
        
        return queryset.order_by('-enrollment_date')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get students without enrollments for the current/specified academic year.
        
        Query params:
            - academic_year: UUID (optional, defaults to active year)
        
        Returns list of students who don't have an enrollment for the academic year.
        """
        from tenants.models import AcademicYear
        
        # Get academic year
        academic_year_id = request.query_params.get('academic_year')
        if academic_year_id:
            academic_year = AcademicYear.objects.get(
                id=academic_year_id, 
                tenant=request.user.tenant
            )
        else:
            academic_year = AcademicYear.objects.filter(
                tenant=request.user.tenant,
                is_active=True
            ).first()
        
        if not academic_year:
            return Response({
                'students': [],
                'message': 'No active academic year found'
            })
        
        # Get all active students
        all_students = Student.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        )
        
        # Get students who already have enrollments for this year
        enrolled_student_ids = StudentEnrollment.objects.filter(
            tenant=request.user.tenant,
            academic_year=academic_year
        ).values_list('student_id', flat=True)
        
        # Filter to get students without enrollments
        pending_students = all_students.exclude(id__in=enrolled_student_ids)
        
        # Serialize basic student info
        students_data = []
        for student in pending_students:
            students_data.append({
                'id': str(student.id),
                'admission_number': student.admission_number,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'full_name': student.get_full_name(),
                'date_of_birth': student.date_of_birth.isoformat() if student.date_of_birth else None,
                'photo': student.photo.url if student.photo else None,
            })
        
        return Response({
            'academic_year': {
                'id': str(academic_year.id),
                'name': academic_year.name
            },
            'pending_count': len(students_data),
            'students': students_data
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create enrollments for multiple students.
        
        Request body:
            - student_ids: list of student UUIDs
            - section: UUID
            - academic_year: UUID
            - enrollment_date: date (optional, defaults to today)
        
        Returns:
            - created: count of successfully created enrollments
            - skipped: count of skipped (already enrolled)
            - errors: list of errors
        """
        student_ids = request.data.get('student_ids', [])
        section_id = request.data.get('section')
        academic_year_id = request.data.get('academic_year')
        enrollment_date = request.data.get('enrollment_date', timezone.now().date())
        
        if not student_ids:
            return Response({
                'error': 'student_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not section_id:
            return Response({
                'error': 'section is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not academic_year_id:
            return Response({
                'error': 'academic_year is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse date if string
        if isinstance(enrollment_date, str):
            from datetime import datetime
            enrollment_date = datetime.strptime(enrollment_date, '%Y-%m-%d').date()
        
        created_count = 0
        skipped_count = 0
        errors = []
        
        for student_id in student_ids:
            try:
                # Check if already enrolled
                existing = StudentEnrollment.objects.filter(
                    tenant=request.user.tenant,
                    student_id=student_id,
                    academic_year_id=academic_year_id
                ).first()
                
                if existing:
                    skipped_count += 1
                    continue
                
                # Create enrollment
                StudentEnrollment.objects.create(
                    tenant=request.user.tenant,
                    student_id=student_id,
                    section_id=section_id,
                    academic_year_id=academic_year_id,
                    enrollment_date=enrollment_date,
                    status='ACTIVE'
                )
                created_count += 1
            
            except Exception as e:
                errors.append({
                    'student_id': str(student_id),
                    'error': str(e)
                })
        
        return Response({
            'created': created_count,
            'skipped': skipped_count,
            'errors': errors,
            'message': f'Successfully enrolled {created_count} students'
        }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK)
