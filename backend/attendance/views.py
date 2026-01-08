"""
Attendance API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import date, datetime
import uuid
import json
import base64
from PIL import Image
from io import BytesIO
import logging

from core.permissions import IsTenantUser, IsTenantAdmin
from .models import (
    AttendanceRecord, AttendanceConfiguration, 
    AttendanceMonthlyAggregate, QRCodeToken, StudentFaceEncoding
)
from .serializers import (
    AttendanceRecordSerializer,
    AttendanceConfigurationSerializer,
    AttendanceMonthlyAggregateSerializer,
    QRCodeTokenSerializer,
    StudentFaceEncodingSerializer,
    FaceEnrollmentInputSerializer,
    StudentFaceEnrollmentStatusSerializer
)
from .services import AttendanceCalculationService
from . import face_recognition_utils

logger = logging.getLogger(__name__)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance Records."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AttendanceRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['record_type', 'student', 'staff', 'date', 'status', 'method']
    
    def get_queryset(self):
        queryset = AttendanceRecord.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('student', 'staff', 'academic_year', 'student__enrollments')
        
        # Additional filtering by class and section
        class_name = self.request.query_params.get('class_name')
        section = self.request.query_params.get('section')
        
        if class_name:
            # Filter by student's current enrollment class
            from students.models import StudentEnrollment
            student_ids = StudentEnrollment.objects.filter(
                tenant=self.request.user.tenant,
                status='ACTIVE',
                section__grade_level__name=class_name
            ).values_list('student_id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        if section:
            # Filter by student's current enrollment section
            from students.models import StudentEnrollment
            student_ids = StudentEnrollment.objects.filter(
                tenant=self.request.user.tenant,
                status='ACTIVE',
                section__name=section
            ).values_list('student_id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        return queryset
    
    def perform_create(self, serializer):
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=self.request.user.tenant,
            is_active=True
        ).first()
        
        serializer.save(
            tenant=self.request.user.tenant,
            marked_by=self.request.user,
            academic_year=academic_year
        )
    
    @action(detail=False, methods=['post'])
    def mark_bulk(self, request):
        """Mark attendance for multiple students/staff."""
        date_val = request.data.get('date')
        attendance_data = request.data.get('attendance', [])
        
        if not date_val or not attendance_data:
            return Response(
                {'error': 'Date and attendance data required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).first()
        
        if not academic_year:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        for item in attendance_data:
            record_type = item.get('record_type')
            entity_id = item.get('entity_id')
            attendance_status = item.get('status')
            
            if record_type and entity_id and attendance_status:
                if record_type == 'STUDENT':
                    AttendanceRecord.objects.update_or_create(
                        tenant=request.user.tenant,
                        student_id=entity_id,
                        date=date_val,
                        defaults={
                            'status': attendance_status,
                            'method': 'MANUAL',
                            'record_type': 'STUDENT',
                            'academic_year': academic_year,
                            'marked_by': request.user
                        }
                    )
                else:
                    AttendanceRecord.objects.update_or_create(
                        tenant=request.user.tenant,
                        staff_id=entity_id,
                        date=date_val,
                        defaults={
                            'status': attendance_status,
                            'method': 'MANUAL',
                            'record_type': 'STAFF',
                            'academic_year': academic_year,
                            'marked_by': request.user
                        }
                    )
                created_count += 1
        
        return Response({
            'message': f'Marked attendance for {created_count} records',
            'count': created_count
        })
    
    @action(detail=False, methods=['post'])
    def qr_scan(self, request):
        """Mark attendance via QR code scan."""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate token
        qr_token = QRCodeToken.objects.filter(
            token=token,
            is_active=True,
            valid_date=date.today()
        ).first()
        
        if not qr_token:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark attendance
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=qr_token.tenant,
            is_active=True
        ).first()
        
        if qr_token.student:
            record, created = AttendanceRecord.objects.get_or_create(
                tenant=qr_token.tenant,
                student=qr_token.student,
                date=date.today(),
                defaults={
                    'status': 'PRESENT',
                    'method': 'QR_CODE',
                    'record_type': 'STUDENT',
                    'academic_year': academic_year,
                    'check_in_time': timezone.now().time()
                }
            )
        elif qr_token.teacher:
            record, created = AttendanceRecord.objects.get_or_create(
                tenant=qr_token.tenant,
                staff=qr_token.teacher,
                date=date.today(),
                defaults={
                    'status': 'PRESENT',
                    'method': 'QR_CODE',
                    'record_type': 'STAFF',
                    'academic_year': academic_year,
                    'check_in_time': timezone.now().time()
                }
            )
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def scan_idcard(self, request):
        """
        Mark attendance via ID card QR code scan.
        The QR code on the ID card contains the student's admission number.
        
        POST /api/attendance/records/scan_idcard/
        {
            "admission_number": "ADM2024001",
            "location": "Main Gate"  // optional
        }
        """
        admission_number = request.data.get('admission_number')
        location = request.data.get('location', '')
        
        if not admission_number:
            return Response(
                {'error': 'Admission number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find student by admission number
        from students.models import Student
        try:
            student = Student.objects.get(
                tenant=request.user.tenant,
                admission_number=admission_number,
                is_active=True
            )
        except Student.DoesNotExist:
            return Response(
                {'error': f'Student with admission number {admission_number} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get academic year
        from tenants.models import AcademicYear
        academic_year = AcademicYear.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).first()
        
        if not academic_year:
            return Response(
                {'error': 'No active academic year found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine status based on time
        check_in_time = timezone.now().time()
        attendance_status = self._determine_status(check_in_time)
        
        # Mark attendance (create or update for today)
        record, created = AttendanceRecord.objects.update_or_create(
            tenant=request.user.tenant,
            student=student,
            date=date.today(),
            defaults={
                'status': attendance_status,
                'method': 'QR_CODE',
                'record_type': 'STUDENT',
                'academic_year': academic_year,
                'check_in_time': check_in_time,
                'marked_by': request.user,
                'notes': f'ID Card scan at {location}' if location else 'ID Card QR scan'
            }
        )
        
        # Get student's current enrollment info
        enrollment = student.get_current_enrollment()
        class_name = None
        section_name = None
        if enrollment and enrollment.section:
            section_name = enrollment.section.name
            if enrollment.section.grade_level:
                class_name = enrollment.section.grade_level.name
        
        return Response({
            'success': True,
            'attendance': {
                'id': str(record.id),
                'date': str(record.date),
                'status': record.status,
                'check_in_time': check_in_time.strftime('%H:%M:%S'),
                'created': created
            },
            'student': {
                'id': str(student.id),
                'admission_number': student.admission_number,
                'full_name': student.get_full_name(),
                'class': class_name,
                'section': section_name,
                'photo': student.photo.url if student.photo else None
            },
            'message': f'Attendance marked as {attendance_status} for {student.get_full_name()}'
        })
    
    @action(detail=False, methods=['post'])
    def mobile_capture(self, request):
        """
        Handle mobile attendance capture via QR code or Face Recognition.
        Accepts image data and method type.
        """
        method = request.data.get('method')  # 'QR_CODE' or 'FACE'
        
        # Check if image is provided as file or base64
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            image_data = image_file.read()
        elif 'image_data' in request.data:
            # Handle base64 encoded image
            image_data_base64 = request.data.get('image_data')
            if ',' in image_data_base64:
                image_data_base64 = image_data_base64.split(',')[1]
            image_data = base64.b64decode(image_data_base64)
        else:
            return Response(
                {'error': 'Image data required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Open image
            image = Image.open(BytesIO(image_data))
            
            if method == 'QR_CODE':
                # Decode QR code from image
                token = self._decode_qr_from_image(image)
                if not token:
                    return Response(
                        {'error': 'No QR code found in image'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Use existing qr_scan logic
                request.data._mutable = True
                request.data['token'] = token
                request.data._mutable = False
                return self.qr_scan(request)
            
            elif method == 'FACE':
                # Face recognition
                student = self._recognize_face(image, request.user.tenant)
                if not student:
                    return Response(
                        {'error': 'Face not recognized. Please try again or contact admin.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get academic year
                from tenants.models import AcademicYear
                academic_year = AcademicYear.objects.filter(
                    tenant=request.user.tenant,
                    is_active=True
                ).first()
                
                # Determine late status
                check_in_time = timezone.now().time()
                attendance_status = self._determine_status(check_in_time)
                
                # Mark attendance
                record, created = AttendanceRecord.objects.get_or_create(
                    tenant=request.user.tenant,
                    student=student,
                    date=date.today(),
                    defaults={
                        'status': attendance_status,
                        'method': 'FACE',
                        'record_type': 'STUDENT',
                        'academic_year': academic_year,
                        'check_in_time': check_in_time,
                        'marked_by': request.user
                    }
                )
                
                if not created:
                    # Update if already exists
                    record.check_in_time = check_in_time
                    record.status = attendance_status
                    record.save()
                
                from students.serializers import StudentSerializer
                return Response({
                    'success': True,
                    'message': 'Attendance marked successfully!',
                    'student': {
                        'id': str(student.id),
                        'full_name': student.get_full_name(),
                        'admission_number': student.admission_number,
                        'class_name': student.current_class.name if student.current_class else 'N/A',
                        'section': student.current_section.name if student.current_section else 'N/A',
                        'photo_url': student.photo.url if student.photo else None
                    },
                    'status': attendance_status,
                    'check_in_time': check_in_time.strftime('%H:%M:%S')
                })
            
            else:
                return Response(
                    {'error': 'Invalid method. Use QR_CODE or FACE'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error processing image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _decode_qr_from_image(self, image):
        """Decode QR code from PIL Image."""
        try:
            from pyzbar.pyzbar import decode
            decoded_objects = decode(image)
            if decoded_objects:
                return decoded_objects[0].data.decode('utf-8')
            return None
        except ImportError:
            # Fallback if pyzbar not installed
            return None
        except Exception:
            return None
    
    def _recognize_face(self, image, tenant):
        """
        Recognize face from PIL Image and return matching student.
        Uses the face_recognition library to compare with enrolled faces.
        """
        if not face_recognition_utils.is_face_recognition_available():
            logger.warning("Face recognition library not available")
            return None
        
        try:
            # Extract face encoding from the captured image
            encoding, error = face_recognition_utils.extract_face_encoding(image)
            
            if error:
                logger.warning(f"Face extraction error: {error}")
                return None
            
            # Find matching student
            student, confidence = face_recognition_utils.find_matching_student(
                encoding, tenant, tolerance=0.6
            )
            
            if student:
                logger.info(f"Face matched to student {student.id} with confidence {confidence:.2f}")
                return student
            
            logger.info("No matching face found")
            return None
            
        except Exception as e:
            logger.error(f"Error in face recognition: {str(e)}")
            return None
    
    def _determine_status(self, check_in_time):
        """Determine attendance status based on check-in time."""
        # Get late threshold from configuration or use default
        try:
            config = AttendanceConfiguration.objects.filter(
                tenant=self.request.user.tenant
            ).first()
            
            if config and hasattr(config, 'late_threshold_time') and config.late_threshold_time:
                late_threshold = config.late_threshold_time
            else:
                # Default late threshold: 9:30 AM
                late_threshold = datetime.strptime('09:30', '%H:%M').time()
        except Exception:
            late_threshold = datetime.strptime('09:30', '%H:%M').time()
        
        if check_in_time > late_threshold:
            return 'LATE'
        return 'PRESENT'


class AttendanceConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance Configuration."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AttendanceConfigurationSerializer
    
    def get_queryset(self):
        return AttendanceConfiguration.objects.filter(tenant=self.request.user.tenant)


class AttendanceMonthlyAggregateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Monthly Aggregates."""
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = AttendanceMonthlyAggregateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['record_type', 'student', 'staff', 'month']
    
    def get_queryset(self):
        return AttendanceMonthlyAggregate.objects.filter(tenant=self.request.user.tenant)


