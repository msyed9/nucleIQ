"""
Certificate Management Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction

from .models import CertificateTemplate, CertificateRequest, GeneratedCertificate
from .serializers import (
    CertificateTemplateSerializer, CertificateRequestSerializer,
    CertificateRequestListSerializer, GeneratedCertificateSerializer,
    CreateCertificateRequestSerializer, ApproveCertificateRequestSerializer,
    GenerateCertificateSerializer
)
from .generator import generate_certificate
from core.middleware import get_current_tenant


class CertificateTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for CertificateTemplate management."""
    
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'content']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return CertificateTemplate.objects.filter(
            tenant=tenant,
            is_deleted=False
        )
    
    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant())
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active certificate templates."""
        tenant = get_current_tenant()
        templates = CertificateTemplate.objects.filter(
            tenant=tenant,
            is_deleted=False,
            is_active=True
        )
        
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class CertificateRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for CertificateRequest management."""
    
    serializer_class = CertificateRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'student', 'template']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'reason']
    ordering_fields = ['requested_at', 'approved_at']
    ordering = ['-requested_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        queryset = CertificateRequest.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('student', 'template', 'approved_by')
        
        # Filter by user role
        user = self.request.user
        
        # Check if user is staff
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=user, is_deleted=False)
            # Staff can see all requests
        except Staff.DoesNotExist:
            # Students can only see their own requests
            try:
                from students.models import Student
                student = Student.objects.get(user=user, is_deleted=False)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                # Parent can see their children's requests
                queryset = queryset.filter(student__parent=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CertificateRequestListSerializer
        return CertificateRequestSerializer
    
    @action(detail=False, methods=['post'])
    def create_request(self, request):
        """
        Create a new certificate request.
        
        POST /api/certificates/requests/create_request/
        {
            "student_id": "uuid",
            "template_id": "uuid",
            "reason": "For visa application"
        }
        """
        serializer = CreateCertificateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student_id = serializer.validated_data['student_id']
        template_id = serializer.validated_data['template_id']
        reason = serializer.validated_data.get('reason', '')
        
        # Verify student exists
        try:
            from students.models import Student
            student = Student.objects.get(pk=student_id, is_deleted=False)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify template exists
        try:
            template = CertificateTemplate.objects.get(
                pk=template_id,
                tenant=get_current_tenant(),
                is_deleted=False,
                is_active=True
            )
        except CertificateTemplate.DoesNotExist:
            return Response(
                {'error': 'Certificate template not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create request
        cert_request = CertificateRequest.objects.create(
            tenant=get_current_tenant(),
            student=student,
            template=template,
            reason=reason
        )
        
        response_serializer = CertificateRequestSerializer(cert_request)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a certificate request and optionally generate certificate.
        
        POST /api/certificates/requests/{id}/approve/
        {
            "auto_generate": true
        }
        """
        cert_request = self.get_object()
        
        if cert_request.status != 'PENDING':
            return Response(
                {'error': f'Request is already {cert_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get staff profile
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Only staff can approve certificate requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        auto_generate = request.data.get('auto_generate', True)
        
        with transaction.atomic():
            cert_request.status = 'APPROVED'
            cert_request.approved_by = staff
            cert_request.approved_at = timezone.now()
            cert_request.save()
            
            # Auto-generate certificate if requested
            if auto_generate:
                try:
                    generated_cert = generate_certificate(cert_request)
                    cert_request.status = 'GENERATED'
                    cert_request.save()
                    
                    return Response({
                        'status': 'generated',
                        'certificate_number': generated_cert.certificate_number,
                        'pdf_url': generated_cert.pdf_file.url if generated_cert.pdf_file else None
                    })
                except Exception as e:
                    return Response(
                        {'error': f'Failed to generate certificate: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        response_serializer = CertificateRequestSerializer(cert_request)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a certificate request.
        
        POST /api/certificates/requests/{id}/reject/
        {
            "reason": "Incomplete information"
        }
        """
        cert_request = self.get_object()
        
        if cert_request.status != 'PENDING':
            return Response(
                {'error': f'Request is already {cert_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get staff profile
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Only staff can reject certificate requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cert_request.status = 'REJECTED'
        cert_request.approved_by = staff
        cert_request.approved_at = timezone.now()
        cert_request.save()
        
        response_serializer = CertificateRequestSerializer(cert_request)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending certificate requests."""
        tenant = get_current_tenant()
        pending_requests = CertificateRequest.objects.filter(
            tenant=tenant,
            is_deleted=False,
            status='PENDING'
        ).select_related('student', 'template')
        
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get certificate requests for current user (student/parent)."""
        user = request.user
        tenant = get_current_tenant()
        
        # Try to get student
        try:
            from students.models import Student
            student = Student.objects.get(user=user, is_deleted=False)
            requests = CertificateRequest.objects.filter(
                tenant=tenant,
                is_deleted=False,
                student=student
            ).select_related('student', 'template', 'approved_by')
        except Student.DoesNotExist:
            # Try parent
            requests = CertificateRequest.objects.filter(
                tenant=tenant,
                is_deleted=False,
                student__parent=user
            ).select_related('student', 'template', 'approved_by')
        
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)


class GeneratedCertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for GeneratedCertificate (read-only)."""
    
    serializer_class = GeneratedCertificateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['verified', 'issued_date']
    search_fields = ['certificate_number', 'request__student__user__first_name']
    ordering_fields = ['issued_date', 'created_at']
    ordering = ['-issued_date']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return GeneratedCertificate.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('request__student', 'request__template')
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """
        Generate certificate from an approved request.
        
        POST /api/certificates/generated/{id}/generate/
        {
            "issue_date": "2026-01-04"
        }
        """
        serializer = GenerateCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        request_id = serializer.validated_data['request_id']
        issue_date = serializer.validated_data.get('issue_date')
        
        try:
            cert_request = CertificateRequest.objects.get(
                pk=request_id,
                tenant=get_current_tenant(),
                is_deleted=False
            )
        except CertificateRequest.DoesNotExist:
            return Response(
                {'error': 'Certificate request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if cert_request.status != 'APPROVED':
            return Response(
                {'error': 'Request must be approved before generating certificate'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already generated
        if hasattr(cert_request, 'generated_certificate'):
            return Response(
                {'error': 'Certificate already generated for this request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            generated_cert = generate_certificate(cert_request, issue_date)
            cert_request.status = 'GENERATED'
            cert_request.save()
            
            response_serializer = GeneratedCertificateSerializer(generated_cert)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate certificate: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """
        Verify a certificate by certificate number.
        
        GET /api/certificates/generated/{certificate_number}/verify/
        """
        certificate = self.get_object()
        
        return Response({
            'verified': certificate.verified,
            'certificate_number': certificate.certificate_number,
            'student_name': certificate.request.student.get_full_name(),
            'template_name': certificate.request.template.name,
            'issued_date': certificate.issued_date,
            'is_valid': certificate.verified
        })
