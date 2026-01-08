"""
Staff API Views
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsTenantUser
from .models import (
    Staff, StaffDocument, StaffAttendance, StaffLeave,
    StaffHealthProfile, StaffMedicalHistory, StaffMedicalCheckup,
    StaffVaccination, StaffInjuryReport,
    TrainingProgram, TrainingEnrollment, TrainingFeedback,
    AppraisalCycle, StaffAppraisal, StaffGoal
)
from .serializers import (
    StaffSerializer, StaffListSerializer,
    StaffDocumentSerializer, StaffAttendanceSerializer, StaffLeaveSerializer,
    StaffHealthProfileSerializer, StaffMedicalHistorySerializer, StaffMedicalCheckupSerializer,
    StaffVaccinationSerializer, StaffInjuryReportSerializer,
    TrainingProgramSerializer, TrainingEnrollmentSerializer, TrainingFeedbackSerializer,
    AppraisalCycleSerializer, StaffAppraisalSerializer, StaffGoalSerializer
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
    filterset_fields = ['staff', 'category', 'document_type', 'status']
    
    def get_queryset(self):
        return StaffDocument.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff', 'uploaded_by', 'verified_by')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            uploaded_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a document."""
        document = self.get_object()
        
        from django.utils import timezone
        
        document.status = 'VERIFIED'
        document.verified_by = request.user
        document.verification_date = timezone.now()
        document.verification_notes = request.data.get('notes', '')
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get documents expiring within 30 days."""
        from datetime import date, timedelta
        
        thirty_days_later = date.today() + timedelta(days=30)
        
        queryset = self.get_queryset().filter(
            expiry_date__lte=thirty_days_later,
            expiry_date__gte=date.today(),
            status='VERIFIED'
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


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
    
    @action(detail=False, methods=['post'])
    def import_biometric(self, request):
        """
        Import attendance from biometric device data.
        
        Expected format:
        {
            "records": [
                {
                    "employee_id": "EMP001",
                    "date": "2026-01-04",
                    "punch_in": "09:00:00",
                    "punch_out": "17:30:00",
                    "device_id": "BIO-001"
                }
            ]
        }
        """
        records = request.data.get('records', [])
        
        if not records:
            return Response(
                {'error': 'No records provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime, time
        
        imported_count = 0
        errors = []
        
        for record in records:
            try:
                employee_id = record.get('employee_id')
                date = record.get('date')
                punch_in = record.get('punch_in')
                punch_out = record.get('punch_out')
                device_id = record.get('device_id', '')
                
                # Find staff by employee_id
                try:
                    staff = Staff.objects.get(
                        tenant=request.user.tenant,
                        employee_id=employee_id
                    )
                except Staff.DoesNotExist:
                    errors.append(f"Staff with employee_id {employee_id} not found")
                    continue
                
                # Parse times
                punch_in_time = datetime.strptime(punch_in, '%H:%M:%S').time() if punch_in else None
                punch_out_time = datetime.strptime(punch_out, '%H:%M:%S').time() if punch_out else None
                
                # Determine status
                attendance_status = 'PRESENT'
                is_late = False
                
                if punch_in_time:
                    # Check if late (assuming 9:30 AM as standard time)
                    standard_time = time(9, 30)
                    if punch_in_time > standard_time:
                        is_late = True
                        attendance_status = 'LATE'
                
                # Calculate overtime
                overtime_hours = 0
                if punch_in_time and punch_out_time:
                    work_hours = (datetime.combine(datetime.today(), punch_out_time) - 
                                datetime.combine(datetime.today(), punch_in_time)).total_seconds() / 3600
                    if work_hours > 8:  # Assuming 8 hours is standard
                        overtime_hours = work_hours - 8
                
                # Create or update attendance
                StaffAttendance.objects.update_or_create(
                    tenant=request.user.tenant,
                    staff=staff,
                    date=date,
                    defaults={
                        'status': attendance_status,
                        'biometric_punch_in': punch_in_time,
                        'biometric_punch_out': punch_out_time,
                        'biometric_device_id': device_id,
                        'check_in_time': punch_in_time,
                        'check_out_time': punch_out_time,
                        'is_late': is_late,
                        'overtime_hours': overtime_hours,
                        'marked_by': request.user
                    }
                )
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Error processing record: {str(e)}")
        
        response_data = {
            'message': f'Imported {imported_count} attendance records',
            'imported_count': imported_count,
            'total_records': len(records)
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data)



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


class StaffHealthProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Health Profiles."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffHealthProfileSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['staff']
    
    def get_queryset(self):
        return StaffHealthProfile.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class StaffMedicalHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Medical History."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffMedicalHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff']
    ordering = ['-date']
    
    def get_queryset(self):
        return StaffMedicalHistory.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class StaffMedicalCheckupViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Medical Checkups."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffMedicalCheckupSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'checkup_type', 'fit_status']
    ordering = ['-checkup_date']
    
    def get_queryset(self):
        return StaffMedicalCheckup.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class StaffVaccinationViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Vaccinations."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffVaccinationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff']
    ordering = ['-date_administered']
    
    def get_queryset(self):
        return StaffVaccination.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class StaffInjuryReportViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Injury Reports."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffInjuryReportSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'severity']
    ordering = ['-date', '-time']
    
    def get_queryset(self):
        return StaffInjuryReport.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TrainingProgramViewSet(viewsets.ModelViewSet):
    """ViewSet for Training Programs."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = TrainingProgramSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'mode', 'status', 'is_mandatory']
    search_fields = ['program_name', 'trainer_name']
    ordering = ['-start_date']
    
    def get_queryset(self):
        return TrainingProgram.objects.filter(
            tenant=self.request.user.tenant
        )
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Enroll staff in training program."""
        program = self.get_object()
        staff_ids = request.data.get('staff_ids', [])
        
        enrolled = []
        for staff_id in staff_ids:
            enrollment, created = TrainingEnrollment.objects.get_or_create(
                tenant=request.user.tenant,
                training_program=program,
                staff_id=staff_id,
                defaults={'status': 'ENROLLED'}
            )
            if created:
                enrolled.append(enrollment)
        
        return Response({
            'message': f'Enrolled {len(enrolled)} staff members',
            'count': len(enrolled)
        })
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """Get enrollments for this training."""
        program = self.get_object()
        enrollments = program.enrollments.all()
        serializer = TrainingEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)


class TrainingEnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Training Enrollments."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = TrainingEnrollmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['training_program', 'staff', 'status', 'certificate_issued']
    
    def get_queryset(self):
        return TrainingEnrollment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('training_program', 'staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def issue_certificate(self, request, pk=None):
        """Issue certificate for training completion."""
        enrollment = self.get_object()
        enrollment.certificate_issued = True
        enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)


class TrainingFeedbackViewSet(viewsets.ModelViewSet):
    """ViewSet for Training Feedback."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = TrainingFeedbackSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['enrollment__training_program', 'enrollment__staff']
    
    def get_queryset(self):
        return TrainingFeedback.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('enrollment__training_program', 'enrollment__staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class AppraisalCycleViewSet(viewsets.ModelViewSet):
    """ViewSet for Appraisal Cycles."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AppraisalCycleSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering = ['-start_date']
    
    def get_queryset(self):
        return AppraisalCycle.objects.filter(
            tenant=self.request.user.tenant
        )
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class StaffAppraisalViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Appraisals."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffAppraisalSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['appraisal_cycle', 'staff', 'manager', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return StaffAppraisal.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('appraisal_cycle', 'staff', 'manager')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def submit_self(self, request, pk=None):
        """Submit self appraisal."""
        appraisal = self.get_object()
        
        appraisal.self_ratings = request.data.get('self_ratings', {})
        appraisal.self_achievements = request.data.get('self_achievements', '')
        appraisal.self_goals = request.data.get('self_goals', '')
        appraisal.training_needs = request.data.get('training_needs', '')
        appraisal.self_comments = request.data.get('self_comments', '')
        appraisal.status = 'SELF_COMPLETED'
        appraisal.save()
        
        serializer = self.get_serializer(appraisal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_manager(self, request, pk=None):
        """Submit manager appraisal."""
        appraisal = self.get_object()
        
        appraisal.manager_ratings = request.data.get('manager_ratings', {})
        appraisal.strengths = request.data.get('strengths', '')
        appraisal.areas_of_improvement = request.data.get('areas_of_improvement', '')
        appraisal.recommendations = request.data.get('recommendations', '')
        appraisal.promotion_suggested = request.data.get('promotion_suggested', False)
        appraisal.increment_suggested = request.data.get('increment_suggested', False)
        appraisal.manager_comments = request.data.get('manager_comments', '')
        appraisal.final_rating = request.data.get('final_rating')
        appraisal.status = 'MANAGER_REVIEW'
        appraisal.save()
        
        serializer = self.get_serializer(appraisal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete appraisal."""
        appraisal = self.get_object()
        
        appraisal.meeting_date = request.data.get('meeting_date')
        appraisal.action_points = request.data.get('action_points', '')
        appraisal.status = 'COMPLETED'
        appraisal.save()
        
        serializer = self.get_serializer(appraisal)
        return Response(serializer.data)


class StaffGoalViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Goals."""
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = StaffGoalSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'status', 'appraisal']
    ordering = ['target_date']
    
    def get_queryset(self):
        return StaffGoal.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('staff', 'appraisal')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update goal progress."""
        goal = self.get_object()
        
        goal.progress_percentage = request.data.get('progress_percentage', goal.progress_percentage)
        goal.status = request.data.get('status', goal.status)
        goal.achievement_notes = request.data.get('achievement_notes', goal.achievement_notes)
        
        if request.data.get('status') == 'COMPLETED' and not goal.completion_date:
            from datetime import date
            goal.completion_date = date.today()
        
        goal.save()
        
        serializer = self.get_serializer(goal)
        return Response(serializer.data)