class FaceEnrollmentViewSet(viewsets.ViewSet):
    """
    ViewSet for managing student face enrollments.
    Only accessible by tenant admins.
    """
    
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def list(self, request):
        """
        List all students with their face enrollment status.
        Supports filtering by class_name and section.
        """
        from students.models import Student, StudentEnrollment
        
        # Get filter parameters
        class_name = request.query_params.get('class_name')
        section = request.query_params.get('section')
        enrolled_only = request.query_params.get('enrolled_only', 'false').lower() == 'true'
        not_enrolled_only = request.query_params.get('not_enrolled_only', 'false').lower() == 'true'
        
        # Base queryset
        students = Student.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).select_related('face_encoding').prefetch_related('enrollments')
        
        # Filter by class/section
        if class_name or section:
            enrollment_filter = {
                'tenant': request.user.tenant,
                'status': 'ACTIVE'
            }
            if class_name:
                enrollment_filter['section__grade_level__name'] = class_name
            if section:
                enrollment_filter['section__name'] = section
            
            student_ids = StudentEnrollment.objects.filter(
                **enrollment_filter
            ).values_list('student_id', flat=True)
            students = students.filter(id__in=student_ids)
        
        # Build response data
        result = []
        for student in students:
            # Get current enrollment for class/section info
            enrollment = student.enrollments.filter(status='ACTIVE').first()
            class_name_val = None
            section_name_val = None
            if enrollment and enrollment.section:
                section_name_val = enrollment.section.name
                if enrollment.section.grade_level:
                    class_name_val = enrollment.section.grade_level.name
            
            # Check face encoding
            has_face = hasattr(student, 'face_encoding') and student.face_encoding is not None
            face_encoding_date = None
            if has_face:
                face_encoding_date = student.face_encoding.encoded_at
            
            # Apply enrollment filters
            if enrolled_only and not has_face:
                continue
            if not_enrolled_only and has_face:
                continue
            
            result.append({
                'id': str(student.id),
                'admission_number': student.admission_number,
                'full_name': student.get_full_name(),
                'photo': student.photo.url if student.photo else None,
                'class_name': class_name_val,
                'section_name': section_name_val,
                'has_face_encoding': has_face,
                'face_encoding_date': face_encoding_date
            })
        
        return Response({
            'count': len(result),
            'results': result
        })
    
    @action(detail=False, methods=['post'])
    def enroll(self, request):
        """
        Enroll a student's face for recognition.
        Accepts student_id and image (base64 or file upload).
        """
        from students.models import Student
        
        student_id = request.data.get('student_id')
        if not student_id:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get student
        try:
            student = Student.objects.get(
                id=student_id,
                tenant=request.user.tenant,
                is_active=True
            )
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get image
        image = None
        image_file = None
        
        if 'image_file' in request.FILES:
            image_file = request.FILES['image_file']
            image_data = image_file.read()
            image = Image.open(BytesIO(image_data))
        elif 'image' in request.data:
            image = face_recognition_utils.image_from_base64(request.data['image'])
        else:
            return Response(
                {'error': 'Image data required (image or image_file)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not image:
            return Response(
                {'error': 'Could not process image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if face recognition is available
        if not face_recognition_utils.is_face_recognition_available():
            return Response(
                {'error': 'Face recognition library is not installed on the server'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Extract face encoding
        encoding, error = face_recognition_utils.extract_face_encoding(image)
        
        if error:
            return Response(
                {'error': error},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save or update face encoding
        face_encoding, created = StudentFaceEncoding.objects.update_or_create(
            student=student,
            defaults={
                'encoding_data': encoding,
                'encoded_by': request.user,
                'confidence_score': 1.0,
                'is_active': True
            }
        )
        
        # Save reference image
        if image_file:
            face_encoding.reference_image = image_file
        else:
            # Save base64 image as file
            from django.core.files.base import ContentFile
            import io
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            face_encoding.reference_image.save(
                f"{student.admission_number}_face.jpg",
                ContentFile(buffer.getvalue()),
                save=False
            )
        face_encoding.save()
        
        return Response({
            'success': True,
            'message': 'Face enrolled successfully' if created else 'Face encoding updated',
            'student': {
                'id': str(student.id),
                'name': student.get_full_name(),
                'admission_number': student.admission_number
            },
            'enrollment': {
                'id': str(face_encoding.id),
                'encoded_at': face_encoding.encoded_at,
                'reference_image': face_encoding.reference_image.url if face_encoding.reference_image else None
            }
        })
    
    @action(detail=False, methods=['delete'], url_path='delete/(?P<student_id>[^/.]+)')
    def delete_enrollment(self, request, student_id=None):
        """
        Delete a student's face enrollment.
        """
        try:
            face_encoding = StudentFaceEncoding.objects.get(
                student_id=student_id,
                student__tenant=request.user.tenant
            )
            face_encoding.delete()
            return Response({'success': True, 'message': 'Face enrollment deleted'})
        except StudentFaceEncoding.DoesNotExist:
            return Response(
                {'error': 'Face enrollment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Get face recognition system status.
        """
        from students.models import Student
        
        total_students = Student.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).count()
        
        enrolled_count = StudentFaceEncoding.objects.filter(
            student__tenant=request.user.tenant,
            is_active=True
        ).count()
        
        return Response({
            'face_recognition_available': face_recognition_utils.is_face_recognition_available(),
            'total_students': total_students,
            'enrolled_count': enrolled_count,
            'not_enrolled_count': total_students - enrolled_count,
            'enrollment_percentage': round((enrolled_count / total_students * 100), 1) if total_students > 0 else 0
        })
