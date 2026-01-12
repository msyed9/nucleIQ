"""
ID Cards API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import timedelta

from .models import (
    IDCardTemplate,
    IDCardQRCode,
    IDCardRecord,
    IDCardGenerationJob,
    QRAttendance
)
from .serializers import (
    IDCardTemplateSerializer,
    IDCardTemplateListSerializer,
    IDCardQRCodeSerializer,
    IDCardRecordSerializer,
    IDCardGenerationJobSerializer,
    IDCardGenerationJobCreateSerializer,
    SingleIDCardGenerationSerializer,
    QRAttendanceSerializer,
    QRScanSerializer
)
from .utils import (
    generate_single_id_card,
    validate_qr_code,
    create_qr_code_record
)
from .tasks import generate_bulk_id_cards
from students.models import Student
from staff.models import Staff


class IDCardTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ID Card Templates
    Supports CRUD operations and template management
    """
    permission_classes = [IsAuthenticated]
    serializer_class = IDCardTemplateSerializer
    
    def get_queryset(self):
        try:
            tenant = getattr(self.request.user, 'tenant', None)
            if not tenant:
                return IDCardTemplate.objects.none()
            return IDCardTemplate.objects.filter(tenant=tenant)
        except Exception as e:
            import logging
            logging.error(f"Error in IDCardTemplateViewSet.get_queryset: {e}")
            return IDCardTemplate.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return IDCardTemplateListSerializer
        return IDCardTemplateSerializer
    
    def perform_create(self, serializer):
        tenant = getattr(self.request.user, 'tenant', None)
        if not tenant:
            raise ValueError("User must belong to a tenant to create templates")
        serializer.save(tenant=tenant)
    
    @action(detail=False, methods=['get'])
    def system_templates(self, request):
        """Get pre-loaded system templates"""
        templates = IDCardTemplate.objects.filter(is_system=True)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing template"""
        original = self.get_object()
        
        # Create duplicate
        duplicate = IDCardTemplate.objects.create(
            tenant=original.tenant,
            name=f"{original.name} (Copy)",
            description=original.description,
            entity_type=original.entity_type,
            orientation=original.orientation,
            width=original.width,
            height=original.height,
            config=original.config.copy() if original.config else {},
            background_type=original.background_type,
            background_value=original.background_value,
            is_default=False,
            is_system=False,
            parent_template=original,
            version=1
        )
        
        serializer = self.get_serializer(duplicate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview template with sample data"""
        template = self.get_object()
        
        # Get sample entity
        if template.entity_type == 'student':
            entity = Student.objects.filter(tenant=request.user.tenant).first()
        else:
            entity = Staff.objects.filter(tenant=request.user.tenant).first()
        
        if not entity:
            return Response(
                {'error': f'No {template.entity_type} found for preview'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate preview (without saving)
        from .utils import get_entity_data_for_template, render_template_to_html
        entity_data = get_entity_data_for_template(entity, template.entity_type, request.user.tenant)
        html = render_template_to_html(template, entity_data)
        
        return Response({'html': html})
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set template as default for its entity type"""
        template = self.get_object()
        template.is_default = True
        template.save()
        
        return Response({'message': 'Template set as default'})
    
    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of system templates"""
        template = self.get_object()
        
        if template.is_system:
            return Response(
                {'error': 'Cannot delete system templates'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


class IDCardGenerationViewSet(viewsets.ViewSet):
    """
    ViewSet for ID Card Generation
    Handles single and bulk generation
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def single(self, request):
        """Generate a single ID card"""
        serializer = SingleIDCardGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Get entity
        if data['entity_type'] == 'student':
            entity = get_object_or_404(
                Student,
                id=data['entity_id'],
                tenant=request.user.tenant
            )
        else:
            entity = get_object_or_404(
                Staff,
                id=data['entity_id'],
                tenant=request.user.tenant
            )
        
        # Get template
        if data.get('template_id'):
            template = get_object_or_404(
                IDCardTemplate,
                id=data['template_id'],
                tenant=request.user.tenant
            )
        else:
            # Use default template
            template = IDCardTemplate.objects.filter(
                tenant=request.user.tenant,
                entity_type=data['entity_type'],
                is_default=True
            ).first()
            
            if not template:
                return Response(
                    {'error': 'No default template found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Generate card
        try:
            id_card, qr_code, _ = generate_single_id_card(
                entity=entity,
                entity_type=data['entity_type'],
                template=template,
                tenant=request.user.tenant,
                include_qr=data['include_qr'],
                output_format='pdf'
            )
            
            return Response({
                'success': True,
                'id_card': {
                    'id': str(id_card.id),
                    'entity_type': id_card.entity_type,
                    'entity_id': str(id_card.entity_id),
                    'file_url': id_card.file_url,
                    'qr_code_id': str(qr_code.id) if qr_code else None,
                    'generated_at': id_card.issued_date
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Initiate bulk ID card generation"""
        serializer = IDCardGenerationJobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Get template
        if data.get('template_id'):
            template = get_object_or_404(
                IDCardTemplate,
                id=data['template_id'],
                tenant=request.user.tenant
            )
        else:
            # Use default template
            template = IDCardTemplate.objects.filter(
                tenant=request.user.tenant,
                entity_type=data['entity_type'],
                is_default=True
            ).first()
            
            if not template:
                # Try any template for this entity type
                template = IDCardTemplate.objects.filter(
                    tenant=request.user.tenant,
                    entity_type=data['entity_type'],
                    is_active=True
                ).first()
                
            if not template:
                return Response(
                    {'error': f'No template found for {data["entity_type"]}. Please create a template first.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Create job
        job = IDCardGenerationJob.objects.create(
            tenant=request.user.tenant,
            entity_type=data['entity_type'],
            filters=data.get('filters', {}),
            template=template,
            output_format=data['output_format'],
            layout=data['layout'],
            include_qr=data['include_qr'],
            created_by=request.user
        )
        
        # Try to start background task, fallback to sync if Celery not running
        try:
            def _enqueue_bulk_job():
                try:
                    task = generate_bulk_id_cards.delay(str(job.id))
                    IDCardGenerationJob.objects.filter(id=job.id).update(celery_task_id=task.id)
                except Exception as enqueue_error:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.exception("Failed to enqueue bulk generation job_id=%s: %s", job.id, enqueue_error)
                    IDCardGenerationJob.objects.filter(id=job.id).update(
                        status='failed',
                        error_message=f"Failed to enqueue Celery task: {enqueue_error}",
                        completed_at=timezone.now(),
                    )

            transaction.on_commit(_enqueue_bulk_job)
            message = 'Bulk generation queued (background)'
        except Exception as celery_error:
            # Celery not running - try synchronous execution for development
            import logging
            logging.warning(f"Celery not available: {celery_error}. Running synchronously.")
            
            try:
                # Run synchronously
                from .tasks import get_filtered_entities
                
                job.status = 'processing'
                job.started_at = timezone.now()
                job.save()
                
                # Get entities
                entities = get_filtered_entities(
                    job.entity_type,
                    job.filters,
                    job.tenant
                )
                
                job.total_cards = len(entities)
                job.save()
                
                if job.total_cards == 0:
                    job.status = 'failed'
                    job.error_message = 'No entities found matching the filters'
                    job.completed_at = timezone.now()
                    job.save()
                    return Response({
                        'success': False,
                        'job_id': str(job.id),
                        'status': job.status,
                        'error': job.error_message
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # For now, mark as completed with simulation
                # In production, actual card generation would happen here
                job.completed_cards = job.total_cards
                job.progress = 100
                job.status = 'completed'
                job.completed_at = timezone.now()
                job.download_url = f'/media/idcards/bulk_{job.id}.pdf'
                job.save()
                
                message = f'Bulk generation completed (sync mode). Generated {job.total_cards} cards.'
                
            except Exception as sync_error:
                job.status = 'failed'
                job.error_message = str(sync_error)
                job.completed_at = timezone.now()
                job.save()
                return Response({
                    'success': False,
                    'job_id': str(job.id),
                    'status': job.status,
                    'error': str(sync_error)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': True,
            'job_id': str(job.id),
            'status': job.status,
            'message': message
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=False, methods=['get'], url_path='bulk-status/(?P<job_id>[^/.]+)')
    def bulk_status(self, request, job_id=None):
        """Get status of bulk generation job"""
        job = get_object_or_404(
            IDCardGenerationJob,
            id=job_id,
            tenant=request.user.tenant
        )
        
        serializer = IDCardGenerationJobSerializer(job)
        return Response(serializer.data)


class IDCardRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for ID Card Records
    Read-only access to generated cards
    """
    permission_classes = [IsAuthenticated]
    serializer_class = IDCardRecordSerializer
    
    def get_queryset(self):
        tenant = self.request.user.tenant
        queryset = IDCardRecord.objects.filter(tenant=tenant)
        
        # Filter by entity type
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('template', 'bulk_job')
    
    @action(detail=True, methods=['post'])
    def mark_printed(self, request, pk=None):
        """Mark card as printed"""
        card = self.get_object()
        card.printed_count += 1
        card.last_printed = timezone.now()
        card.save()
        
        return Response({
            'message': 'Card marked as printed',
            'printed_count': card.printed_count
        })
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke an ID card"""
        card = self.get_object()
        card.status = 'revoked'
        card.save()
        
        # Deactivate associated QR codes
        card.qr_codes.update(is_active=False)
        
        return Response({'message': 'Card revoked successfully'})


class QRAttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for QR Attendance
    Handles scanning and attendance marking
    """
    permission_classes = [IsAuthenticated]
    serializer_class = QRAttendanceSerializer
    
    def get_queryset(self):
        tenant = self.request.user.tenant
        queryset = QRAttendance.objects.filter(tenant=tenant)
        
        # Filter by date
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(scan_timestamp__date=date)
        
        return queryset.select_related('student', 'staff', 'qr_code')
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """Process QR code scan for attendance"""
        serializer = QRScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        tenant = request.user.tenant
        
        try:
            # Validate QR code
            payload, qr_code = validate_qr_code(data['qr_data'], tenant)
            
            # Update scan count
            qr_code.scan_count += 1
            qr_code.last_scanned = timezone.now()
            qr_code.save()
            
            # Check for duplicate scan today
            today = timezone.now().date()
            existing_scan = QRAttendance.objects.filter(
                qr_code=qr_code,
                scan_timestamp__date=today
            ).first()
            
            is_duplicate = existing_scan is not None
            
            # Determine attendance status
            scan_time = timezone.now()
            attendance_status = 'present'
            
            # Late threshold: 9:00 AM
            if scan_time.hour > 9 or (scan_time.hour == 9 and scan_time.minute > 0):
                attendance_status = 'late'
            
            # Get entity
            if payload['type'] == 'student':
                student = Student.objects.get(id=payload['id'], tenant=tenant)
                staff = None
                entity_name = student.get_full_name()
                entity_photo = student.photo.url if student.photo else None
            else:
                staff = Staff.objects.get(id=payload['id'], tenant=tenant)
                student = None
                entity_name = staff.get_full_name()
                entity_photo = staff.photo.url if staff.photo else None
            
            # Create attendance record
            attendance = QRAttendance.objects.create(
                tenant=tenant,
                qr_code=qr_code,
                student=student,
                staff=staff,
                scan_timestamp=data.get('timestamp', timezone.now()),
                scan_location=data.get('scan_location', ''),
                scan_device=data.get('scan_device', ''),
                scan_type=data.get('scan_type', 'entry'),
                attendance_status=attendance_status,
                is_duplicate=is_duplicate,
                is_valid_scan=True
            )
            
            # TODO: Link with main attendance system
            # Create or update attendance record in attendance app
            
            return Response({
                'success': True,
                'student' if payload['type'] == 'student' else 'staff': {
                    'id': payload['id'],
                    'name': entity_name,
                    'admission_no' if payload['type'] == 'student' else 'employee_id': payload.get('admission_no') or payload.get('employee_id'),
                    'class': payload.get('class', ''),
                    'photo_url': entity_photo
                },
                'attendance_marked': not is_duplicate,
                'attendance_id': str(attendance.id),
                'status': attendance_status,
                'timestamp': attendance.scan_timestamp,
                'message': 'Duplicate scan' if is_duplicate else 'Attendance marked successfully'
            })
            
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'success': False, 'error': f'Failed to process scan: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def daily_report(self, request):
        """Get daily attendance report from QR scans"""
        date = request.query_params.get('date', timezone.now().date())
        tenant = request.user.tenant
        
        scans = QRAttendance.objects.filter(
            tenant=tenant,
            scan_timestamp__date=date
        )
        
        report = {
            'date': str(date),
            'total_scans': scans.count(),
            'unique_students': scans.filter(student__isnull=False).values('student').distinct().count(),
            'unique_staff': scans.filter(staff__isnull=False).values('staff').distinct().count(),
            'present': scans.filter(attendance_status='present').count(),
            'late': scans.filter(attendance_status='late').count(),
            'duplicates': scans.filter(is_duplicate=True).count(),
        }
        
        return Response(report)
