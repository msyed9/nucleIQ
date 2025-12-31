"""
CRM Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.utils import timezone
import csv
import io

from .models import Lead, LeadInteraction, LeadDocument, Visitor, AdmissionPortalAccess
from .serializers import (
    LeadSerializer, LeadInteractionSerializer, LeadDocumentSerializer,
    VisitorSerializer, AdmissionPortalAccessSerializer,
    LeadStatusUpdateSerializer, LeadBulkImportSerializer, LeadConversionSerializer
)
from core.middleware import get_current_tenant


class LeadViewSet(viewsets.ModelViewSet):
    """ViewSet for Lead management."""
    
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['source', 'status', 'priority', 'assigned_to', 'grade_applying_for']
    search_fields = ['lead_number', 'student_name', 'parent_name', 'parent_email', 'parent_phone']
    ordering_fields = ['created_at', 'next_follow_up', 'student_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Lead.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('grade_applying_for', 'academic_year', 'assigned_to')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update lead status."""
        lead = self.get_object()
        serializer = LeadStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        old_status = lead.status
        new_status = serializer.validated_data['status']
        
        lead.status = new_status
        
        # Handle status-specific logic
        if new_status == 'LOST':
            lead.lost_at = timezone.now()
            lead.lost_reason = serializer.validated_data.get('notes', '')
        
        lead.save()
        
        # Create interaction log
        LeadInteraction.objects.create(
            tenant=lead.tenant,
            lead=lead,
            interaction_type='NOTE',
            notes=f"Status changed from {old_status} to {new_status}. {serializer.validated_data.get('notes', '')}",
            staff=request.user.staff_profile if hasattr(request.user, 'staff_profile') else None
        )
        
        return Response(self.get_serializer(lead).data)
    
    @action(detail=True, methods=['post'])
    def convert_to_student(self, request, pk=None):
        """Convert lead to student."""
        lead = self.get_object()
        
        if lead.converted_to_student:
            return Response(
                {'error': 'Lead already converted to student'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = LeadConversionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # TODO: Create student record
        # This would involve creating a Student object with data from lead
        
        lead.converted_to_student = True
        lead.converted_at = timezone.now()
        lead.status = 'ADMITTED'
        lead.save()
        
        return Response(self.get_serializer(lead).data)
    
    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Bulk import leads from CSV/Excel."""
        serializer = LeadBulkImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        tenant = get_current_tenant()
        
        # Read CSV
        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created_count = 0
        errors = []
        
        for row in reader:
            try:
                lead = Lead.objects.create(
                    tenant=tenant,
                    source=row.get('source', 'OTHER'),
                    student_name=row['student_name'],
                    parent_name=row['parent_name'],
                    parent_email=row['parent_email'],
                    parent_phone=row['parent_phone'],
                    # Add more fields as needed
                )
                created_count += 1
            except Exception as e:
                errors.append(f"Row {reader.line_num}: {str(e)}")
        
        return Response({
            'created': created_count,
            'errors': errors
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export leads to CSV."""
        from django.http import HttpResponse
        
        queryset = self.filter_queryset(self.get_queryset())
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Lead Number', 'Student Name', 'Parent Name', 'Parent Email',
            'Parent Phone', 'Source', 'Status', 'Grade', 'Created At'
        ])
        
        for lead in queryset:
            writer.writerow([
                lead.lead_number,
                lead.student_name,
                lead.parent_name,
                lead.parent_email,
                lead.parent_phone,
                lead.get_source_display(),
                lead.get_status_display(),
                lead.grade_applying_for.name if lead.grade_applying_for else '',
                lead.created_at.strftime('%Y-%m-%d')
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get lead analytics."""
        queryset = self.get_queryset()
        
        analytics = {
            'total_leads': queryset.count(),
            'by_source': list(queryset.values('source').annotate(count=Count('id'))),
            'by_status': list(queryset.values('status').annotate(count=Count('id'))),
            'by_priority': list(queryset.values('priority').annotate(count=Count('id'))),
            'conversion_rate': self._calculate_conversion_rate(queryset),
            'pending_follow_ups': queryset.filter(
                next_follow_up__isnull=False,
                next_follow_up__lte=timezone.now(),
                status__in=['NEW', 'CONTACTED', 'CAMPUS_VISIT']
            ).count()
        }
        
        return Response(analytics)
    
    def _calculate_conversion_rate(self, queryset):
        total = queryset.count()
        if total == 0:
            return 0
        admitted = queryset.filter(status='ADMITTED').count()
        return round((admitted / total) * 100, 2)
    
    @action(detail=False, methods=['get'])
    def kanban_data(self, request):
        """Get data formatted for Kanban board."""
        queryset = self.get_queryset()
        
        kanban = {}
        for status_choice in Lead.STATUS_CHOICES:
            status_code = status_choice[0]
            leads = queryset.filter(status=status_code)
            kanban[status_code] = {
                'name': status_choice[1],
                'leads': self.get_serializer(leads, many=True).data,
                'count': leads.count()
            }
        
        return Response(kanban)


class LeadInteractionViewSet(viewsets.ModelViewSet):
    """ViewSet for LeadInteraction management."""
    
    serializer_class = LeadInteractionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['lead', 'interaction_type', 'staff']
    search_fields = ['subject', 'notes']
    ordering = ['-interaction_date']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return LeadInteraction.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('lead', 'staff')


class LeadDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for LeadDocument management."""
    
    serializer_class = LeadDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['lead', 'document_type', 'verified']
    search_fields = ['title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return LeadDocument.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('lead', 'verified_by')
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a document."""
        document = self.get_object()
        
        document.verified = True
        document.verified_by = request.user.staff_profile if hasattr(request.user, 'staff_profile') else None
        document.verified_at = timezone.now()
        document.save()
        
        return Response(self.get_serializer(document).data)


class VisitorViewSet(viewsets.ModelViewSet):
    """ViewSet for Visitor management."""
    
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['purpose', 'meeting_with']
    search_fields = ['visitor_number', 'name', 'phone', 'organization']
    ordering = ['-check_in_time']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Visitor.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('lead', 'meeting_with')
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Check out a visitor."""
        visitor = self.get_object()
        
        if visitor.check_out_time:
            return Response(
                {'error': 'Visitor already checked out'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visitor.check_out_time = timezone.now()
        visitor.feedback = request.data.get('feedback', '')
        visitor.save()
        
        return Response(self.get_serializer(visitor).data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently checked-in visitors."""
        visitors = self.get_queryset().filter(check_out_time__isnull=True)
        serializer = self.get_serializer(visitors, many=True)
        return Response(serializer.data)


class PublicLeadViewSet(viewsets.ModelViewSet):
    """Public endpoint for web form submissions."""
    
    serializer_class = LeadSerializer
    permission_classes = [AllowAny]
    http_method_names = ['post']
    
    def create(self, request, *args, **kwargs):
        """Create lead from public web form."""
        # Get tenant from domain or header
        tenant = get_current_tenant()
        
        data = request.data.copy()
        data['source'] = 'WEBSITE'
        data['status'] = 'NEW'
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        lead = serializer.save(tenant=tenant)
        
        # TODO: Send confirmation email to parent
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
